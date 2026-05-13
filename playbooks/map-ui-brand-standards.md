---
title: MAP UI / Brand Standards
audience: developers, designers, college web teams
last_updated: 2026-04
license: CC BY 4.0
---

# MAP UI / Brand Standards

Reference standards for any web property, page, or visual artifact that represents the MAP platform or a college's CPL landing surface. Aligns with the California Community Colleges Chancellor's Office (CCCCO) brand and with the layout patterns proven on `map.rccd.edu`.

If you're a college web team building a CPL landing page, or a partner integrating with MAP, these are the conventions to follow.

## Brand palette (CCCCO)

| Role | Hex |
|---|---|
| Primary Blue | `#0066BA` |
| Dark Blue | `#003B71` |
| Gold | `#D4A843` |
| Dark Gray | `#555555` |

## Typography

- **Headings:** Crimson Text
- **Body:** Source Sans Pro

## Layout patterns for CPL landing pages

1. **Student-first headline** — open with a benefit statement to the student, not an institutional description.
2. **3-step visual process** — show "submit your transcript / experience → faculty review → credit on transcript" as three steps.
3. **Credit types collapsed** — list military, certifications, portfolio, exam, etc. in a single collapsible section. Don't make the student choose a type up front.
4. **Live stats bar** — a single row of headline figures (students served, eligible units, transcribed units) sourced from the public CPL Insights Dashboard rather than hand-coded.
5. **Search + district / region filters** — the primary navigation for finding a participating college.
6. **Card-based college list** — each college gets a uniform card with logo, name, tier indicator, and a deep link.
7. **"Not sure which college?" CTA** — a prominent fallback that routes to the public CPL Dashboard's college finder.

## Technical conventions

- **Enrollment:** college landing pages should hand off to CCCApply for enrollment, not implement a parallel intake form.
- **Logos:** the canonical college logos are embedded from `map.rccd.edu`. For production use, host the logos locally on the deploying property — do not hot-link.
- **Stats:** all live figures are sourced from the public CPL Insights Dashboard. Avoid hard-coded numbers — they go stale within days. (See `current-status/README.md` for the live API.)
- **Accessibility:** body type and palette should be tested for WCAG AA contrast. The Primary Blue / Dark Gray pair on white passes; verify any custom combinations before shipping.

## What this is not

- This is not a comprehensive design system. It's the working set of conventions used across `map.rccd.edu`, the published CPL Insights Dashboard, and the CCCCO CPL landing properties.
- For full CCCCO brand guidelines (logo lockups, photography style, document templates), consult the Chancellor's Office Communications team.

## Related

- [MAP Platform overview](../overview/map-platform.md)
- [Live dashboards and APIs](../current-status/README.md)
