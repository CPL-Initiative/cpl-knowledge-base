// Invitee endorsement page logic.
// Loaded from /budget-support/?t=<token>. Uses the publishable anon key — all
// writes are gated by the SECURITY DEFINER RPCs (get_invitee_by_token,
// submit_response, record_logo_upload) which validate the token server-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SUPABASE_URL, SUPABASE_ANON, GENERATE_LETTER_URL } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

const $ = (id) => document.getElementById(id);

// ---------- statewide stats source (mirrors edge function fallback) ----------
const STATEWIDE_FALLBACK = {
  SW_STUDENTS: "45,838", SW_MILITARY: "23,970", SW_WORKFORCE: "21,943",
  SW_APPRENTICE: "739", SW_ELIGIBLE_UNITS: "207k", SW_TRANSCRIBED_UNITS: "99k",
  SW_SAVINGS: "$291M", SW_20Y_IMPACT: "$1.17B", SW_ACTIVE_COLLEGES: "98",
  SW_TOTAL_COLLEGES: "115", SW_LEADING_COLLEGES: "14",
};

async function fetchStatewide() {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json"
    );
    const j = await res.json();
    const find = (t) => j.metrics.find((m) => m.title === t) ?? {};
    const sub = (m, l) => (m.breakdowns ?? []).find((b) => b.label === l)?.value ?? "";
    const students = find("STUDENTS SERVED");
    return {
      SW_STUDENTS:          students.value ?? STATEWIDE_FALLBACK.SW_STUDENTS,
      SW_MILITARY:          sub(students, "Military")        || STATEWIDE_FALLBACK.SW_MILITARY,
      SW_WORKFORCE:         sub(students, "Workforce/Other") || STATEWIDE_FALLBACK.SW_WORKFORCE,
      SW_APPRENTICE:        sub(students, "Apprentice")      || STATEWIDE_FALLBACK.SW_APPRENTICE,
      SW_ELIGIBLE_UNITS:    find("ELIGIBLE UNITS").value    || STATEWIDE_FALLBACK.SW_ELIGIBLE_UNITS,
      SW_TRANSCRIBED_UNITS: find("TRANSCRIBED UNITS").value || STATEWIDE_FALLBACK.SW_TRANSCRIBED_UNITS,
      SW_SAVINGS:           find("SAVINGS").value           || STATEWIDE_FALLBACK.SW_SAVINGS,
      SW_20Y_IMPACT:        find("20-YEAR IMPACT").value    || STATEWIDE_FALLBACK.SW_20Y_IMPACT,
      SW_ACTIVE_COLLEGES:   String(j.active_college_count   ?? STATEWIDE_FALLBACK.SW_ACTIVE_COLLEGES),
      SW_TOTAL_COLLEGES:    String(j.college_count          ?? STATEWIDE_FALLBACK.SW_TOTAL_COLLEGES),
      SW_LEADING_COLLEGES:  String(j.tiers?.leading?.count  ?? STATEWIDE_FALLBACK.SW_LEADING_COLLEGES),
    };
  } catch {
    return STATEWIDE_FALLBACK;
  }
}

// ---------- letter body templates (preview only — edge function does authoritative DOCX) ----------
function rcBody(v) {
  return `On behalf of the {{ORG_NAME}}, representing California Community Colleges across the {{REGION}} region, I write to urge you to prioritize continued investment in Credit for Prior Learning (CPL) implementation statewide. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.

Colleges throughout our region have implemented CPL opportunities in programs such as {{PROGRAMS}} and have collectively awarded {{UNITS_AWARDED}} units of CPL credit to {{STUDENTS_SERVED}} students. CPL has been particularly important in our region because {{REASON}}. Additional investment would allow colleges across our consortium to expand CPL opportunities through increased faculty evaluation capacity, counseling and outreach support, technology infrastructure, and stronger alignment with regional industry and workforce partners.

Statewide, CPL has already served {{SW_STUDENTS}} students — including {{SW_MILITARY}} veterans and military-connected learners, {{SW_WORKFORCE}} workforce/other adults, and {{SW_APPRENTICE}} apprentices — across {{SW_ACTIVE_COLLEGES}} of California's {{SW_TOTAL_COLLEGES}} community colleges, with {{SW_LEADING_COLLEGES}} colleges meeting the leading-implementation criteria. Together these colleges have transcribed {{SW_TRANSCRIBED_UNITS}} units of prior learning credit out of {{SW_ELIGIBLE_UNITS}} eligible units identified, generating an estimated {{SW_SAVINGS}} in student cost savings to date and a projected {{SW_20Y_IMPACT}} in 20-year economic impact.

One example of CPL's impact within our region is {{EXAMPLE_NARRATIVE}}. Through CPL, students with prior military, workforce, apprenticeship, or industry experience have been able to {{OUTCOME}}, reducing both the time and cost required to complete their educational goals while helping address critical workforce shortages in our local economy.

Specifically, we urge your support of the May Revise request for $37 million in Credit for Prior Learning funding — $2 million in ongoing funding to sustain CPL infrastructure operations and $35 million in one-time funding to support local college CPL implementation and CPL innovation projects.

We urge you to support policies and funding that sustain and strengthen CPL implementation throughout the California Community Colleges. Thank you for your continued support of California's students and for your commitment to higher education, workforce development, and economic mobility.

Sincerely,
{{SIGNER_NAME}}
{{SIGNER_TITLE}}`;
}

