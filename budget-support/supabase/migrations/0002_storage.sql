-- Storage bucket for uploaded logos.
-- Public-read so logos can be embedded directly in emails and generated DOCX/PDF letters.
-- Writes go through a signed Storage upload URL minted by the edge function (which
-- validates the invitee token) so anonymous users cannot enumerate or overwrite buckets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  2 * 1024 * 1024,            -- 2 MB max per logo
  array['image/png','image/jpeg','image/svg+xml','image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read policy. (Public bucket already exposes a public URL, but we set
-- the RLS policy explicitly to match.)
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');

-- No direct INSERT/UPDATE policy for anon — uploads happen via a service-role
-- signed URL issued by the edge function once the invitee token is validated.
