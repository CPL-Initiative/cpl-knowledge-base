-- Curatable per-campaign letter blocks.
--
-- The DOCX templates carry only scaffolding (date, addressees, subject,
-- signature) plus paragraph-level {{P_<KEY>}} tokens. The edge function
-- resolves these tokens from this table at render time, then expands inline
-- {{TOKEN}}s (ORG_NAME, SW_STUDENTS, etc.) — so editing copy doesn't require
-- a redeploy of either the function or the templates.
--
-- block_key examples: 'opening', 'rationale', 'stats', 'institution', 'example', 'ask', 'cta'
-- scope:              'all' = default fallback; 'individual'/'joint'/'statewide' override 'all'
--
-- Every UPDATE/DELETE snapshots the prior row to letter_block_history so
-- prior versions can be inspected (and manually restored).

create table public.letter_blocks (
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  block_key    text not null,
  scope        text not null default 'all'
                 check (scope in ('all','individual','joint','statewide')),
  content      text not null,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  primary key (campaign_id, block_key, scope)
);

create table public.letter_block_history (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null,
  block_key    text not null,
  scope        text not null,
  content      text not null,
  updated_at   timestamptz,
  updated_by   text,
  archived_at  timestamptz not null default now()
);

create or replace function public.snapshot_letter_block() returns trigger as $$
begin
  if (tg_op = 'UPDATE' or tg_op = 'DELETE') then
    insert into public.letter_block_history
      (campaign_id, block_key, scope, content, updated_at, updated_by)
    values
      (old.campaign_id, old.block_key, old.scope, old.content, old.updated_at, old.updated_by);
  end if;
  if (tg_op = 'DELETE') then return old; end if;
  return new;
end;
$$ language plpgsql;

create trigger letter_blocks_snapshot
  before update or delete on public.letter_blocks
  for each row execute function public.snapshot_letter_block();

create or replace view public.letter_blocks_public
with (security_invoker = on) as
select campaign_id, block_key, scope, content, updated_at
from public.letter_blocks;

grant select on public.letter_blocks_public to anon, authenticated;

create or replace view public.letter_block_history_public
with (security_invoker = on) as
select id, campaign_id, block_key, scope, content, updated_at, updated_by, archived_at
from public.letter_block_history;

grant select on public.letter_block_history_public to anon, authenticated;

alter table public.letter_blocks enable row level security;
alter table public.letter_block_history enable row level security;
-- (No policies → service-role only; the letter-curator edge fn handles writes
--  and gates them on the CURATOR_PASSCODE env var.)
