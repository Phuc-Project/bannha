-- BẢN NHÀ · fixes from the B1 security review (tests: tests/db/test_rls_hardening.py).

-- Owner columns never change once written (except by the backend's system role) ----------------
create or replace function private.freeze_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  col text;
begin
  if private.is_system() then
    return new;
  end if;
  foreach col in array tg_argv loop
    if (to_jsonb(new) -> col) is distinct from (to_jsonb(old) -> col) then
      raise exception 'column % cannot change', col using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

create trigger leave_freeze before update on app.leave_requests
  for each row execute function private.freeze_columns('student_id', 'created_by', 'kind', 'from_at', 'to_at');
create trigger room_issues_freeze before update on app.room_issues
  for each row execute function private.freeze_columns('reported_by', 'room_id', 'photo_path');
create trigger items_freeze before update on app.donation_items
  for each row execute function private.freeze_columns('donor_id');
create trigger requests_freeze before update on app.item_requests
  for each row execute function private.freeze_columns('requester_id', 'item_id');
create trigger culture_freeze before update on app.culture_posts
  for each row execute function private.freeze_columns('author_id');
create trigger health_freeze before update on app.health_reports
  for each row execute function private.freeze_columns('student_id', 'symptoms', 'temperature', 'note');
create trigger sos_freeze before update on app.sos_alerts
  for each row execute function private.freeze_columns('student_id', 'client_at', 'location_note');
create trigger dishes_freeze before update on app.dish_suggestions
  for each row execute function private.freeze_columns('student_id');
create trigger meal_cancel_freeze before update on app.meal_cancellations
  for each row execute function private.freeze_columns('student_id', 'source', 'leave_request_id');
create trigger grades_freeze before update on app.grades
  for each row execute function private.freeze_columns('student_id', 'subject', 'term', 'school_year', 'kind', 'seq');
create trigger notifications_freeze before update on app.notifications
  for each row execute function private.freeze_columns('user_id', 'type', 'title', 'body', 'link');

-- Profiles: name and avatar are managed by the school too (M1) -------------------------------
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_system() then
    return new;
  end if;
  if (to_jsonb(new) - 'phone' - 'updated_at') is distinct from (to_jsonb(old) - 'phone' - 'updated_at') then
    raise exception 'profile field is managed by the school' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Storage paths must sit in the writer's own folder: <school>/<owner>/<uuid>.<ext> (H2) -----------
create or replace function private.own_path(path text, school uuid, owner uuid)
returns boolean
language sql immutable
set search_path = ''
as $$
  select path is null
      or path ~ ('^' || school::text || '/' || coalesce(owner::text, '[0-9a-f-]{36}')
                 || '/[0-9a-f-]{36}\.(webp|jpg|png)$')
$$;

alter table app.room_issues add constraint room_issue_photo_own
  check (private.own_path(photo_path, school_id, reported_by));
alter table app.donation_items add constraint donation_photo_own
  check (private.own_path(photo_path, school_id, donor_id));
alter table app.tutor_messages add constraint tutor_image_own
  check (private.own_path(image_path, school_id, student_id));
alter table app.menus add constraint menu_photo_in_school
  check (private.own_path(photo_path, school_id, null));
alter table app.profiles add constraint avatar_in_school
  check (private.own_path(avatar_path, school_id, null));
alter table app.culture_posts add constraint culture_photos_own
  check (private.own_path(photo_paths[1], school_id, author_id)
     and private.own_path(photo_paths[2], school_id, author_id)
     and private.own_path(photo_paths[3], school_id, author_id)
     and private.own_path(photo_paths[4], school_id, author_id));

-- Leave requests: owners may only cancel; reviewers must sign their review (H1) ------------------
drop policy leave_update on app.leave_requests;
create policy leave_update_owner on app.leave_requests for update to authenticated
  using (school_id = (select private.current_school_id()) and created_by = (select auth.uid()) and status = 'pending')
  with check (
    created_by = (select auth.uid()) and status in ('pending', 'cancelled')
    and reviewed_by is null and reviewed_at is null and review_note is null
  );
create policy leave_update_reviewer on app.leave_requests for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and ((select private.has_role('dorm_staff')) or private.is_homeroom_of(student_id))
  )
  with check (
    reviewed_by = (select auth.uid()) and status in ('approved', 'rejected')
    and ((select private.has_role('dorm_staff')) or private.is_homeroom_of(student_id))
  );