function collegeBody(v) {
  return `On behalf of {{ORG_NAME}}, I write to urge you to prioritize continued investment in Credit for Prior Learning (CPL) across the California Community Colleges. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.

Investing in CPL is essential to California's workforce and economic future. By translating real-world learning into college credit, CPL reduces unnecessary duplication of coursework, lowers costs for students, and helps learners enter or advance within the workforce more quickly. CPL is especially impactful for veterans, working adults, apprentices, and first responders, helping remove longstanding barriers while creating clearer pathways to high-skill, high-wage careers.

Statewide, CPL has already served {{SW_STUDENTS}} students — including {{SW_MILITARY}} veterans and military-connected learners, {{SW_WORKFORCE}} workforce/other adults, and {{SW_APPRENTICE}} apprentices — across {{SW_ACTIVE_COLLEGES}} of California's {{SW_TOTAL_COLLEGES}} community colleges, with {{SW_LEADING_COLLEGES}} colleges meeting the leading-implementation criteria. Together these colleges have transcribed {{SW_TRANSCRIBED_UNITS}} units of prior learning credit out of {{SW_ELIGIBLE_UNITS}} eligible units identified, generating an estimated {{SW_SAVINGS}} in student cost savings to date and a projected {{SW_20Y_IMPACT}} in 20-year economic impact.

Currently, my institution has awarded {{UNITS_AWARDED}} units of CPL credit to {{STUDENTS_SERVED}} students and has implemented CPL opportunities in programs such as {{PROGRAMS}}. CPL has been particularly important for our students because {{REASON}}. Additional investment would allow our college to expand CPL opportunities.

One example of CPL's impact at our college is {{EXAMPLE_NARRATIVE}}. Through CPL, students with prior military, workforce, or industry experience have been able to {{OUTCOME}}, reducing both the time and cost required to complete their educational goals while helping address local workforce needs.

Specifically, I urge your support of the May Revise request for $37 million in Credit for Prior Learning funding — $2 million in ongoing funding to sustain CPL infrastructure operations and $35 million in one-time funding to support local college CPL implementation and CPL innovation projects.

I urge you to support policies and funding that sustain and strengthen CPL implementation throughout the California Community Colleges. Thank you for your continued support of California's students and for your commitment to higher education and workforce opportunity.

Sincerely,
{{SIGNER_NAME}}
{{SIGNER_TITLE}}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c]));
}

function renderPreview(body, vars) {
  return body.replace(/\{\{([A-Z_0-9]+)\}\}/g, (_, k) => {
    const v = vars[k];
    if (v === undefined || v === null || v === "") {
      return `<span class="blank">[___]</span>`;
    }
    // statewide vars come from the dash → render without highlight
    if (k.startsWith("SW_")) return escapeHtml(v);
    return `<span class="filled">${escapeHtml(v)}</span>`;
  });
}

let INVITEE = null;
let STATEWIDE = null;

async function init() {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || params.get("token") || "";
  if (!token) return showInvalid();

  STATEWIDE = await fetchStatewide();

  const { data, error } = await sb.rpc("get_invitee_by_token", { p_token: token });
  if (error || !data || !data.length) return showInvalid();
  INVITEE = data[0];

  $("loading").style.display = "none";
  $("app").style.display = "block";
  $("org-name").textContent = INVITEE.org_name || "your organization";
  if (INVITEE.region) {
    $("org-region-line").textContent = ` (${INVITEE.region} region)`;
  }

  // Pre-fill form from prior response if present
  for (const field of [
    "signer_name_confirmed","signer_title_confirmed",
    "units_awarded","students_served","programs",
    "regional_example","custom_notes",
  ]) {
    if (INVITEE[field]) $(field).value = INVITEE[field];
  }
  if (!$("signer_name_confirmed").value && INVITEE.signer_name) $("signer_name_confirmed").value = INVITEE.signer_name;
  if (!$("signer_title_confirmed").value && INVITEE.signer_title) $("signer_title_confirmed").value = INVITEE.signer_title;

  if (INVITEE.status === "supported") {
    $("already").style.display = "block";
    $("already-when").textContent = new Date(INVITEE.submitted_at).toLocaleString();
  } else if (INVITEE.status === "declined") {
    $("declined-banner").style.display = "block";
  }
  if (INVITEE.logo_path) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/logos/${INVITEE.logo_path}`;
    $("logo-preview").src = url;
    $("logo-preview").style.display = "block";
    $("logo-prompt").textContent = "Logo uploaded — click to replace";
  }

  wireForm();
  updatePreview();
}

