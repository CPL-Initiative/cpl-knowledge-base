---
title: Using this Knowledge Base with AI Assistants
audience: MAP team and anyone grounding an AI assistant in CPL context
license: CC BY 4.0
---

# Using this Knowledge Base with AI Assistants

This repo is designed to be pasted into AI assistant chats (Claude.ai, ChatGPT, copilots) as grounding context for any CPL Initiative, Veteran Sprint, MAP Platform, or AI-Ready California question. This page tells you how to do that effectively.

## TL;DR

- Paste a **folder URL** or **file URL** from this repo into the chat — most assistants will fetch and read it.
- For **live numbers**, point the assistant at the dashboards in [`current-status/`](current-status/README.md), not at files in this repo.
- The four files in [`methodology/`](methodology/) are the **highest-value priming docs** — they teach the assistant how the CPL Initiative is structured to think about new questions.

## What to paste in for different questions

### "What is CPL? What's the MAP Initiative? What's the Veteran Sprint?"

Paste the URL of [`overview/overview.md`](overview/overview.md). It bridges all three.

### "What do current student counts look like? How many colleges are at Leading tier?"

**Don't paste files from this repo.** Point the assistant at the dashboards:

- CPL Project Dashboard — <https://cpl-initiative.github.io/cpl-project-tracker/>
- MAP CPL Insights Dashboard — <https://cpldashboardcccco.azurewebsites.net/insights/dashboard>

Or paste the raw JSON: <https://raw.githubusercontent.com/cpl-initiative/cpl-project-tracker/main/live_metrics.json>

### "How is the CPL Initiative actually run? What's the operating model?"

Paste any of the four [`methodology/`](methodology/) frameworks:

- [Three-Pillar Initiative Design](methodology/three-pillar-initiative-design.md) — culture / technology / policy
- [Infrastructure-First Scaling](methodology/infrastructure-first-scaling.md) — substrate before agents and comms
- [Sprint-Based Execution](methodology/sprint-based-execution.md) — bounded goals, demonstration-then-scale
- [Evidence-First Advocacy](methodology/evidence-first-advocacy.md) — lead with sourced numbers

For deep priming on a new initiative or partnership conversation, paste all four. They're short.

### "What's the legislative / funding picture?"

Paste [`policy-and-funding/cpl-initiative-report-2026.md`](policy-and-funding/cpl-initiative-report-2026.md) (the AB 123 report mirror) plus the [ESS 25-82 funding memo](policy-and-funding/ess-25-82-funding-memo.md). Cite AB 123 itself: <https://map.rccd.edu/wp-content/uploads/2025/07/07292025-AB-123-Chaptered-Version.pdf>.

### "What's the economic case for CPL?"

Paste [`research/economic-impact-2024.md`](research/economic-impact-2024.md) (Beacon Economics summary). For the full study, link to the original PDF on map.rccd.edu.

### "How should a college start implementing CPL?"

Paste [`playbooks/map-cpl-implementation-guide.md`](playbooks/map-cpl-implementation-guide.md). For a faculty coordinator role, also paste [`playbooks/cpl-faculty-coordinator-sample.md`](playbooks/cpl-faculty-coordinator-sample.md).

### "Draft external communication — board memo, fact sheet, press response"

1. Paste [Evidence-First Advocacy](methodology/evidence-first-advocacy.md) so the assistant leads with a sourced number.
2. Paste [`playbooks/cpl-fact-sheet-2026-02-10.md`](playbooks/cpl-fact-sheet-2026-02-10.md) for the canonical figures.
3. Tell the assistant to fetch live numbers from the dashboard if anything dated appears in the draft.

## Patterns that work well

- **Stack priming**: paste 2–3 short methodology files before asking a strategic question. The assistant's reasoning gets noticeably better.
- **Always anchor live numbers in the dashboards**: tell the assistant explicitly, "for any current metric, use the CPL Project Dashboard, not files in this repo." This avoids stale numbers from the static report mirrors.
- **Cite, don't paraphrase**: ask the assistant to quote the source file by name when it cites a principle or a figure. This makes errors visible.
- **Use the glossary**: [`glossary.md`](glossary.md) defines JST, MAP, AB 123, BAS-ASIO, MIS, CCAP, and ~25 other terms. Paste it once at the start of a long chat to avoid acronym drift.

## Patterns that go wrong

- **Asking for current metrics without pointing at the dashboard.** Files in `policy-and-funding/` and `playbooks/` are mirrors of static documents. Their numbers reflect publication date, not today. Always route live-metric questions to the dashboards.
- **Pasting only one file for a strategic question.** Methodology files are short and meant to be used together. Stacking 2–3 produces noticeably better outputs than pasting one.
- **Trusting AI-generated synthesis without checking citations.** Ask the assistant to name the source file for every claim. Spot-check the highest-stakes ones.

## What this repo is not

- Not a real-time system. Numbers in `policy-and-funding/`, `playbooks/`, and `research/` reflect each document's publication date. For real-time, use the dashboards.
- Not exhaustive. This is a curated public subset of a private knowledge base. Drafts, internal critiques, college-specific updates, and personnel matters are intentionally excluded.
- Not authoritative for legal or accreditation questions. For ACCJC, Title 5, or federal compliance, consult the source documents linked from `policy-and-funding/` and your accreditation liaison.

## Refresh cadence

This repo is refreshed quarterly, or after a major release (sprint completion, new fact sheet, new legislative report). See [`CURATION.md`](CURATION.md) for the process. If you spot stale content, open an issue.

## Questions?

Open an issue on this repo, or contact the MAP team — see the [`README.md`](README.md) for current contact info.
