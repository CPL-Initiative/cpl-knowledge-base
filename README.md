# CPL Knowledge Base

A curated public mirror of project knowledge for California's Credit for Prior Learning
(CPL) Initiative, the MAP Platform, and AI-Ready California. Maintained by the MAP team
at RCCD on behalf of the California Community Colleges Chancellor's Office.

## What this is

- Methodology, status, and reference docs the MAP team uses
- Sourced from an internal "second brain" and curated for public release
- Updated periodically; live operational metrics live on the CPL Dashboard

## Who this is for

- CCC colleagues at any of the 119 credit (115) and noncredit campuses (4)
- Peer state CPL systems looking to replicate
- Collaborating partners (CAEL, ASCCC, ACE, CA LWDA), researchers, press, legislative staff

## How to use it with Claude / AI assistants

See [`using-with-ai-assistants.md`](using-with-ai-assistants.md) for the full guide. Quick version:

- Paste a folder URL or file URL into chat
- The four files in [`methodology/`](methodology/) are the highest-value priming docs
- For live metrics, point the assistant at the dashboards in [`current-status/`](current-status/README.md), not at files in this repo

## Where to find …

- **CPL Project Dashboard** (workplan, activity, multi-source rollup): <https://cpl-initiative.github.io/cpl-project-tracker/>
- **MAP CPL Insights Dashboard** (students, units, savings, tiers, by-college): <https://cpldashboardcccco.azurewebsites.net/insights/dashboard>
- Live JSON (project tracker): <https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json>
- Live API (potential savings): <https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0>
- AB 123 (chaptered law, July 2025): <https://map.rccd.edu/wp-content/uploads/2025/07/07292025-AB-123-Chaptered-Version.pdf>
- Chancellor's Office CPL site: <(https://www.cccco.edu/About-Us/Chancellors-Office/Divisions/Educational-Services-and-Support/credit-for-prior-learning>
- MAP at RCCD: <https://map.rccd.edu>

## Repo map

```
overview/             # Mission, scope, current status of each project
methodology/          # Reusable frameworks and playbooks
current-status/       # Pointers to live dashboards (no static metrics files — see CURATION.md)
policy-and-funding/   # AB 123, ESS 25-82, ACCJC alignment, Chancellor's call to action
research/             # Beacon Economics, Vision 2030, scaling reports, master plan
playbooks/            # Implementation guides, sample roles, surveys, outreach
glossary.md           # CPL, JST, MAP, AB 123, BAS-ASIO, MIS, ESS-25-82, etc.
```

## Limits

- This repo is a curated subset; not every internal artifact appears here
- For live numbers, use the dashboard API — this repo intentionally avoids dated metric snapshots
- Drafts, internal critiques, college-specific updates, and personnel matters are intentionally excluded

## License

CC BY 4.0 — see [LICENSE](LICENSE). Reuse with attribution to the MAP team / California Community Colleges Chancellor's Office.

## How to contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Briefly: changes flow from the private vault through the curation process documented in [CURATION.md](CURATION.md). External contributors can open issues with corrections or content suggestions.
