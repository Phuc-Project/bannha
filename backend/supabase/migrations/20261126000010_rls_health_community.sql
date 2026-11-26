-- BẢN NHÀ · RLS for health, donations, scholarships and culture tables.

-- health: the student, their guardians, their homeroom teacher, medical and dorm staff -------
create policy health_reports_read on app.health_reports for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['medical_staff', 'dorm_staff'])))
  );
create policy health_reports_insert on app.health_reports for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and student_id = (select auth.uid())
    and (select private.has_role('student')) and status = 'new'
  );
create policy health_reports_update on app.health_reports for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['medical_staff', 'dorm_staff'])));

create policy health_checks_read on app.health_checks for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['medical_staff', 'dorm_staff'])))
  );
create policy health_checks_insert on app.health_checks for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('medical_staff')));
create policy health_checks_update on app.health_checks for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('medical_staff')));

create policy reminders_read on app.medical_reminders for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['medical_staff', 'dorm_staff'])))
  );
create policy reminders_insert on app.medical_reminders for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('medical_staff')));
create policy reminders_update on app.medical_reminders for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('medical_staff')));

create policy sos_read on app.sos_alerts for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['medical_staff', 'dorm_staff'])))
  );
create policy sos_insert on app.sos_alerts for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and student_id = (select auth.uid())
    and (select private.has_role('student'))
  );
create policy sos_update on app.sos_alerts for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['medical_staff', 'dorm_staff'])));

-- donations: donors stay anonymous to students (the backend never returns donor_id to them) ---
create policy items_read on app.donation_items for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (status = 'available' or donor_id = (select auth.uid()) or (select private.has_any_role(array['dorm_staff', 'admin'])))
  );
create policy items_insert on app.donation_items for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and donor_id = (select auth.uid()) and status = 'available'
  );
create policy items_update on app.donation_items for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and ((donor_id = (select auth.uid()) and status = 'available') or (select private.has_role('dorm_staff')))
  );

-- Needs are private: only the student who asked and dorm staff (dignity of poorer students).
create policy requests_read on app.item_requests for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (requester_id = (select auth.uid()) or (select private.has_role('dorm_staff')))
  );
create policy requests_insert on app.item_requests for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and requester_id = (select auth.uid()) and status = 'open'
  );
create policy requests_update on app.item_requests for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and (requester_id = (select auth.uid()) or (select private.has_role('dorm_staff')))
  );

create policy matches_read on app.item_matches for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      (select private.has_role('dorm_staff'))
      or exists (select 1 from app.item_requests r where r.id = request_id and r.requester_id = (select auth.uid()))
    )
  );
create policy matches_insert on app.item_matches for insert to authenticated
  with check (school_id = (select private.current_school_id()) and matched_by = (select auth.uid()) and (select private.has_role('dorm_staff')));
create policy matches_update on app.item_matches for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('dorm_staff')));

-- scholarships & articles -----------------------------------------------------------------------
create policy scholarships_read on app.scholarships for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy scholarships_insert on app.scholarships for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('admin')));
create policy scholarships_update on app.scholarships for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

create policy bookmarks_own on app.scholarship_bookmarks for select to authenticated
  using (student_id = (select auth.uid()));
create policy bookmarks_insert on app.scholarship_bookmarks for insert to authenticated
  with check (school_id = (select private.current_school_id()) and student_id = (select auth.uid()));
create policy bookmarks_update on app.scholarship_bookmarks for update to authenticated
  using (student_id = (select auth.uid()));

create policy articles_read on app.articles for select to authenticated
  using (school_id = (select private.current_school_id()) and (published or (select private.has_role('admin'))));
create policy articles_insert on app.articles for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('admin')));
create policy articles_update on app.articles for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('admin')));

create policy career_own on app.career_results for select to authenticated
  using (student_id = (select auth.uid()));
create policy career_insert on app.career_results for insert to authenticated
  with check (school_id = (select private.current_school_id()) and student_id = (select auth.uid()));

-- culture ----------------------------------------------------------------------------------------
create policy culture_read on app.culture_posts for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (status = 'published' or author_id = (select auth.uid())
         or (select private.has_any_role(array['teacher', 'admin'])))
  );
create policy culture_insert on app.culture_posts for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and author_id = (select auth.uid())
    and status = 'pending' and (select private.has_role('student'))
  );
create policy culture_update on app.culture_posts for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and ((author_id = (select auth.uid()) and status <> 'published')
         or (select private.has_any_role(array['teacher', 'admin'])))
  );

create policy likes_read on app.culture_likes for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy likes_insert on app.culture_likes for insert to authenticated
  with check (school_id = (select private.current_school_id()) and user_id = (select auth.uid()));
create policy likes_update on app.culture_likes for update to authenticated
  using (user_id = (select auth.uid()));
