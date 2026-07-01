# Current status

This repo intentionally does **not** carry dated metric snapshots, goal-to-date counts, or stretch-goal figures — they go stale within days. The two dashboards below are the authoritative source for every operational metric, current target, and stretch goal cited anywhere in the CPL Initiative, the Veteran Sprint, the Apprenticeship Sprint, or the MAP Platform.

## The two authoritative dashboards

- **CPL Project Dashboard** — workplan progress, activity status, multi-source rollup:
  <https://cpl-initiative.github.io/cpl-project-tracker/>
- **MAP CPL Insights Dashboard** — student counts, units, savings, college tiers, goal-to-date percentages, by-college breakdowns:
  <https://cpldashboardcccco.azurewebsites.net/insights/dashboard>

### Programmatic access

- **Project dashboard JSON:** <https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json>
- **MAP Insights API (potential savings):** <https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0>
  - Field reference, response shape, and parsing notes: [potential-savings-api.md](./potential-savings-api.md)

## What the dashboards report

- Cumulative students served and eligible units (statewide and by college)
- Units transcribed and per-student averages
- College participation tier (Leading / Advancing / Developing) and qualifying criteria
- Workplan activity progress
- All Vision 2030 goals and stretch goals, with goal-to-date percentages

## When you see numbers elsewhere in this repo

Files in `policy-and-funding/`, `research/`, and `playbooks/` are mirrors of static documents (legislative reports, fact sheets, research studies). Any specific operational figure or progress percentage in those files reflects the document's original publication date. **For current numbers, use the dashboards.**

The figures that remain accurate over time in this repo:

- Statutory funding amounts (AB 123 base; FY2026 enacted budget; ESS 25-82 per-college grant)
- Historical milestones (MAP launched 2017, expanded 2020, integrated into CCCCO 2024)
- Project milestone dates (29 Palms outcomes July 2026; Apprenticeship Sprint completion June 2026; etc.)
- Research findings from sourced studies (Beacon Economics 2024; WICHE/CAEL PLA Boost)

## Workplan progress narrative

For evergreen narrative status (project phase, current sprint horizons, qualitative milestones), see [`overview/overview.md`](../overview/overview.md), [`overview/map-platform.md`](../overview/map-platform.md), [`overview/ai-ready-california.md`](../overview/ai-ready-california.md), and the AB 123 legislative report in `policy-and-funding/`.

