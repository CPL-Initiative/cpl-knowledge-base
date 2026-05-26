#!/usr/bin/env python3
"""
Render the invitation email for every pending invitee in a campaign and
either print it to stdout (default), open a `mailto:` URL per invitee, or
write a single combined CSV you can import into Outlook / a marketing tool.

Since v1 stubs the email provider, this script is the "send" step — copy
each rendered body into your mail client, or use --mode=mailto-batch to
spawn a draft per recipient.

Usage:
    SUPABASE_SERVICE_KEY=... python3 send_invites.py \\
        --campaign may-2026-revise-rc

    # Write a CSV of recipients + bodies:
    SUPABASE_SERVICE_KEY=... python3 send_invites.py \\
        --campaign may-2026-revise-college --mode=csv > invites.csv
"""
import argparse, csv, os, sys, urllib.request, urllib.parse, json, webbrowser

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mdxutmbpoqjtdcwjscux.supabase.co")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY")
PORTAL_BASE  = os.environ.get(
    "PORTAL_BASE",
    "https://cpl-initiative.github.io/cpl-project-tracker/budget-support",
)

EMAIL_SUBJECT = "Please endorse: $37M CPL May Revise budget request"

EMAIL_BODY_RC = """Dear {signer_name},

The May 2026 Revise budget includes a $37 million request for Credit for
Prior Learning (CPL) — $2M ongoing to sustain CPL infrastructure
operations and $35M one-time for local college CPL implementation and
innovation projects.

We're asking the {org_name} to endorse a joint letter to the Senate &
Assembly Budget Chairs in support of this ask. Endorsing takes about
two minutes and produces both:

  1. An individual letter on your letterhead that you can submit, AND
  2. Your organization's name + logo on the joint regional consortia
     letter we'll send to the legislature.

Your unique endorsement link (do not share):
{url}

Statewide, CPL has already served 45,838 students across 98 of
California's 115 community colleges, generating an estimated $291 million
in cost savings to date and a projected $1.17 billion in 20-year
economic impact. Your region's voice strengthens the case.

Deadline: end of business, June 15, 2026.

Thank you,
MAP Initiative
California Community Colleges
MAP@rccd.edu
"""

EMAIL_BODY_COLLEGE = """Dear {signer_name},

The May 2026 Revise budget includes a $37 million request for Credit for
Prior Learning (CPL) — $2M ongoing to sustain CPL infrastructure
operations and $35M one-time for local college CPL implementation and
innovation projects.

We're asking you, as a leader at {org_name}, to endorse a joint letter
to the Senate & Assembly Budget Chairs in support of this ask.
Endorsing takes about two minutes and produces both:

  1. An individual letter on your letterhead that you can submit, AND
  2. Your college's name + logo on the joint letter we'll send to the
     legislature.

Your unique endorsement link (do not share):
{url}

Statewide, CPL has already served 45,838 students across 98 of
California's 115 community colleges, generating an estimated $291 million
in cost savings to date and a projected $1.17 billion in 20-year
economic impact.

Deadline: end of business, June 15, 2026.

Thank you,
MAP Initiative
California Community Colleges
MAP@rccd.edu
"""

def http_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}{path}")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def http_patch(path, body):
    req = urllib.request.Request(f"{SUPABASE_URL}{path}",
        data=json.dumps(body).encode(), method="PATCH")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    urllib.request.urlopen(req).read()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--campaign", required=True)
    ap.add_argument("--mode", choices=["print","csv","mailto-batch"], default="print")
    ap.add_argument("--mark-sent", action="store_true",
                    help="Set invitees.invited_at=now() for each rendered invite.")
    ap.add_argument("--only-pending", action="store_true", default=True,
                    help="Skip invitees who have already responded.")
    args = ap.parse_args()
    if not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY env var required.")

    camps = http_get(f"/rest/v1/campaigns?slug=eq.{args.campaign}&select=id,letter_type,slug,name")
    if not camps: sys.exit(f"campaign '{args.campaign}' not found")
    camp = camps[0]
    body_tmpl = EMAIL_BODY_RC if camp["letter_type"] == "rc" else EMAIL_BODY_COLLEGE

    # Pull invitees + their response status
    rows = http_get(
        f"/rest/v1/invitees?campaign_id=eq.{camp['id']}"
        "&select=id,token,org_name,signer_name,signer_email,invited_at,responses(status)"
    )

    out_rows = []
    for inv in rows:
        if args.only_pending:
            resps = inv.get("responses") or []
            status = (resps[0]["status"] if resps else "pending")
            if status != "pending": continue
        url = f"{PORTAL_BASE}/?t={inv['token']}"
        body = body_tmpl.format(
            signer_name=inv.get("signer_name") or "Colleague",
            org_name=inv.get("org_name"),
            url=url,
        )
        out_rows.append({
            "email":   inv.get("signer_email") or "",
            "name":    inv.get("signer_name") or "",
            "org":     inv.get("org_name") or "",
            "subject": EMAIL_SUBJECT,
            "body":    body,
            "url":     url,
            "invitee_id": inv["id"],
        })

    if args.mode == "csv":
        w = csv.DictWriter(sys.stdout, fieldnames=["email","name","org","subject","body","url"])
        w.writeheader()
        for r in out_rows:
            w.writerow({k:r[k] for k in ["email","name","org","subject","body","url"]})
    elif args.mode == "mailto-batch":
        for r in out_rows:
            if not r["email"]: continue
            mt = "mailto:" + r["email"] + "?subject=" + urllib.parse.quote(r["subject"]) + \
                 "&body=" + urllib.parse.quote(r["body"])
            print("Opening draft for:", r["email"])
            webbrowser.open(mt)
    else:
        for r in out_rows:
            print("=" * 72)
            print(f"To:      {r['email']}")
            print(f"Subject: {r['subject']}")
            print()
            print(r["body"])
            print()

    if args.mark_sent and out_rows:
        ids = ",".join(r["invitee_id"] for r in out_rows)
        http_patch(f"/rest/v1/invitees?id=in.({ids})",
                   {"invited_at": "now()"})
        print(f"\n(marked invited_at for {len(out_rows)} invitees)", file=sys.stderr)

if __name__ == "__main__":
    main()