-- Announcements: the update check repeats the insert rules (H3); narrower reads (M2) -------------
create or replace function private.may_announce(audience text, class uuid, student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.has_any_role(array['admin', 'dorm_staff'])
      or (private.has_role('teacher') and (
            (audience = 'class' and private.is_homeroom_class(class))
            or (audience = 'student' and private.is_homeroom_of(student))))
$$;
grant execute on function private.may_announce(text, uuid, uuid) to authenticated;

drop policy announcements_update on app.announcements;
create policy announcements_update on app.announcements for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and private.may_announce(audience, class_id, student_id));

drop policy announcements_read on app.announcements;
create policy announcements_read on app.announcements for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      created_by = (select auth.uid())
      or (select private.has_any_role(array['admin', 'dorm_staff']))
      or audience = 'all'
      or (audience = 'students' and (select private.has_any_role(array['student', 'teacher'])))
      or (audience = 'parents' and (select private.has_any_role(array['parent', 'teacher'])))
      or (audience = 'class' and (
            class_id = (select private.my_class_id())
            or private.is_homeroom_class(class_id)
            or exists (
              select 1 from app.guardian_links g join app.profiles s on s.id = g.student_id
              where g.parent_id = (select auth.uid()) and g.deleted_at is null and s.class_id = announcements.class_id
            )))
      or (audience = 'student' and (
            student_id = (select auth.uid()) or private.is_guardian_of(student_id) or private.is_homeroom_of(student_id)))
    )
  );

-- Signed fields (M3) -----------------------------------------------------------------------------
drop policy grades_update on app.grades;
create policy grades_update on app.grades for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('teacher')) and private.is_homeroom_of(student_id))
  with check (recorded_by = (select auth.uid()) and private.is_homeroom_of(student_id));

drop policy att_records_insert on app.attendance_records;
create policy att_records_insert on app.attendance_records for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and recorded_by = (select auth.uid())
    and (select private.has_role('dorm_staff'))
  );
drop policy att_records_update on app.attendance_records;
create policy att_records_update on app.attendance_records for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('dorm_staff')))
  with check (recorded_by = (select auth.uid()) and (select private.has_role('dorm_staff')));

drop policy culture_update on app.culture_posts;
create policy culture_update_author on app.culture_posts for update to authenticated
  using (school_id = (select private.current_school_id()) and author_id = (select auth.uid()) and status <> 'published')
  with check (author_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and review_note is null);
create policy culture_update_reviewer on app.culture_posts for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['teacher', 'admin'])))
  -- Permissive WITH CHECKs are OR-ed across policies, so every branch repeats its role test.
  with check (reviewed_by = (select auth.uid()) and (select private.has_any_role(array['teacher', 'admin'])));

-- Owners cannot set workflow states (M4) ---------------------------------------------------------
drop policy requests_update on app.item_requests;
create policy requests_update_owner on app.item_requests for update to authenticated
  using (school_id = (select private.current_school_id()) and requester_id = (select auth.uid()) and status = 'open')
  with check (requester_id = (select auth.uid()) and status in ('open', 'cancelled'));
create policy requests_update_staff on app.item_requests for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('dorm_staff')));

drop policy dishes_update on app.dish_suggestions;
create policy dishes_update_owner on app.dish_suggestions for update to authenticated
  using (school_id = (select private.current_school_id()) and student_id = (select auth.uid()) and status = 'new')
  with check (student_id = (select auth.uid()) and status = 'new');
create policy dishes_update_kitchen on app.dish_suggestions for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['kitchen_staff', 'admin'])));

drop policy tutor_messages_insert on app.tutor_messages;
create policy tutor_messages_insert on app.tutor_messages for insert to authenticated
  with check (
    student_id = (select auth.uid()) and role = 'user'
    and exists (select 1 from app.tutor_sessions s where s.id = session_id and s.student_id = (select auth.uid()))
  );

-- Practice sets hold answer keys and scores: written only by the backend.
drop policy practice_insert on app.tutor_practice_sets;
drop policy practice_update on app.tutor_practice_sets;
revoke insert, update on app.tutor_practice_sets from authenticated;
