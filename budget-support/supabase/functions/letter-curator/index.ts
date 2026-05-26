// Edge function: letter-curator
//
// Lets an admin view + edit letter paragraph blocks for a campaign.
// All writes are gated on the CURATOR_PASSCODE env var (Authorization: Bearer X).
// Reads are public — the same blocks are used at letter generation time and
// are already visible via letter_blocks_public.
//
//   GET    ?campaign=<slug>                          → all blocks for the campaign
//   GET    ?campaign=<slug>&block_key=<key>&history  → history rows for that block
//   GET    ?list=campaigns                           → list every active campaign
//   PUT    body: { campaign_slug, block_key, scope, content }   → upsert a block
//   DELETE body: { campaign_slug, block_key, scope }            → delete (revert)
//   POST   body: { name, slug, letter_type, subject_line, deadline?, ask_amount?,
//                  blocks: [{ block_key, scope, content }, ...] }
//                                                     → create new campaign + bulk-seed blocks
//
// To rotate the passcode, set CURATOR_PASSCODE in Supabase Studio →
// Project Settings → Edge Functions → Secrets.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PASSCODE     = Deno.env.get("CURATOR_PASSCODE") ?? "";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

function requireAuth(req: Request): string | null {
  if (!PASSCODE) return "curator passcode not configured on the server";
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1].trim() !== PASSCODE) return "unauthorized";
  return null;
}

async function campaignId(slug: string): Promise<string | null> {
  const { data } = await sb.from("campaigns").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

async function handleGet(url: URL): Promise<Response> {
  // List all campaigns (used by the curator dropdown).
  if (url.searchParams.get("list") === "campaigns") {
    const { data, error } = await sb
      .from("campaigns")
      .select("slug, name, letter_type, deadline, active")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ campaigns: data ?? [] });
  }

  const slug = url.searchParams.get("campaign");
  if (!slug) return json({ error: "campaign required" }, 400);

  const cid = await campaignId(slug);
  if (!cid) return json({ error: "campaign not found" }, 404);

  if (url.searchParams.get("history") !== null) {
    const bk = url.searchParams.get("block_key");
    const sc = url.searchParams.get("scope") ?? "all";
    if (!bk) return json({ error: "block_key required for history" }, 400);
    const { data } = await sb
      .from("letter_block_history_public")
      .select("*")
      .eq("campaign_id", cid)
      .eq("block_key", bk)
      .eq("scope", sc)
      .order("archived_at", { ascending: false })
      .limit(50);
    return json({ history: data ?? [] });
  }

  const { data, error } = await sb
    .from("letter_blocks_public")
    .select("*")
    .eq("campaign_id", cid)
    .order("scope")
    .order("block_key");
  if (error) return json({ error: error.message }, 500);
  return json({ campaign_slug: slug, blocks: data ?? [] });
}

async function handlePut(req: Request): Promise<Response> {
  const err = requireAuth(req);
  if (err) return json({ error: err }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid JSON" }, 400);
  const { campaign_slug, block_key, scope, content, updated_by } = body;
  if (!campaign_slug || !block_key || !scope || typeof content !== "string") {
    return json({ error: "campaign_slug, block_key, scope, content required" }, 400);
  }
  if (!["all","individual","joint","statewide"].includes(scope)) {
    return json({ error: "invalid scope" }, 400);
  }
  const cid = await campaignId(campaign_slug);
  if (!cid) return json({ error: "campaign not found" }, 404);

  const { data, error } = await sb
    .from("letter_blocks")
    .upsert({
      campaign_id: cid,
      block_key,
      scope,
      content,
      updated_by: updated_by ?? "curator",
      updated_at: new Date().toISOString(),
    }, { onConflict: "campaign_id,block_key,scope" })
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ block: data });
}

async function handleDelete(req: Request): Promise<Response> {
  const err = requireAuth(req);
  if (err) return json({ error: err }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid JSON" }, 400);
  const { campaign_slug, block_key, scope } = body;
  if (!campaign_slug || !block_key || !scope) {
    return json({ error: "campaign_slug, block_key, scope required" }, 400);
  }
  const cid = await campaignId(campaign_slug);
  if (!cid) return json({ error: "campaign not found" }, 404);
  const { error } = await sb
    .from("letter_blocks")
    .delete()
    .eq("campaign_id", cid)
    .eq("block_key", block_key)
    .eq("scope", scope);
  if (error) return json({ error: error.message }, 500);
  return json({ deleted: true });
}

async function handlePost(req: Request): Promise<Response> {
  const err = requireAuth(req);
  if (err) return json({ error: err }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid JSON" }, 400);

  const { name, slug, letter_type, subject_line, deadline, ask_amount, blocks } = body;
  if (!name || !slug || !letter_type || !subject_line) {
    return json({ error: "name, slug, letter_type, subject_line required" }, 400);
  }
  if (!["rc","college"].includes(letter_type)) {
    return json({ error: "letter_type must be 'rc' or 'college'" }, 400);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return json({ error: "slug must be lowercase alphanumerics + hyphens (e.g. 'fy27-budget-rc')" }, 400);
  }

  // Create the campaign
  const { data: camp, error: e1 } = await sb
    .from("campaigns")
    .insert({
      name,
      slug,
      letter_type,
      subject_line,
      deadline: deadline || null,
      ask_amount: ask_amount || "$XXM",
      active: true,
    })
    .select()
    .single();
  if (e1) {
    if (String(e1.message).includes("duplicate")) {
      return json({ error: `slug '${slug}' already exists` }, 409);
    }
    return json({ error: e1.message }, 500);
  }

  // Bulk-seed blocks if any were provided.
  if (Array.isArray(blocks) && blocks.length > 0) {
    const rows = blocks
      .filter((b: any) => b && b.block_key && typeof b.content === "string" && b.content.trim().length > 0)
      .map((b: any) => ({
        campaign_id: camp.id,
        block_key:   String(b.block_key),
        scope:       (b.scope && ["all","individual","joint","statewide"].includes(b.scope)) ? b.scope : "all",
        content:     String(b.content),
        updated_by:  "new-campaign",
      }));
    if (rows.length > 0) {
      const { error: e2 } = await sb.from("letter_blocks").insert(rows);
      if (e2) return json({ campaign: camp, blocks_error: e2.message }, 207);
    }
  }

  return json({ campaign: camp });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  try {
    if (req.method === "GET")    return await handleGet(url);
    if (req.method === "POST")   return await handlePost(req);
    if (req.method === "PUT")    return await handlePut(req);
    if (req.method === "DELETE") return await handleDelete(req);
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    console.error(e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});
