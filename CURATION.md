# Curation process

How content gets from the private CPLBrain vault into this public repo.

## Source

- **Private vault:** `samueltlee/CPLBrain` (Obsidian)
- **Audit of record:** `audit/CPLBrain_Audit_2026-05-08.md` in the private vault
- **Decisions of record:** `audit/decisions.md` and `audit/deep-read-findings.md`

## Buckets (from the audit)

- **Promote as-is** — copied to the public repo with only wikilink-to-relative-link conversion
- **Promote after redaction** — specific lines or references stripped before copy
- **Extract methodology** — small portions lifted out of larger private files and reframed
- **Rewrite** — internal-team-framed files rewritten for a public audience
- **Hold private** — never promoted

## v1 inclusion list

The exhaustive promote / redact / extract / rewrite list lives in the private audit.
This file lists the v1 mapping at a glance:

### overview/
- `overview.md` — combined CPL Initiative + Veteran Sprint overview (entry point); rewritten from `04-projects/cpl-initiative/PROJECT-OVERVIEW.md` plus public Veteran Sprint context
- `map-platform.md` — rewritten from `04-projects/map-platform/PROJECT-OVERVIEW.md`
- `ai-ready-california.md` — rewritten from `04-projects/ai-ready-california/PROJECT-OVERVIEW.md`

### methodology/
- `three-pillar-initiative-design.md` — promote-as-is from `05-knowledge/consolidated/three-pillar-initiative-design-framework.md`
- `infrastructure-first-scaling.md` — redact wikilinks per `deep-read-findings.md` then promote
- `sprint-based-execution.md` — redact wikilinks per `deep-read-findings.md` then promote
- `evidence-first-advocacy.md` — redact wikilinks + CLAUDE.md refs per `deep-read-findings.md` then promote
- `knowledge-consolidation.md` — extract from `07-session-notes/2026-04-19-knowledge-consolidation-first-run.md` lines 34–44 (Q5)
- `pattern-scattered-to-systematic.md` — promote-as-is from `05-knowledge/patterns/`
- `pattern-ai-as-accelerant-with-faculty-validation.md` — promote-as-is from `05-knowledge/patterns/`

### current-status/
- `README.md` — pointer page only; links to live dashboard and API. No static metric files (per Q4).

### policy-and-funding/
- `ab-123-summary.md` — extract from public AB 123 text and the legislative report
- `ess-25-82-funding-memo.md` — promote-as-is from `04-projects/cpl-initiative/resources/ess-25-82-funding-memo-2025-12-09.md`
- `accjc-cpl-policy.md` — promote-as-is
- `chancellor-cpl-call-to-action.md` — promote-as-is
- `veterans-sprint-cpl-policies-compliance.md` — promote-as-is
- `cpl-initiative-report-2026.md` — mirror + banner linking to official PDF (per Q14)

### research/
- `economic-impact-2024.md` — promote-as-is from `economic-impact-study-2024.md`
- `scaling-cpl-california-2024.md` — promote-as-is
- `vision-2030-report-2025.md` — promote-as-is
- `ca-master-plan-career-education-2025.md` — promote-as-is
- `map-platform-evolution-2026-04.md` — promote-as-is from `05-knowledge/timeline/`

> **Q12 note (2026-05-08):** the three video stub bookmarks in `05-knowledge/booklets/videos/` are skipped from v1. The bookmarks are placeholders without fetched titles or summaries; revisit when the videos are summarized in the private vault.

### playbooks/
- `cpl-faculty-coordinator-sample.md` — promote-as-is
- `cpl-survey-questions-sample.md` — promote-as-is
- `map-cpl-implementation-guide.md` — promote-as-is
- `map-cpl-stories-page.md` — promote-as-is
- `map-cpl-landing-pages.md` — promote-as-is
- `map-counselors-page.md` — promote-as-is
- `map-exhibit-analysis.md` — promote-as-is (aggregate only)
- `ace-presentation.md` — promote-as-is
- `cpl-outreach-flyers.md` — promote-as-is, plus copy referenced flyer assets
- `va-compliance-notification-docs.md` — promote-as-is
- `no-cid-courses-crosswalk.md` — promote-as-is
- `map-ui-brand-standards.md` — **rewrite** of `04-projects/map-platform/resources/design-note-map-team.md` (per Q6), recasting internal framing as public reference
- `cpl-fact-sheet-2026-02-10.md` — promote-as-is
- `cpl-workplan-2025.md` — promote-as-is

### Held private (not in this repo)

