-- Seed the two active campaigns for the May 2026 Revise.
-- Invitee rows are loaded separately from a CSV via scripts/import_invitees.ts.

insert into public.campaigns (slug, name, letter_type, subject_line, deadline, ask_amount)
values
  (
    'may-2026-revise-rc',
    'May 2026 Revise — Regional Consortia Letter',
    'rc',
    'SUPPORT CREDIT FOR PRIOR LEARNING FUNDING',
    '2026-06-15 17:00:00-07',
    '$37M ($2M ongoing + $35M one-time)'
  ),
  (
    'may-2026-revise-college',
    'May 2026 Revise — CEO/CIO/CSSO Letter',
    'college',
    'SUBJECT: SUPPORT CREDIT FOR PRIOR LEARNING FUNDING',
    '2026-06-15 17:00:00-07',
    '$37M ($2M ongoing + $35M one-time)'
  )
on conflict (slug) do nothing;
