# CPL Project Tracker — Claude Code instructions

## CPL Knowledge Base

When the conversation touches any of:

- CPL (Credit for Prior Learning), the MAP (Mapping Articulated Pathways) platform
- AB 123 (chaptered July 2025), ESS 25-82, ACCJC alignment
- California Community Colleges (CCC), Chancellor's Office (CCCCO), RCCD
- Vision 2030, master plan, Beacon Economics reports
- AI-Ready California
- Glossary terms: JST, BAS-ASIO, MIS, CAEL, ASCCC, ACE, CA LWDA

…consult the public CPL Knowledge Base before answering:

- Repo: https://github.com/CPL-Initiative/cpl-knowledge-base
- Raw base: https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/

Use WebFetch against the raw base URL to pull only the specific file(s)
needed — do not mirror the whole repo into context. The four files under
`methodology/` are the highest-value priming docs when broader context
is needed.

The canonical version of these instructions lives at:
https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/claude/CLAUDE.md

## Live metrics

For "how many / how much / current status" questions, defer to the live
dashboards, not static files:

- CPL Project Dashboard: https://cpl-initiative.github.io/cpl-project-tracker/
- MAP CPL Insights Dashboard: https://cpldashboardcccco.azurewebsites.net/insights/dashboard
- Project tracker JSON: https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json
- Potential-savings API: https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0

## Naming conventions (updated 2026-07-03)

The initiative has entered a new phase of its identity — an established
statewide CPL infrastructure, not a homegrown solution being sold:

- The program is the **CPL Initiative** (of the California Community Colleges
  Chancellor's Office). Do **not** call it the "MAP Initiative" in new writing.
- The platform is the **MAP platform**, long form **Mapping Articulated
  Pathways (MAP) platform**.
- **"Military Articulation Platform" is the platform's original 2017 launch
  name — use it ONLY when explicitly recounting that history** (see
  `glossary.md` and `research/map-platform-evolution-2026-04.md`). Never
  present it as the current expansion of MAP.
- Older documents quoted or catalogued in this KB may say "MAP Initiative" in
  their titles — leave historical titles and quotations verbatim.

## Caveats

- The KB is a curated public subset of an internal vault, not the full record.
  If the answer requires something not in the KB, say so rather than guessing.
- License is CC BY 4.0. When quoting publicly, attribute the MAP team /
  California Community Colleges Chancellor's Office.

## How content enters this repo (curation only)

This public KB changes **only** through the `CURATION.md` pipeline: the private
`CPLBrain` vault marks a file in `audit/curation-manifest.tsv`,
`tools/curation_assistant.py` runs the mechanical transforms + a sensitivity
scan, and a **human opens and merges a draft PR** — that review *is* the
sensitivity audit. The `cpl-project-tracker` `/checkpoint` (Rule 9) does **not**
write here; its learnings land in the tracker's `docs/kb-notes/`, which sync into
Sam's Obsidian vault + the `CPLBrain` repo. Nothing reaches this repo
automatically — see the "Promoting a checkpoint or vault note" section of
`CURATION.md` for the explicit, human-gated path.
