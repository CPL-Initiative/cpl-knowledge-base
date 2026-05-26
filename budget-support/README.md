# CPL Budget Support

A tokenized endorsement workflow for the **May 2026 Revise CPL funding request** ($37M = $2M ongoing + $35M one-time). Each invited consortium / CEO / CIO / CSSO gets a unique link, fills in their local blanks plus optional logo, and clicks **Endorse**. The system then generates personalized individual letters and a real-time joint letter for legislative submission.

This bundle was staged from a Claude Code on the web session (cross-repo write access was scoped to `cpl-knowledge-base`). The Supabase project is provisioned and live; the web bundle needs to be transplanted into `cpl-project-tracker` (or hosted standalone) to go live in front of users.

## What's deployed

| Component | Where | Status |
| --- | --- | --- |
| Postgres schema + RLS + RPCs + letter_blocks curator | Supabase project `cpl-budget-support` (`mdxutmbpoqjtdcwjscux`, us-west-1) | **Live** |
| `logos` and `templates` Storage buckets | Same project | **Live** |
| Edge function `generate-letter` (4 modes) | Same project, public (no JWT) | **Live (v2)** |
| Edge function `letter-curator` (read public, write passcode-gated) | Same project | **Live (v1)** |
| Two seeded campaigns (RC + College, deadline 2026-06-15) + 19 paragraph blocks | Same project | **Live** |
| Letter templates (`{{P_<KEY>}}` scaffolding) | `budget-support/templates/` in this repo | **Live** — edge function fetches from `main` |
| Invitee endorsement page (`web/index.html`) | Not yet hosted | **Built, needs hosting** |
| Public status dashboard (`web/dashboard.html`) | Not yet hosted | **Built, needs hosting** |
| Embeddable tracker tile (`web/tile.html`) | Not yet embedded | **Built, needs embedding** |
| Roster import + invite scripts | `scripts/` | **Built** |

## Project layout

```
budget-support/
├── README.md                                   ← you are here
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql                       schema, RLS, public RPCs/views
│   │   ├── 0002_storage.sql                    logos bucket + public-read policy
│   │   └── 0003_seed.sql                       the two May 2026 Revise campaigns
│   └── functions/
│       └── generate-letter/
│           └── index.ts                        DOCX generator (Deno)
├── templates/
│   ├── template_college.docx                   placeholder source-of-truth
│   └── template_rc.docx
├── web/
│   ├── config.js                               Supabase URL + publishable key
│   ├── styles.css
│   ├── index.html      + app.js                invitee endorsement page
│   ├── dashboard.html                          public status page (admin-ish)
│   └── tile.html                               embeddable for project-tracker home
└── scripts/
    ├── roster_template.csv                     example CSV format
    ├── import_invitees.py                      load roster into Supabase
    └── send_invites.py                         render per-invitee emails / mailto
```

## Architecture

```
                 ┌──────────────────────────────────────────────┐
   invitee  ───▶ │ /budget-support/?t=<token>                   │
                 │   • get_invitee_by_token(token)              │
                 │   • submit_response(token, ...)              │
                 │   • upload logo → record_logo_upload(token)  │
                 │   • download individual letter ──────────┐    │
                 └──────────────────────────────────────────┼───┘
                                                            │
                                                            ▼
                 ┌──────────────────────────────────────────────┐
                 │ Supabase edge fn: generate-letter            │
                 │   mode=individual&token=<uuid>               │
                 │   mode=joint&campaign=<slug>                 │
                 │   mode=preview&campaign=<slug>               │
                 │                                              │
                 │   fetches DOCX template from raw.github      │
                 │   fetches live metrics from live_metrics.json│
                 │   {{TOKEN}} find-replace → DOCX response     │
                 └──────────────────────────────────────────────┘
                                                            ▲
   admin / MAP ──▶ /budget-support/dashboard.html ──────────┘
                   (reads campaign_summary_public,
                    signatories_public — no auth)
```

## Security model

- **Anon clients** never see the `invitees` / `responses` / `assets` tables directly. RLS denies all direct access; the only paths in are three `SECURITY DEFINER` RPCs in `0001_init.sql` (`get_invitee_by_token`, `submit_response`, `record_logo_upload`), each of which validates the token before doing anything.
- **Storage uploads** to `logos` are constrained at the bucket level (2 MB max, image MIME types only) and by an RLS policy that requires the upload path to begin with an existing campaign slug.
- **Edge function `generate-letter`** runs with the service role inside the function but exposes only read-style endpoints (no writes). It is public by design — invitees need to be able to download their own personalized letter without authenticating.
- **No admin auth yet.** Operational tasks (resend invite, rotate token, edit roster) are done via Supabase Studio with the service-role key. Adding Supabase Auth + a `staff` allowlist is a clean next step.

## Getting it in front of users (next steps)

### 1. Provide the roster

Fill out `scripts/roster_template.csv` for each campaign (one CSV per campaign):

```
org_name, org_slug, region, signer_name, signer_title, signer_email
```

