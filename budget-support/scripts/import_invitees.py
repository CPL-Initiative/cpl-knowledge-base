#!/usr/bin/env python3
"""
Import a CSV of invitees into the budget-support Supabase project.

Usage:
    SUPABASE_SERVICE_KEY=... python3 import_invitees.py \\
        --csv roster.csv --campaign may-2026-revise-rc

Expected CSV columns (header row required):
    org_name, org_slug, region, signer_name, signer_title, signer_email

`region` may be blank for the college (CEO/CIO/CSSO) campaign.

The script is idempotent: re-running with the same CSV updates existing rows
matched on (campaign_id, lower(signer_email)) and does not generate new tokens.
"""
import argparse
import csv
import os
import re
import sys
import urllib.request
import json

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mdxutmbpoqjtdcwjscux.supabase.co")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY")

def slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s[:80]

def http(method, path, body=None):
    url = f"{SUPABASE_URL}{path}"
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode("utf-8") or "[]")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} on {method} {path}: {e.read().decode()}", file=sys.stderr)
        raise

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--campaign", required=True, help="campaign slug")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY env var required (use the *service_role* key, not the publishable one).")

    # Look up campaign id
    camps = http("GET", f"/rest/v1/campaigns?slug=eq.{args.campaign}&select=id,slug")
    if not camps:
        sys.exit(f"campaign '{args.campaign}' not found")
    campaign_id = camps[0]["id"]
    print(f"Campaign: {args.campaign}  id={campaign_id}")

    rows = list(csv.DictReader(open(args.csv, newline="", encoding="utf-8-sig")))
    print(f"Read {len(rows)} rows from {args.csv}")

    if args.dry_run:
        for r in rows[:5]:
            print(" ", r)
        print("(dry-run, no writes)")
        return

    payload = []
    for r in rows:
        org_name = (r.get("org_name") or "").strip()
        if not org_name: continue
        payload.append({
            "campaign_id":  campaign_id,
            "org_name":     org_name,
            "org_slug":     (r.get("org_slug") or "").strip() or slugify(org_name),
            "region":       (r.get("region") or "").strip() or None,
            "signer_name":  (r.get("signer_name") or "").strip() or None,
            "signer_title": (r.get("signer_title") or "").strip() or None,
            "signer_email": (r.get("signer_email") or "").strip().lower() or None,
        })

    # Upsert by (campaign_id, signer_email).  We can't do that directly via
    # PostgREST without a uniqueness constraint, so we delete existing rows
    # for this campaign matching any incoming email, then insert all.
    emails = [p["signer_email"] for p in payload if p["signer_email"]]
    if emails:
        q = ",".join(emails)
        http("DELETE", f"/rest/v1/invitees?campaign_id=eq.{campaign_id}&signer_email=in.({q})")

    # Chunk inserts to keep payloads reasonable
    inserted = []
    for i in range(0, len(payload), 100):
        chunk = payload[i:i+100]
        out = http("POST", "/rest/v1/invitees", body=chunk)
        inserted.extend(out)

    print(f"Inserted {len(inserted)} invitees.")
    print()
    print("token,org_name,signer_email,url")
    for inv in inserted:
        url = f"https://cpl-initiative.github.io/cpl-project-tracker/budget-support/?t={inv['token']}"
        print(f"{inv['token']},{inv['org_name']},{inv.get('signer_email') or ''},{url}")

if __name__ == "__main__":
    main()
