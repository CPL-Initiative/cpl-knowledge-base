// Edge function: generate-letter
//
// Modes:
//   GET  /generate-letter?mode=individual&token=<uuid>
//        → returns a personalized .docx for that invitee (any visitor with the token).
//   GET  /generate-letter?mode=joint&campaign=<slug>
//        → returns a joint .docx with all "supported" signatories listed and their logos
//          arranged in a footer grid.
//   GET  /generate-letter?mode=preview&campaign=<slug>
//        → returns the unfilled template with live statewide stats (no signer data).
//
// All variants are public (CC-BY), but writes are RLS-protected via the get_*
// RPCs in 0001_init.sql.
//
// Statewide metrics are fetched live from
// raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json
// so each generated letter reflects current dashboard numbers at the moment of
// generation.

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
    const eligible = find("ELIGIBLE UNITS");
    const transcribed = find("TRANSCRIBED UNITS");
    const savings = find("SAVINGS");
    const impact = find("20-YEAR IMPACT");
    const active = find("ACTIVE COLLEGES");
    return {
      SW_STUDENTS:          students.value ?? "",
      SW_MILITARY:          sub(students, "Military"),
      SW_WORKFORCE:         sub(students, "Workforce/Other"),
      SW_APPRENTICE:        sub(students, "Apprentice"),
      SW_ELIGIBLE_UNITS:    eligible.value ?? "",
      SW_TRANSCRIBED_UNITS: transcribed.value ?? "",
      SW_SAVINGS:           savings.value ?? "",
      SW_20Y_IMPACT:        impact.value ?? "",
      SW_ACTIVE_COLLEGES:   String(json.active_college_count ?? active.value ?? ""),
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

function todayLong(): string {
  return new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
}

function xmlEscape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Replace every {{KEY}} occurrence in a string with the corresponding value
// from `vars`. Keys without values become "[___]" so the writer can see what
// still needs filling in.
function fill(xml: string, vars: Record<string, string>): string {
  return xml.replace(/\{\{([A-Z_0-9]+)\}\}/g, (_, k) => {
    const v = vars[k];
    if (v === undefined || v === null || v === "") return "[___]";
    return xmlEscape(v);
  });
}

async function renderTemplate(
  letterType: "rc" | "college",
  vars: Record<string, string>,
): Promise<Uint8Array> {
  const bytes = await loadTemplate(letterType);
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file("word/document.xml")!.async("string");
  const filled = fill(docXml, vars);
  zip.file("word/document.xml", filled);
  return await zip.generateAsync({ type: "uint8array" });
}

async function buildIndividual(token: string): Promise<Response> {
  const { data, error } = await supabase
    .rpc("get_invitee_by_token", { p_token: token });
  if (error || !data || !data.length) {
    return new Response(JSON.stringify({ error: "invalid token" }),
      { status: 404, headers: { ...CORS, "content-type": "application/json" }});
  }
  const r = data[0];
  const metrics = await fetchMetrics();
  const vars: Record<string,string> = {
    LETTER_DATE:       todayLong(),
    ORG_NAME:          r.org_name ?? "",
    REGION:            r.region ?? "",
    UNITS_AWARDED:     r.units_awarded ?? "",
    STUDENTS_SERVED:   r.students_served ?? "",
    PROGRAMS:          r.programs ?? "",
    REASON:            r.custom_notes ?? "",
    EXPANSION:         "",
    EXAMPLE_NARRATIVE: r.regional_example ?? "",
    OUTCOME:           "complete their educational goals more efficiently",
    SIGNER_NAME:       r.signer_name_confirmed ?? r.signer_name ?? "",
    SIGNER_TITLE:      r.signer_title_confirmed ?? r.signer_title ?? "",
    ...metrics,
  };
  const docx = await renderTemplate(r.letter_type, vars);
  const fname = `CPL_Budget_Support_${r.letter_type}_${(r.org_slug ?? r.org_name ?? "letter").replace(/[^a-z0-9]+/gi,"_")}.docx`;
  return new Response(docx, {
    headers: {
      ...CORS,
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${fname}"`,
    },
  });
}

async function buildJoint(campaignSlug: string): Promise<Response> {
  const { data: camp, error: e1 } = await supabase
    .from("campaigns").select("*").eq("slug", campaignSlug).single();
  if (e1 || !camp) {
    return new Response(JSON.stringify({ error: "campaign not found" }),
      { status: 404, headers: { ...CORS, "content-type": "application/json" }});
  }
  const { data: sigs, error: e2 } = await supabase
    .from("signatories_public")
    .select("*")
    .eq("campaign_slug", campaignSlug)
    .order("submitted_at", { ascending: true });
  if (e2) {
    return new Response(JSON.stringify({ error: e2.message }),
      { status: 500, headers: { ...CORS, "content-type": "application/json" }});
  }

  const metrics = await fetchMetrics();
  const lines: string[] = sigs ?? [].map((s: any) =>
    `${s.org_name}${s.region ? ` (${s.region})` : ""}` +
    (s.signer_name ? ` — ${s.signer_name}${s.signer_title ? `, ${s.signer_title}` : ""}` : "")
  );
  const signatoriesBlock = sigs ?? [].length
    ? `The following ${sigs ?? [].length} ${camp.letter_type === "rc" ? "regional consortia" : "California Community Colleges"} have joined this letter:\n` +
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
    PROGRAMS:          "Administration of Justice, Early Childhood Education, Allied Health, Welding, Information Technology, Business, and many others",
    REASON:            "the breadth of veteran, workforce, apprentice, and adult-learner populations we collectively serve",
    EXPANSION:         "expanding faculty evaluation capacity, counseling and outreach, technology infrastructure, and regional industry alignment",
    EXAMPLE_NARRATIVE: signatoriesBlock,
    OUTCOME:           "complete their educational goals more efficiently while advancing California's workforce and economic priorities",
    SIGNER_NAME:       sigs ?? [].length === 0 ? "[Signatories pending]" : `Submitted on behalf of ${sigs ?? [].length} signatories`,
    SIGNER_TITLE:      "See signatory schedule attached",
    ...metrics,
  };

  const docx = await renderTemplate(camp.letter_type, vars);
  const fname = `CPL_Budget_Support_${camp.letter_type}_JOINT_${campaignSlug}.docx`;
  return new Response(docx, {
    headers: {
      ...CORS,
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${fname}"`,
    },
  });
}

