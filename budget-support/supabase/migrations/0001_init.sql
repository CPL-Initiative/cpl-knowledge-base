-- CPL Budget Support — initial schema
--
-- Tracks legislator-letter endorsement campaigns. Each invited
-- consortium/CEO/CIO/CSSO gets a unique tokenized URL, fills in their
-- local blanks (and optionally uploads a logo), and submits an endorsement.
-- The admin dashboard reads aggregate counts; a Supabase edge function
-- assembles personalized + joint DOCX letters from the captured data.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- campaigns ----------
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  letter_type   text not null check (letter_type in ('rc','college')),
  subject_line  text not null,
  deadline      timestamptz,
  active        boolean not null default true,
  ask_amount    text not null default '$37M ($2M ongoing + $35M one-time)',
  created_at    timestamptz not null default now()
);

-- ---------- invitees ----------
create table public.invitees (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  token         uuid not null unique default gen_random_uuid(),
  org_name      text not null,
  org_slug      text,
  region        text,
  signer_name   text,
  signer_title  text,
  signer_email  citext,
  invited_at    timestamptz,
  reminded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index invitees_campaign_idx on public.invitees(campaign_id);
create index invitees_token_idx    on public.invitees(token);

-- ---------- responses ----------
create table public.responses (
  id                      uuid primary key default gen_random_uuid(),
  invitee_id              uuid not null unique references public.invitees(id) on delete cascade,
  status                  text not null default 'pending'
                            check (status in ('pending','supported','declined')),
  units_awarded           text,
  students_served         text,
  programs                text,
  regional_example        text,
  custom_notes            text,
  decline_reason          text,
  signer_name_confirmed   text,
  signer_title_confirmed  text,
  submitted_at            timestamptz,
  user_agent              text,
  ip_address              inet,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index responses_status_idx on public.responses(status);

-- ---------- assets (logos) ----------
create table public.assets (
  id            uuid primary key default gen_random_uuid(),
  invitee_id    uuid not null references public.invitees(id) on delete cascade,
  kind          text not null default 'logo' check (kind in ('logo','signature')),
  storage_path  text not null,
  mime_type     text,
  size_bytes    integer,
  uploaded_at   timestamptz not null default now()
);
create index assets_invitee_idx on public.assets(invitee_id);

-- ---------- audit trigger: updated_at ----------
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger invitees_touch    before update on public.invitees   for each row execute function public.touch_updated_at();
create trigger responses_touch   before update on public.responses  for each row execute function public.touch_updated_at();

-- ---------- public RPCs (the only path anonymous users have in) ----------

-- Look up an invitee by token. Returns the invitee record plus campaign info
-- plus the latest response (if any) and any uploaded logo path.
create or replace function public.get_invitee_by_token(p_token uuid)
returns table (
  invitee_id        uuid,
  org_name          text,
  org_slug          text,
  region            text,
  signer_name       text,
  signer_title      text,
  signer_email      text,
  campaign_id       uuid,
  campaign_name     text,
  campaign_slug     text,
  letter_type       text,
  subject_line      text,
  ask_amount        text,
  status            text,
  units_awarded     text,
  students_served   text,
  programs          text,
  regional_example  text,
  custom_notes      text,
  signer_name_confirmed   text,
  signer_title_confirmed  text,
  submitted_at      timestamptz,
  logo_path         text
)
language sql
security definer
set search_path = public
as $$
  select
    i.id, i.org_name, i.org_slug, i.region,
    i.signer_name, i.signer_title, i.signer_email::text,
    c.id, c.name, c.slug, c.letter_type, c.subject_line, c.ask_amount,
    coalesce(r.status, 'pending'),
    r.units_awarded, r.students_served, r.programs,
    r.regional_example, r.custom_notes,
    r.signer_name_confirmed, r.signer_title_confirmed,
    r.submitted_at,
    (select storage_path from public.assets a
       where a.invitee_id = i.id and a.kind='logo'
       order by uploaded_at desc limit 1)
  from public.invitees i
  join public.campaigns c on c.id = i.campaign_id
  left join public.responses r on r.invitee_id = i.id
  where i.token = p_token
  limit 1;
$$;
grant execute on function public.get_invitee_by_token(uuid) to anon, authenticated;

-- Submit (or update) a response for an invitee identified by token.
create or replace function public.submit_response(
  p_token                 uuid,
  p_status                text,
  p_units_awarded         text default null,
  p_students_served       text default null,
  p_programs              text default null,
  p_regional_example      text default null,
  p_custom_notes          text default null,
  p_signer_name_confirmed text default null,
  p_signer_title_confirmed text default null,
  p_decline_reason        text default null,
  p_user_agent            text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitee_id uuid;
  v_response_id uuid;
begin
  if p_status not in ('pending','supported','declined') then
    raise exception 'invalid status: %', p_status;
  end if;

  select id into v_invitee_id from public.invitees where token = p_token;
  if v_invitee_id is null then
    raise exception 'invalid token';
  end if;

  insert into public.responses (
    invitee_id, status,
    units_awarded, students_served, programs,
    regional_example, custom_notes,
    signer_name_confirmed, signer_title_confirmed,
    decline_reason, submitted_at, user_agent
  ) values (
    v_invitee_id, p_status,
    p_units_awarded, p_students_served, p_programs,
    p_regional_example, p_custom_notes,
    p_signer_name_confirmed, p_signer_title_confirmed,
    p_decline_reason, now(), p_user_agent
  )
  on conflict (invitee_id) do update
    set status                 = excluded.status,
        units_awarded          = coalesce(excluded.units_awarded,          public.responses.units_awarded),
        students_served        = coalesce(excluded.students_served,        public.responses.students_served),
        programs               = coalesce(excluded.programs,               public.responses.programs),
        regional_example       = coalesce(excluded.regional_example,       public.responses.regional_example),
        custom_notes           = coalesce(excluded.custom_notes,           public.responses.custom_notes),
        signer_name_confirmed  = coalesce(excluded.signer_name_confirmed,  public.responses.signer_name_confirmed),
        signer_title_confirmed = coalesce(excluded.signer_title_confirmed, public.responses.signer_title_confirmed),
        decline_reason         = coalesce(excluded.decline_reason,         public.responses.decline_reason),
        submitted_at           = now(),
        user_agent             = coalesce(excluded.user_agent,             public.responses.user_agent)
  returning id into v_response_id;

  return v_response_id;
end;
$$;
grant execute on function public.submit_response(uuid,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;

-- Record a logo upload (the actual file goes to Storage; this just registers it).
create or replace function public.record_logo_upload(
  p_token        uuid,
  p_storage_path text,
  p_mime_type    text,
  p_size_bytes   integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitee_id uuid;
  v_asset_id uuid;
begin
  select id into v_invitee_id from public.invitees where token = p_token;
  if v_invitee_id is null then
    raise exception 'invalid token';
  end if;

  -- one logo per invitee — replace any previous one
  delete from public.assets where invitee_id = v_invitee_id and kind = 'logo';
  insert into public.assets (invitee_id, kind, storage_path, mime_type, size_bytes)
  values (v_invitee_id, 'logo', p_storage_path, p_mime_type, p_size_bytes)
  returning id into v_asset_id;

  return v_asset_id;
end;
$$;
grant execute on function public.record_logo_upload(uuid,text,text,integer) to anon, authenticated;

-- ---------- public read-only campaign-summary view ----------
-- Powers the project-tracker tile. Counts only; no signer PII.
create or replace view public.campaign_summary_public
with (security_invoker = on) as
select
  c.slug,
  c.name,
  c.letter_type,
  c.deadline,
  c.active,
  count(*) filter (where coalesce(r.status,'pending') = 'supported')   as supported_count,
  count(*) filter (where coalesce(r.status,'pending') = 'declined')    as declined_count,
  count(*) filter (where coalesce(r.status,'pending') = 'pending')     as pending_count,
  count(*)                                                              as total_invited,
  max(r.submitted_at) filter (where r.status = 'supported')             as last_supported_at
from public.campaigns c
left join public.invitees i  on i.campaign_id = c.id
left join public.responses r on r.invitee_id  = i.id
where c.active
group by c.id;

grant select on public.campaign_summary_public to anon, authenticated;

-- ---------- public signatory roster (only supported signers) ----------
-- Used by the joint-letter generator and the public "supporters" widget.
create or replace view public.signatories_public
with (security_invoker = on) as
select
  c.slug          as campaign_slug,
  c.letter_type   as letter_type,
  i.org_name,
  i.region,
  r.signer_name_confirmed   as signer_name,
  r.signer_title_confirmed  as signer_title,
  r.submitted_at,
  (select storage_path from public.assets a
     where a.invitee_id = i.id and a.kind='logo'
     order by uploaded_at desc limit 1) as logo_path
from public.campaigns c
join public.invitees   i on i.campaign_id = c.id
join public.responses  r on r.invitee_id  = i.id
where c.active and r.status = 'supported';

grant select on public.signatories_public to anon, authenticated;

-- ---------- RLS — deny all direct table access except through RPCs/views ----------
alter table public.campaigns enable row level security;
alter table public.invitees  enable row level security;
alter table public.responses enable row level security;
alter table public.assets    enable row level security;

-- No policies = no access for anon/authenticated; only service_role bypasses RLS.
-- Anonymous users reach data exclusively through the SECURITY DEFINER RPCs and
-- the campaign_summary_public / signatories_public views above.