- All `00-inbox/` except `MY-INTERESTS.md` (which is also out of scope here)
- All `02-personal/`, `03-professional/braindumps/`, `07-session-notes/`
- `03-professional/COMPETITIVE-WATCHLIST.md` (per Q7)
- All `04-projects/cpl-initiative/college-updates/*` (per Q1)
- `04-projects/cpl-initiative/resources/draft-cpl-update-spring-2026.md` (per Q2 — until released)
- All `05-knowledge/snapshots/metrics-*.md` (per Q4 — link to dashboard instead)
- `05-knowledge/consolidated/consolidation-2026-04-19.md` (per deep-read findings — meta-process artifact)
- All vault-root framework files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `SETUP.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `README.md`, `2026-04-16.md`)
- All binaries (`.docx`, `.html`, `.pyc`, `LICENSE`, `COG-VERSION`, `marketplace-entry.json`, `cog-update.sh`, `.gitignore`)

## Metrics policy

The [CPL Project Dashboard](https://cpl-initiative.github.io/cpl-project-tracker/) and the [MAP CPL Insights Dashboard](https://cpldashboardcccco.azurewebsites.net/insights/dashboard) are the **only authoritative sources** for:

- Operational metrics (students served, eligible / transcribed units, savings)
- College tier counts and per-college breakdowns
- Workplan progress and activity status
- Vision 2030 goals, stretch goals, and goal-to-date percentages
- Veteran Sprint, Apprenticeship Sprint, and Statewide Credit Recommendation Sprint progress

Files in `policy-and-funding/`, `research/`, and `playbooks/` are mirrors of static documents. Specific operational counts in those mirrors reflect the document's original publication date and should not be cited as current. Each affected file carries a banner at the top pointing to the dashboards.

What stays accurate over time in the repo (and is therefore safe to cite without checking the dashboard):

- **Statutory funding amounts** — AB 123 base ($5M ongoing + $15M one-time), FY2026 enacted addition ($2M ongoing + $35M one-time), ESS 25-82 per-college grant ($50K).
- **Historical timeline** — MAP launched 2017, expanded 2020, integrated into CCCCO 2024.
- **Project milestone dates** — 29 Palms outcomes July 2026; Apprenticeship Sprint completion June 2026; Student CPL Portal May 2026; BAS-ASIO through BOG by June 2027; scalable 29 Palms model by March 2027.
- **Research findings** — Beacon Economics 2024 study figures ($32.4B projected combined economic impact at the Vision 2030 statewide CPL target; $14,653–$26,115 per-student savings at 15 credits; +24% / +14% / +19% Latinx/Black/Pell completion deltas); WICHE/CAEL PLA Boost (49% vs 27% graduation rate).

Refresh process: when the underlying private vault gains new mirrored content, copy it through the wikilink-strip → relink → dashboard-banner pipeline, then re-run a sensitivity audit on the changed files.

## Refresh cadence

- Re-curate quarterly, or after any major release (sprint completion, new fact sheet, new legislative report)
- For each refresh: re-run a sensitivity audit on changed files and update this file

## Tooling: the curation assistant

`tools/curation_assistant.py` (stdlib-only) automates the *mechanical* half of
this process and surfaces the *judgment* half — it never publishes on its own.

Given a manifest of what to promote, it:

- copies each promoted file through the **wikilink-strip → relative-relink** and
  **dashboard-banner** transforms described above;
- runs a **sensitivity scanner** that *flags* (never silently strips) emails,
  phones, SSNs, long IDs, DOB / FERPA / PII / confidential / draft markers,
  dollar figures (possible pre-release), held-private path references, and
  leftover Obsidian/agent residue;
- writes the transformed files into this repo's working tree, plus a **masked**
  report at `curation_out/CURATION_REPORT.md` (gitignored — it cites filenames
  and line numbers with values masked, so it is never committed).

It is **opt-in and human-gated**:

- The manifest's default bucket is `hold`; a file is promoted only when
  explicitly listed `promote`/`redact`/`extract`/`rewrite`. `hold` files are
  skipped entirely (never read into the output).
- `redact`/`extract`/`rewrite` files are written with a TODO banner — the tool
  does the wikilink/banner mechanics, **you** do the editorial work.
- Nothing reaches public `main` without a human opening and merging a PR. That
  review **is** the sensitivity audit this file requires.

### Manifest

Tab-separated, one row per file (`src` relative to the vault, `dest` relative to
this repo, `bucket`); `#` comments and blank lines are ignored:

```
<src-in-vault>    <dest-in-this-repo>    <bucket>
```

Bootstrap one — every file defaults to `hold`, and you opt files in:

```
python3 tools/curation_assistant.py --vault ../CPLBrain --init-manifest \
    > ../CPLBrain/audit/curation-manifest.tsv
```

### Run

From a checkout of this repo with a CPLBrain clone alongside (a multi-repo
session, or locally):

```
python3 tools/curation_assistant.py --vault ../CPLBrain \
    --manifest ../CPLBrain/audit/curation-manifest.tsv --out .
```

Then review `curation_out/CURATION_REPORT.md` (resolve every HIGH flag), eyeball
`git diff`, and open a **draft PR**. `--dry-run` scans and reports without
writing any curated files.