function updatePreview() {
  const f = collectForm();
  const vars = {
    ORG_NAME: INVITEE.org_name,
    REGION:   INVITEE.region,
    SIGNER_NAME:   f.signer_name_confirmed   || INVITEE.signer_name  || "",
    SIGNER_TITLE:  f.signer_title_confirmed  || INVITEE.signer_title || "",
    UNITS_AWARDED: f.units_awarded   || "",
    STUDENTS_SERVED: f.students_served || "",
    PROGRAMS:        f.programs        || "",
    REASON:          f.custom_notes    || "",
    EXAMPLE_NARRATIVE: f.regional_example || "",
    OUTCOME: "complete their educational goals more efficiently",
    ...STATEWIDE,
  };
  const body = INVITEE.letter_type === "rc" ? rcBody(vars) : collegeBody(vars);
  $("preview").innerHTML = renderPreview(body, vars);
}

function collectForm() {
  const o = {};
  for (const id of [
    "signer_name_confirmed","signer_title_confirmed",
    "units_awarded","students_served","programs",
    "regional_example","custom_notes",
  ]) o[id] = $(id).value.trim() || null;
  return o;
}

function wireForm() {
  for (const id of [
    "signer_name_confirmed","signer_title_confirmed",
    "units_awarded","students_served","programs",
    "regional_example","custom_notes",
  ]) $(id).addEventListener("input", updatePreview);

  $("response-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    await submitResponse("supported");
  });

  $("btn-decline").addEventListener("click", () => {
    $("decline-modal").style.display = "block";
    $("decline-modal").scrollIntoView({ behavior: "smooth" });
  });
  $("btn-decline-cancel").addEventListener("click", () => {
    $("decline-modal").style.display = "none";
  });
  $("btn-decline-confirm").addEventListener("click", async () => {
    await submitResponse("declined");
    $("decline-modal").style.display = "none";
  });

  $("btn-preview").addEventListener("click", async () => {
    const params = new URLSearchParams(location.search);
    const token = params.get("t") || params.get("token") || "";
    const url = `${GENERATE_LETTER_URL}?mode=individual&token=${token}`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON }});
    if (!res.ok) { alert("Preview failed: HTTP " + res.status); return; }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = `CPL_Budget_Support_${(INVITEE.org_slug || INVITEE.org_name || "letter").replace(/[^a-z0-9]+/gi,"_")}.docx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  });

  $("logo-drop").addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") $("logo-input").click();
  });
  $("logo-input").addEventListener("change", handleLogoUpload);
}

async function submitResponse(status) {
  const f = collectForm();
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || params.get("token") || "";
  const btn = $("btn-support");
  btn.disabled = true; btn.textContent = "Saving…";

  const { error } = await sb.rpc("submit_response", {
    p_token: token,
    p_status: status,
    p_units_awarded:          f.units_awarded,
    p_students_served:        f.students_served,
    p_programs:               f.programs,
    p_regional_example:       f.regional_example,
    p_custom_notes:           f.custom_notes,
    p_signer_name_confirmed:  f.signer_name_confirmed,
    p_signer_title_confirmed: f.signer_title_confirmed,
    p_decline_reason:         status === "declined" ? ($("decline_reason").value.trim() || null) : null,
    p_user_agent:             navigator.userAgent,
  });
  btn.disabled = false; btn.textContent = "✓ Endorse this letter";
  if (error) { alert("Save failed: " + error.message); return; }

  if (status === "supported") {
    $("already").style.display = "block";
    $("already-when").textContent = new Date().toLocaleString();
    $("already").scrollIntoView({ behavior: "smooth" });
  } else {
    $("already").style.display = "none";
    $("declined-banner").style.display = "block";
    $("declined-banner").scrollIntoView({ behavior: "smooth" });
  }
}

async function handleLogoUpload(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2 MB."); return; }
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || params.get("token") || "";
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${INVITEE.campaign_slug}/${INVITEE.invitee_id}.${ext}`;

  const { error: upErr } = await sb.storage.from("logos").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (upErr) { alert("Upload failed: " + upErr.message); return; }

  const { error: recErr } = await sb.rpc("record_logo_upload", {
    p_token: token,
    p_storage_path: path,
    p_mime_type: file.type,
    p_size_bytes: file.size,
  });
  if (recErr) { alert("Logo recorded upload failed: " + recErr.message); return; }

  const url = `${SUPABASE_URL}/storage/v1/object/public/logos/${path}?v=${Date.now()}`;
  $("logo-preview").src = url;
  $("logo-preview").style.display = "block";
  $("logo-prompt").textContent = "Logo uploaded — click to replace";
}

function showInvalid() {
  $("loading").style.display = "none";
  $("invalid").style.display = "block";
}

init().catch((e) => { console.error(e); showInvalid(); });
