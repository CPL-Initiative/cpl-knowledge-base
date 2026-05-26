// Edge function: generate-letter
//
// Modes:
//   GET ?mode=individual&token=<uuid>     → per-invitee personalized DOCX
//   GET ?mode=joint&campaign=<slug>       → consolidated DOCX with all signatories
//   GET ?mode=statewide&campaign=<slug>   → single-author CPL Initiative letter
//   GET ?mode=preview&campaign=<slug>     → template with statewide stats only
//
// Letter copy lives in public.letter_blocks (curatable via the letter-curator
// function). Templates fetched from cpl-knowledge-base/main carry only the
// scaffolding (date, addressees, subject, signature placeholders) plus
// {{P_<KEY>}} tokens that are resolved from the blocks table at runtime,
// then inline {{TOKEN}}s (ORG_NAME, SW_STUDENTS, etc.) are substituted.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const METRICS_URL =
  "https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json";
const TEMPLATE_BASE_URL =
  Deno.env.get("TEMPLATE_BASE_URL") ??
  "https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/budget-support/templates";

const templateCache = new Map<string, Uint8Array>();
async function loadTemplate(letterType: "rc" | "college"): Promise<Uint8Array> {
  const cached = templateCache.get(letterType);
  if (cached) return cached;
  const url = `${TEMPLATE_BASE_URL}/template_${letterType}.docx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`template fetch failed: ${res.status} ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  templateCache.set(letterType, bytes);
  return bytes;
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Metrics = Record<string, string>;
type Blocks  = Record<string, string>;
type Scope   = "individual" | "joint" | "statewide" | "all";

async function fetchMetrics(): Promise<Metrics> {
  try {
    const res = await fetch(METRICS_URL, { headers: { "cache-control": "no-cache" }});
    if (!res.ok) throw new Error(`metrics fetch failed: ${res.status}`);
    const json = await res.json();
    const find = (title: string) =>
      json.metrics.find((m: any) => m.title === title) ?? {};
    const sub = (m: any, label: string) =>
      (m.breakdowns ?? []).find((b: any) => b.label === label)?.value ?? "";
    const students = find("STUDENTS SERVED");
    return {
      SW_STUDENTS:          students.value ?? "",
      SW_MILITARY:          sub(students, "Military"),
      SW_WORKFORCE:         sub(students, "Workforce/Other"),
      SW_APPRENTICE:        sub(students, "Apprentice"),
      SW_ELIGIBLE_UNITS:    find("ELIGIBLE UNITS").value ?? "",
      SW_TRANSCRIBED_UNITS: find("TRANSCRIBED UNITS").value ?? "",
      SW_SAVINGS:           find("SAVINGS").value ?? "",
      SW_20Y_IMPACT:        find("20-YEAR IMPACT").value ?? "",
      SW_ACTIVE_COLLEGES:   String(json.active_college_count ?? ""),
      SW_TOTAL_COLLEGES:    String(json.college_count ?? ""),
      SW_LEADING_COLLEGES:  String(json.tiers?.leading?.count ?? ""),
    };
  } catch (e) {
    console.error("metrics fallback:", e);
    return {
      SW_STUDENTS: "45,838", SW_MILITARY: "23,970", SW_WORKFORCE: "21,943",
      SW_APPRENTICE: "739", SW_ELIGIBLE_UNITS: "207k", SW_TRANSCRIBED_UNITS: "99k",
      SW_SAVINGS: "$291M", SW_20Y_IMPACT: "$1.17B", SW_ACTIVE_COLLEGES: "98",
      SW_TOTAL_COLLEGES: "115", SW_LEADING_COLLEGES: "14",
    };
  }
}

// Per-scope preference order: requested scope first, falling back to 'all'.
async function loadBlocks(campaignId: string, scope: Scope): Promise<Blocks> {
  const { data, error } = await supabase
    .from("letter_blocks_public")
    .select("block_key, scope, content")
    .eq("campaign_id", campaignId)
    .in("scope", scope === "all" ? ["all"] : ["all", scope]);
  if (error) {
    console.error("loadBlocks failed:", error);
    return {};
  }
  const out: Blocks = {};
  for (const row of data ?? []) {
    // requested scope wins over 'all'
    if (row.scope === scope || (row.scope === "all" && !(row.block_key in out))) {
      out[row.block_key] = row.content;
    }
  }
  // second pass: prefer requested scope when both present
  for (const row of data ?? []) {
    if (row.scope === scope) out[row.block_key] = row.content;
  }
  return out;
}

function todayLong(): string {
  return new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
}

function xmlEscape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Two-phase fill: first expand {{P_<KEY>}} from blocks (which may themselves
// contain inline {{TOKEN}}s), then expand inline tokens from vars.
function fill(xml: string, blocks: Blocks, vars: Record<string, string>): string {
  // Phase 1: paragraph-level blocks
  let out = xml.replace(/\{\{P_([A-Z_0-9]+)\}\}/g, (_, k) => {
    const key = k.toLowerCase();
    const v = blocks[key];
    if (v === undefined || v === null || v === "") return `[___ ${key} block missing ___]`;
    return xmlEscape(v);
  });
  // Phase 2: inline tokens (these may have been introduced by phase 1)
  out = out.replace(/\{\{([A-Z_0-9]+)\}\}/g, (_, k) => {
    const v = vars[k];
    if (v === undefined || v === null || v === "") return "[___]";
    return xmlEscape(v);
  });
  return out;
}

async function renderTemplate(
  letterType: "rc" | "college",
  blocks: Blocks,
  vars: Record<string, string>,
): Promise<Uint8Array> {
  const bytes = await loadTemplate(letterType);
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file("word/document.xml")!.async("string");
  const filled = fill(docXml, blocks, vars);
  zip.file("word/document.xml", filled);
  return await zip.generateAsync({ type: "uint8array" });
}

async function getCampaign(slug: string) {
  const { data } = await supabase
    .from("campaigns").select("*").eq("slug", slug).single();
  return data;
}

function fnameSafe(s: string): string {
  return (s || "letter").replace(/[^a-z0-9]+/gi, "_");
}

function docxResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(bytes, {
    headers: {
      ...CORS,
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function jsonError(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

// ---------- mode handlers ----------

async function buildIndividual(token: string): Promise<Response> {
  const { data, error } = await supabase
    .rpc("get_invitee_by_token", { p_token: token });
  if (error || !data || !data.length) return jsonError("invalid token", 404);
  const r = data[0];

  const [metrics, blocks] = await Promise.all([
    fetchMetrics(),
    loadBlocks(r.campaign_id, "individual"),
  ]);

  const vars: Record<string,string> = {
    LETTER_DATE:       todayLong(),
    ORG_NAME:          r.org_name ?? "",
    REGION:            r.region ?? "",
    UNITS_AWARDED:     r.units_awarded ?? "",
    STUDENTS_SERVED:   r.students_served ?? "",
    PROGRAMS:          r.programs ?? "",
    REASON:            r.custom_notes ?? "",
    EXPANSION:         "increased faculty evaluation capacity, counseling and outreach support, technology infrastructure, and stronger alignment with regional industry partners",
    EXAMPLE_NARRATIVE: r.regional_example ?? "",
    OUTCOME:           "complete their educational goals more efficiently",
    SIGNER_NAME:       r.signer_name_confirmed ?? r.signer_name ?? "",
    SIGNER_TITLE:      r.signer_title_confirmed ?? r.signer_title ?? "",
    ...metrics,
  };
  const docx = await renderTemplate(r.letter_type, blocks, vars);
  return docxResponse(docx,
    `CPL_Budget_Support_${r.letter_type}_${fnameSafe(r.org_slug ?? r.org_name)}.docx`);
}

async function buildJoint(slug: string): Promise<Response> {
  const camp = await getCampaign(slug);
  if (!camp) return jsonError("campaign not found", 404);

  const { data: sigs } = await supabase
    .from("signatories_public")
    .select("*")
    .eq("campaign_slug", slug)
    .order("submitted_at", { ascending: true });

  const [metrics, blocks] = await Promise.all([
    fetchMetrics(),
    loadBlocks(camp.id, "joint"),
  ]);

  const lines = (sigs ?? []).map((s: any) =>
    `${s.org_name}${s.region ? ` (${s.region})` : ""}` +
    (s.signer_name ? ` — ${s.signer_name}${s.signer_title ? `, ${s.signer_title}` : ""}` : "")
  );
  const signatoriesBlock = lines.length
    ? `The following ${lines.length} ${camp.letter_type === "rc" ? "regional consortia" : "California Community Colleges"} have joined this letter:\n` +
      lines.map((l) => `  • ${l}`).join("\n")
    : "[Signatories pending]";

  const vars: Record<string,string> = {
    LETTER_DATE: todayLong(),
    ORG_NAME: camp.letter_type === "rc"
      ? "the undersigned California Community Colleges Regional Consortia"
      : "the undersigned California Community Colleges",
    REGION:            "California",
    UNITS_AWARDED:     "[see attached signatory schedule]",
    STUDENTS_SERVED:   "[see attached signatory schedule]",
    PROGRAMS:          "Law Enforcement (POST), Emergency Medical Services, Construction Trades, First Responder Training, Electrician Apprenticeships, and Behavioral Health",
    REASON:            "the breadth of veteran, workforce, apprentice, and adult-learner populations we collectively serve",
    EXPANSION:         "expanding faculty evaluation capacity, counseling and outreach, technology infrastructure, and regional industry alignment",
    EXAMPLE_NARRATIVE: signatoriesBlock,
    OUTCOME:           "complete their educational goals more efficiently while advancing California's workforce and economic priorities",
    SIGNER_NAME:       lines.length === 0 ? "[Signatories pending]" : `Submitted on behalf of ${lines.length} signatories`,
    SIGNER_TITLE:      "See signatory schedule attached",
    ...metrics,
  };

  const docx = await renderTemplate(camp.letter_type, blocks, vars);
  return docxResponse(docx, `CPL_Budget_Support_${camp.letter_type}_JOINT_${slug}.docx`);
}

async function buildStatewide(slug: string): Promise<Response> {
  const camp = await getCampaign(slug);
  if (!camp) return jsonError("campaign not found", 404);

  const [metrics, blocks] = await Promise.all([
    fetchMetrics(),
    loadBlocks(camp.id, "statewide"),
  ]);

  const vars: Record<string,string> = {
    LETTER_DATE:       todayLong(),
    ORG_NAME:          "the CPL Initiative at the California Community Colleges Chancellor's Office",
    REGION:            "",
    PROGRAMS:          "",
    UNITS_AWARDED:     "",
    STUDENTS_SERVED:   "",
    REASON:            "",
    EXPANSION:         "",
    EXAMPLE_NARRATIVE: "",
    OUTCOME:           "",
    SIGNER_NAME:       "[Signer Name]",
    SIGNER_TITLE:      "[Signer Title]",
    ...metrics,
  };
  const docx = await renderTemplate(camp.letter_type, blocks, vars);
  return docxResponse(docx, `CPL_Budget_Support_${camp.letter_type}_STATEWIDE_${slug}.docx`);
}

async function buildPreview(slug: string): Promise<Response> {
  const camp = await getCampaign(slug);
  if (!camp) return jsonError("campaign not found", 404);

  const [metrics, blocks] = await Promise.all([
    fetchMetrics(),
    loadBlocks(camp.id, "all"),
  ]);

  const docx = await renderTemplate(camp.letter_type, blocks, {
    LETTER_DATE: todayLong(),
    ...metrics,
  });
  return docxResponse(docx, `CPL_Budget_Support_${camp.letter_type}_preview.docx`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "preview";
  const token = url.searchParams.get("token") ?? "";
  const campaign = url.searchParams.get("campaign") ?? "";

  try {
    if (mode === "individual") {
      if (!token) return jsonError("token required");
      return await buildIndividual(token);
    }
    if (mode === "joint") {
      if (!campaign) return jsonError("campaign required");
      return await buildJoint(campaign);
    }
    if (mode === "statewide") {
      if (!campaign) return jsonError("campaign required");
      return await buildStatewide(campaign);
    }
    if (mode === "preview") {
      if (!campaign) return jsonError("campaign required");
      return await buildPreview(campaign);
    }
    return jsonError("invalid mode");
  } catch (e) {
    console.error(e);
    return jsonError(String((e as any)?.message ?? e), 500);
  }
});