For the **RC campaign**, region = the regional consortium's coverage area. For the **college (CEO/CIO/CSSO) campaign**, region is blank.

Then import:

```bash
export SUPABASE_SERVICE_KEY=...   # service_role key from Supabase Studio
cd budget-support/scripts
python3 import_invitees.py --csv rc_roster.csv      --campaign may-2026-revise-rc
python3 import_invitees.py --csv college_roster.csv --campaign may-2026-revise-college
```

The script prints one row per invitee with the unique URL.

### 2. Host the `web/` bundle

Three viable hosting targets:

#### Option A (recommended) — drop into `cpl-project-tracker`

Copy `web/*` into `cpl-project-tracker/budget-support/` and push. The `<a class="cta" href="./dashboard.html">` link in `tile.html` already assumes this layout. The tracker home page should then either:

- iframe the tile:
  ```html
  <iframe src="./budget-support/tile.html"
          style="border:none;width:100%;height:240px"></iframe>
  ```
- or copy the relevant `<div>` + `<script>` from `tile.html` directly into the home page HTML.

#### Option B — separate static host (Vercel / Netlify / GitHub Pages of this repo)

Serve `budget-support/web/` and adjust `PORTAL_BASE` in `scripts/send_invites.py` accordingly.

### 3. Send the invites (v1 = stubbed email)

```bash
# Print every pending invitee's full email to stdout
python3 send_invites.py --campaign may-2026-revise-rc

# Write a CSV that you can import into your mail client
python3 send_invites.py --campaign may-2026-revise-rc --mode=csv > rc_invites.csv

# Open a mailto: draft in your default mail client for each invitee
python3 send_invites.py --campaign may-2026-revise-rc --mode=mailto-batch

# Mark invitees.invited_at = now() once you've actually sent
python3 send_invites.py --campaign may-2026-revise-rc --mark-sent
```

When you're ready to upgrade to transactional email (Resend / Postmark / SendGrid / Microsoft Graph), `send_invites.py` is the single integration point — swap the print/mailto block for an API call.

### 4. Watch the dashboard

`web/dashboard.html` is the public-facing status page. Counts come from the `campaign_summary_public` view and update live as invitees endorse. Joint letters can be downloaded at any time via the **Joint letter** buttons at the bottom.

## Editing the letters

**Letter copy** lives in the `letter_blocks` table and is curated through the **letter curator** UI (`web/curator.html`) or directly via SQL. Each paragraph of the letter is a `block` keyed by name (`opening`, `rationale`, `stats`, `institution`, `example`, `ask`, `cta`) and `scope` (`all` = default; `individual`/`joint`/`statewide` override `all` for that mode). The curator UI shows every block, lets you edit it, snapshots prior versions to `letter_block_history` on save, and exposes a one-click "Reset to default" for any scope-specific override.

To unlock writes in the curator UI:

1. Pick or generate a strong passcode (e.g., `openssl rand -hex 16`).
2. In Supabase Studio → Edge Functions → Secrets, set `CURATOR_PASSCODE` to that value.
3. Open `curator.html`, paste the passcode into the "Unlock" box. It's stored in sessionStorage and cleared when the tab closes.

**Letter structure** (the surrounding scaffolding: date, addressees, subject line, signature lines) lives in `templates/template_*.docx`. Edit those in Word if you need to add a new paragraph; add a corresponding row in `letter_blocks` afterwards. After editing the docx, commit and push — the edge function fetches templates fresh from `raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/budget-support/templates/` on each cold start.

See `docs/placeholders.md` for the full token reference.

## Roadmap (v1.1+)

- **Authenticated admin UI** — Supabase Auth magic-link + a `staff` allowlist table; replace Studio-based ops with in-app actions (resend invite, rotate token, edit invitee, bulk export).
- **Real email** — Resend or Postmark integration in `send_invites.py`; reminder cadence (day 3, day 7, day 12).
- **Logo grid in joint DOCX** — current joint letter lists signatories as text bullets. Upgrade to an embedded image table using `docx`'s `w:drawing` elements with logos pulled from Storage.
- **PDF output** — wrap DOCX → PDF with LibreOffice headless or a Cloudflare Worker/Browserless step for press-ready submission.
- **Per-campaign editable cover letter** — let the admin tweak intro/CTA copy without redeploying.
- **Telemetry** — open/click tracking on email; conversion funnel (link clicked → form filled → endorsed).

## Supabase project facts

```
project_id:   mdxutmbpoqjtdcwjscux
project_url:  https://mdxutmbpoqjtdcwjscux.supabase.co
region:       us-west-1
org_id:       himzllitpmtdfjuftwgi   (LiveOak)
edge fn URL:  https://mdxutmbpoqjtdcwjscux.supabase.co/functions/v1/generate-letter
```

Publishable (anon) key — safe to expose, gated by RLS:

```
sb_publishable_lPfS842rgq7Ru0IUy4KaOg_Q55SGLhQ
```

Service-role key — **never commit** — retrieve from Supabase Studio → Project Settings → API.
