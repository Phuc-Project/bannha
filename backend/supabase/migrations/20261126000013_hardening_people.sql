-- BẢN NHÀ · review fixes, part 2: who reads full profiles, meal totals, per-user sync ops, indexes.

-- L1: kitchen staff do not need children's phones, rooms or ethnicity -------------------------------
drop policy profiles_read on app.profiles;
create policy profiles_read on app.profiles for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      id = (select auth.uid())
      or (select private.has_any_role(array['teacher', 'dorm_staff', 'medical_staff', 'admin']))
      or private.is_guardian_of(id)
      or exists (
        select 1 from app.guardian_links g
        where g.parent_id = profiles.id and g.student_id = (select auth.uid()) and g.deleted_at is null
      )
    )
  );

-- Boarder count without exposing the rows it counts.
create or replace function private.boarder_count(school uuid)
returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int
  from app.profiles p
  where p.school_id = school and school = private.current_school_id()
    and 'student' = any (p.roles) and p.room_id is not null and p.active and p.deleted_at is null
$$;
revoke all on function private.boarder_count(uuid) from public, anon;
grant execute on function private.boarder_count(uuid) to authenticated;

create or replace view app.meal_counts
with (security_invoker = true)
as
select
  m.school_id,
  m.date,
  m.meal,
  private.boarder_count(m.school_id) as total_students,
  coalesce(c.cancelled, 0) as cancelled,
  private.boarder_count(m.school_id) - coalesce(c.cancelled, 0) as to_cook
from app.menus m
left join lateral (
  select count(*)::int as cancelled
  from app.meal_cancellations mc
  where mc.school_id = m.school_id and mc.date = m.date and mc.meal = m.meal and mc.deleted_at is null
) c on true
where m.deleted_at is null;

-- L4: op ids are unique per user, so nobody can pre-claim another user's op id ---------------------
alter table app.sync_ops drop constraint sync_ops_pkey;
alter table app.sync_ops add primary key (user_id, op_id);

-- Indexes used by policies and joins ------------------------------------------------------------------
create index if not exists item_requests_requester_idx on app.item_requests (requester_id);
create index if not exists item_matches_request_idx on app.item_matches (request_id);
create index if not exists tutor_messages_student_idx on app.tutor_messages (student_id);
create index if not exists announcement_reads_user_idx on app.announcement_reads (user_id);
