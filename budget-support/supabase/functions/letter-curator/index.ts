// Edge function: letter-curator
//
// Lets an admin view + edit letter paragraph blocks for a campaign.
// All writes are gated on the CURATOR_PASSCODE env var (Authorization: Bearer X).
// Reads are public — the same blocks are used at letter generation time and
// are already visible via letter_blocks_public.
//
//   GET  ?campaign=<slug>                          → all blocks for the campaign
//   GET  ?campaign=<slug>&block_key=<key>&history  → history rows for that block
//   PUT  body: { campaign_slug, block_key, scope, content }   → upsert a block
//   DELETE body: { campaign_slug, block_key, scope }          → delete (revert to default)
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
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  try {
    if (req.method === "GET")    return await handleGet(url);
    if (req.method === "PUT")    return await handlePut(req);
    if (req.method === "DELETE") return await handleDelete(req);
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    console.error(e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});
