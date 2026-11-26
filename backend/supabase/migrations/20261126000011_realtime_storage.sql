-- BẢN NHÀ · Realtime channels and private Storage buckets.

-- Realtime: only the events that must reach staff instantly (RLS still filters receivers).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table app.sos_alerts, app.health_reports, app.leave_requests, app.notifications;
  end if;
end;
$$;

-- Storage: all private, ≤ 5 MB, images only. Files are reached only through signed URLs
-- issued by the backend; there are deliberately no storage.objects policies for end users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('room-issues', 'room-issues', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('menus', 'menus', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('donations', 'donations', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('culture', 'culture', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('tutor', 'tutor', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
