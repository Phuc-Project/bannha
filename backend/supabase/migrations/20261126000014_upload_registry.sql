-- BẢN NHÀ · upload registry: file paths no longer contain the uploader's id (donors stay
-- anonymous), so ownership is recorded here when the backend signs an upload URL.

create table app.uploads (
  path text primary key check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'),
  school_id uuid not null references app.schools (id),
  bucket text not null check (bucket in ('avatars', 'room-issues', 'menus', 'donations', 'culture', 'tutor')),
  owner_id uuid not null references app.profiles (id),
  created_at timestamptz not null default now()
);
create index on app.uploads (owner_id, created_at desc);
alter table app.uploads enable row level security;
create policy uploads_own on app.uploads for select to authenticated using (owner_id = (select auth.uid()));
grant select on app.uploads to authenticated;
grant all on app.uploads to service_role;

-- A path may be attached to a row only by the user it was issued to, in the right bucket.
create or replace function private.owns_upload(p text, wanted_bucket text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p is null or exists (
    select 1 from app.uploads u
    where u.path = p and u.owner_id = auth.uid() and u.bucket = wanted_bucket
  )
$$;
revoke all on function private.owns_upload(text, text) from public, anon;
grant execute on function private.owns_upload(text, text) to authenticated;

create or replace function private.check_upload_paths()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bucket text := tg_argv[0];
  col text := tg_argv[1];
  value jsonb := to_jsonb(new) -> col;
  old_value jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) -> col end;
  item text;
begin
  if private.is_system() or value is null or value = 'null'::jsonb or value is not distinct from old_value then
    return new;
  end if;
  if jsonb_typeof(value) = 'array' then
    for item in select jsonb_array_elements_text(value) loop
      if not private.owns_upload(item, bucket) then
        raise exception 'file was not uploaded by this user' using errcode = '42501';
      end if;
    end loop;
  elsif not private.owns_upload(value #>> '{}', bucket) then
    raise exception 'file was not uploaded by this user' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Replace the path-prefix constraints from migration 12.
alter table app.room_issues drop constraint room_issue_photo_own;
alter table app.donation_items drop constraint donation_photo_own;
alter table app.tutor_messages drop constraint tutor_image_own;
alter table app.menus drop constraint menu_photo_in_school;
alter table app.profiles drop constraint avatar_in_school;
alter table app.culture_posts drop constraint culture_photos_own;
drop function private.own_path(text, uuid, uuid);

create trigger room_issues_upload before insert or update on app.room_issues
  for each row execute function private.check_upload_paths('room-issues', 'photo_path');
create trigger donation_items_upload before insert or update on app.donation_items
  for each row execute function private.check_upload_paths('donations', 'photo_path');
create trigger tutor_messages_upload before insert or update on app.tutor_messages
  for each row execute function private.check_upload_paths('tutor', 'image_path');
create trigger menus_upload before insert or update on app.menus
  for each row execute function private.check_upload_paths('menus', 'photo_path');
create trigger profiles_upload before insert or update on app.profiles
  for each row execute function private.check_upload_paths('avatars', 'avatar_path');
create trigger culture_posts_upload before insert or update on app.culture_posts
  for each row execute function private.check_upload_paths('culture', 'photo_paths');

-- Failed password checks, for rate limiting (written by the backend only).
create index if not exists audit_log_actor_action_idx on app.audit_log (actor_id, action, created_at desc);
