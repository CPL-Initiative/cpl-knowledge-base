# Letter template placeholders

The `templates/template_*.docx` files use `{{KEY}}` tokens that the edge function
replaces at letter-generation time. If a key has no value, it renders as
`[___]` so the writer can see what still needs filling in.

## Per-invitee (filled from invitee + response form)

| Key | Source |
| --- | --- |
| `{{LETTER_DATE}}` | today, formatted as "May 22, 2026" |
| `{{ORG_NAME}}` | `invitees.org_name` |
| `{{REGION}}` | `invitees.region` (RC letter only) |
| `{{UNITS_AWARDED}}` | `responses.units_awarded` |
| `{{STUDENTS_SERVED}}` | `responses.students_served` |
| `{{PROGRAMS}}` | `responses.programs` |
| `{{REASON}}` | `responses.custom_notes` |
| `{{EXAMPLE_NARRATIVE}}` | `responses.regional_example` |
| `{{OUTCOME}}` | hard-coded narrative phrase (overridable later) |
| `{{EXPANSION}}` | unused on per-invitee letters; filled on joint letters |
| `{{SIGNER_NAME}}` | `responses.signer_name_confirmed`, fallback `invitees.signer_name`, fallback `letter_blocks` row with `block_key='signer_name'` |
| `{{SIGNER_TITLE}}` | same chain with `block_key='signer_title'` |

Signer name + title for the statewide and joint letter modes are stored as
`letter_blocks` rows (block_key = `signer_name` / `signer_title`, scope =
`statewide` or `joint`) and are editable in the curator UI alongside the
paragraph blocks. Per-invitee individual letters still use the invitee's
own confirmed name when present.

## Statewide (filled from `live_metrics.json` on each generation)

| Key | Source field |
| --- | --- |
| `{{SW_STUDENTS}}` | `metrics["STUDENTS SERVED"].value` |
| `{{SW_MILITARY}}` | …breakdown "Military" |
| `{{SW_WORKFORCE}}` | …breakdown "Workforce/Other" |
| `{{SW_APPRENTICE}}` | …breakdown "Apprentice" |
| `{{SW_ELIGIBLE_UNITS}}` | `metrics["ELIGIBLE UNITS"].value` |
| `{{SW_TRANSCRIBED_UNITS}}` | `metrics["TRANSCRIBED UNITS"].value` |
| `{{SW_SAVINGS}}` | `metrics["SAVINGS"].value` |
| `{{SW_20Y_IMPACT}}` | `metrics["20-YEAR IMPACT"].value` |
| `{{SW_ACTIVE_COLLEGES}}` | `active_college_count` |
| `{{SW_TOTAL_COLLEGES}}` | `college_count` |
| `{{SW_LEADING_COLLEGES}}` | `tiers.leading.count` |

If the metrics JSON is unreachable at generation time, the edge function falls
back to the values from 2026-05-25 baked into `index.ts`.

## Adding a new placeholder

1. Edit `templates/template_college.docx` and/or `templates/template_rc.docx` in Word and insert `{{NEW_KEY}}` where you want it.
2. Commit & push — the edge function fetches the template fresh on cold-start.
3. Add a corresponding entry in the `vars` object in `supabase/functions/generate-letter/index.ts` (both `buildIndividual` and `buildJoint`).
4. If user input is needed, add a field to `web/index.html` + `web/app.js`.
5. Redeploy the function (the templates do not require a redeploy; the function does).

## Why find-and-replace instead of docxtemplater?

Both work in Deno. Find-and-replace on `word/document.xml` is dramatically smaller
(no npm dependency tree, no eval-of-template-syntax) and predictable enough for the
straightforward placeholders this letter needs. If we add conditionals or repeated
sections (e.g. a per-signatory logo table) we should switch to docxtemplater.