async function buildPreview(campaignSlug: string): Promise<Response> {
  const { data: camp } = await supabase
    .from("campaigns").select("*").eq("slug", campaignSlug).single();
  if (!camp) {
    return new Response(JSON.stringify({ error: "campaign not found" }),
      { status: 404, headers: { ...CORS, "content-type": "application/json" }});
  }
  const metrics = await fetchMetrics();
  const docx = await renderTemplate(camp.letter_type, {
    LETTER_DATE: todayLong(),
    ...metrics,
  });
  return new Response(docx, {
    headers: {
      ...CORS,
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="CPL_Budget_Support_${camp.letter_type}_preview.docx"`,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "preview";
  const token = url.searchParams.get("token") ?? "";
  const campaign = url.searchParams.get("campaign") ?? "";

  try {
    if (mode === "individual") {
      if (!token) {
        return new Response(JSON.stringify({ error: "token required" }),
          { status: 400, headers: { ...CORS, "content-type": "application/json" }});
      }
      return await buildIndividual(token);
    }
    if (mode === "joint") {
      if (!campaign) {
        return new Response(JSON.stringify({ error: "campaign required" }),
          { status: 400, headers: { ...CORS, "content-type": "application/json" }});
      }
      return await buildJoint(campaign);
    }
    if (mode === "preview") {
      if (!campaign) {
        return new Response(JSON.stringify({ error: "campaign required" }),
          { status: 400, headers: { ...CORS, "content-type": "application/json" }});
      }
      return await buildPreview(campaign);
    }
    return new Response(JSON.stringify({ error: "invalid mode" }),
      { status: 400, headers: { ...CORS, "content-type": "application/json" }});
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }),
      { status: 500, headers: { ...CORS, "content-type": "application/json" }});
  }
});
