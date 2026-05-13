# CPL Knowledge Base — Claude Code instructions

This file is the canonical user-level CLAUDE.md for anyone working with
California Credit for Prior Learning (CPL) Initiative materials. It is
maintained at:

  https://github.com/CPL-Initiative/cpl-knowledge-base/blob/main/claude/CLAUDE.md

Install via `claude/install.sh` in the same repo; a SessionStart hook
refreshes this file from `main` on every session so all machines stay
current automatically.

## When to consult the KB

Consult the knowledge base before answering when a question touches any of:

- CPL (Credit for Prior Learning), MAP (Map Academic Pathways) Platform
- AB 123 (chaptered July 2025), ESS 25-82, ACCJC alignment
- California Community Colleges (CCC), Chancellor's Office (CCCCO), RCCD
- Vision 2030, master plan, Beacon Economics reports
- AI-Ready California
- Glossary terms: JST, BAS-ASIO, MIS, CAEL, ASCCC, ACE, CA LWDA

If the question is clearly outside these topics, ignore this file and
proceed normally.

## How to consult the KB

Repo: https://github.com/CPL-Initiative/cpl-knowledge-base
Raw base: https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/

1. If a local clone of `cpl-knowledge-base` is available on disk, read from there.
2. Otherwise use WebFetch against the raw base URL to pull the specific file(s)
   you need. Do not mirror the whole repo into context.
3. Read only what is relevant to the question. The four files under
   `methodology/` are the highest-value priming docs when broader context
   is needed.

For "how many / how much / current status" questions, defer to the live
dashboards, not static files in the repo:

- CPL Project Dashboard: https://cpl-initiative.github.io/cpl-project-tracker/
- MAP CPL Insights Dashboard: https://cpldashboardcccco.azurewebsites.net/insights/dashboard
- Project tracker JSON: https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json
- Potential-savings API: https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0

## Caveats

- The KB is a curated subset of an internal vault, not the full record.
  If the answer requires something not in the KB, say so rather than guessing.
- The KB intentionally avoids dated metric snapshots — always prefer live
  dashboards for current numbers.
- License is CC BY 4.0. When quoting publicly, attribute the MAP team /
  California Community Colleges Chancellor's Office.
