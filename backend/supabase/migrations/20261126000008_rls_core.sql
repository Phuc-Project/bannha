-- BẢN NHÀ · RLS for foundation, messages and bookkeeping tables.
-- Every policy is scoped to the caller's school. `(select ...)` wrappers let Postgres
-- evaluate the helper once per statement instead of once per row.

-- schools ----------------------------------------------------------------------------
create policy schools_read on app.schools for select to authenticated
  using (id = (select private.current_school_id()));

-- dorm rooms & classes: everyone in the school reads; admins write -------------------------
create policy rooms_read on app.dorm_rooms for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy rooms_admin_insert on app.dorm_rooms for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('admin')));
create policy rooms_admin_update on app.dorm_rooms for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

create policy classes_read on app.classes for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy classes_admin_insert on app.classes for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('admin')));
create policy classes_admin_update on app.classes for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

-- profiles: self, own children, own parents, and staff see full rows ------------------------
create policy profiles_read on app.profiles for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      id = (select auth.uid())
      or (select private.is_staff())
      or private.is_guardian_of(id)
      or exists (
        select 1 from app.guardian_links g
        where g.parent_id = profiles.id and g.student_id = (select auth.uid()) and g.deleted_at is null
      )
    )
  );
-- Only contact fields can change (enforced by the profiles_guard trigger).
create policy profiles_self_update on app.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Names everyone in the school may see (authors, teachers…), without contact or health data.
create view app.directory
with (security_barrier = true)
as
select p.id, p.school_id, p.full_name, p.roles, p.class_id, p.updated_at, p.deleted_at
from app.profiles p
where p.school_id = private.current_school_id();
grant select on app.directory to authenticated;

-- guardian links ---------------------------------------------------------------------------
create policy guardians_read on app.guardian_links for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (parent_id = (select auth.uid()) or student_id = (select auth.uid()) or (select private.is_staff()))
  );
create policy guardians_admin_insert on app.guardian_links for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('admin')));
create policy guardians_admin_update on app.guardian_links for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

-- notifications: only the recipient; created by the backend ---------------------------------
create policy notifications_read on app.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_mark_read on app.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- announcements -------------------------------------------------------------------------------
create policy announcements_read on app.announcements for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      created_by = (select auth.uid())
      or (select private.is_staff())
      or audience = 'all'
      or (audience = 'students' and (select private.has_role('student')))
      or (audience = 'parents' and (select private.has_role('parent')))
      or (audience = 'class' and (
            class_id = (select private.my_class_id())
            or exists (
              select 1 from app.guardian_links g join app.profiles s on s.id = g.student_id
              where g.parent_id = (select auth.uid()) and g.deleted_at is null and s.class_id = announcements.class_id
            )))
      or (audience = 'student' and (student_id = (select auth.uid()) or private.is_guardian_of(student_id)))
    )
  );
create policy announcements_insert on app.announcements for insert to authenticated
  with check (
    school_id = (select private.current_school_id())
    and created_by = (select auth.uid())
    and (
      (select private.has_any_role(array['admin', 'dorm_staff']))
      or ((select private.has_role('teacher')) and (
            (audience = 'class' and private.is_homeroom_class(class_id))
            or (audience = 'student' and private.is_homeroom_of(student_id))))
    )
  );
create policy announcements_update on app.announcements for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy announcement_reads_read on app.announcement_reads for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from app.announcements a
      where a.id = announcement_reads.announcement_id and a.created_by = (select auth.uid())
    )
  );
create policy announcement_reads_insert on app.announcement_reads for insert to authenticated
  with check (user_id = (select auth.uid()) and school_id = (select private.current_school_id()));
create policy announcement_reads_update on app.announcement_reads for update to authenticated
  using (user_id = (select auth.uid()));

-- bookkeeping ---------------------------------------------------------------------------------
create policy sync_ops_own on app.sync_ops for select to authenticated
  using (user_id = (select auth.uid()));
create policy sync_ops_insert on app.sync_ops for insert to authenticated
  with check (user_id = (select auth.uid()) and school_id = (select private.current_school_id()));

create policy qr_keys_read on app.qr_signing_keys for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (select private.has_any_role(array['dorm_staff', 'admin']))
  );

create policy audit_admin_read on app.audit_log for select to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

-- reminder_log: no policies → invisible to end users (backend only).
