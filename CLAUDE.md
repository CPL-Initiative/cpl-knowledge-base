# CPL Knowledge Base — Claude Code instructions

The canonical user-level copy of these instructions is
[`claude/CLAUDE.md`](claude/CLAUDE.md) (installed on machines via
`claude/install.sh`, self-refreshing each session). The "When to consult",
"How to consult", "Naming conventions" and "Caveats" sections here must stay
**verbatim-identical** to it — edit both or neither. This root file
additionally carries the repo-only "How content enters this repo" section.

## When to consult the KB

Consult the knowledge base before answering when a question touches any of:

- CPL (Credit for Prior Learning), the MAP (Mapping Articulated Pathways) platform
- AB 123 (chaptered July 2025), ESS 25-82, ACCJC alignment, Title 5 CPL regulations, the LAO's CPL budget analysis
- California Community Colleges (CCC), Chancellor's Office (CCCCO), RCCD
- The Veteran(s) Sprint (JST processing), the Military Base CPL Demonstration (29 Palms MCAGCC / Copper Mountain College), VA compliance
- Vision 2030, master plan, Beacon Economics reports
- Glossary terms: JST, BAS-ASIO, MIS, CAEL, ASCCC, ACE, CA LWDA

If the question is clearly outside these topics, ignore this file and
proceed normally.

## How to consult the KB

Repo: https://github.com/CPL-Initiative/cpl-knowledge-base
Raw base: https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/

1. If a local clone of `cpl-knowledge-base` is available on disk, read from there.
2. Otherwise use WebFetch against the raw base URL to pull the specific file(s)
   you need. Do not mirror the whole repo into context.
3. Read only what is relevant to the question. The four framework docs under
   `methodology/` — Three-Pillar Initiative Design, Infrastructure-First
   Scaling, Sprint-Based Execution, and Evidence-First Advocacy — are the
   highest-value priming docs when broader context is needed.

For "how many / how much / current status" questions, defer to the live
dashboards, not static files in the repo:

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

- The KB is a curated subset of an internal vault, not the full record.
  If the answer requires something not in the KB, say so rather than guessing.
- The KB intentionally avoids dated metric snapshots — always prefer live
  dashboards for current numbers.
- License is CC BY 4.0. When quoting publicly, attribute the MAP team /
  California Community Colleges Chancellor's Office.
- AI-Ready California is **tabled** (see `overview/ai-ready-california.md`) —
  don't present it as an active workstream; it left the consult-trigger list
  2026-07-10.

## How content enters this repo (curation only)

This public KB changes **only** through the `CURATION.md` pipeline: the private
`CPLBrain` vault marks a file in `audit/curation-manifest.tsv`,
`tools/curation_assistant.py` runs the mechanical transforms + a sensitivity
scan, and a **human opens and merges a draft PR** — that review *is* the
sensitivity audit. The `cpl-project-tracker` `/checkpoint` (Rule 8) does **not**
write here; its learnings land in the tracker's `docs/kb-notes/`, which sync into
Sam's Obsidian vault + the `CPLBrain` repo. Nothing reaches this repo
automatically — see the "Promoting a checkpoint or vault note" section of
`CURATION.md` for the explicit, human-gated path.
