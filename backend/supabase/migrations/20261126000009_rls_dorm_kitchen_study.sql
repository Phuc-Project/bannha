-- BẢN NHÀ · RLS for dorm, kitchen, contact book and tutor tables.

-- attendance ------------------------------------------------------------------------------
create policy att_sessions_read on app.attendance_sessions for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy att_sessions_write on app.attendance_sessions for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and created_by = (select auth.uid())
    and (select private.has_any_role(array['dorm_staff', 'admin']))
  );
create policy att_sessions_update on app.attendance_sessions for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['dorm_staff', 'admin'])));

create policy att_records_read on app.attendance_records for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['dorm_staff', 'admin'])))
  );
create policy att_records_insert on app.attendance_records for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_role('dorm_staff')));
create policy att_records_update on app.attendance_records for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_role('dorm_staff')));

-- leave requests ---------------------------------------------------------------------------
create policy leave_read on app.leave_requests for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_any_role(array['dorm_staff', 'admin'])))
  );
create policy leave_insert on app.leave_requests for insert to authenticated
  with check (
    school_id = (select private.current_school_id())
    and created_by = (select auth.uid())
    and status = 'pending'
    and ((student_id = (select auth.uid()) and (select private.has_role('student'))) or private.is_guardian_of(student_id))
  );
create policy leave_update on app.leave_requests for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and (
      (created_by = (select auth.uid()) and status = 'pending')
      or (select private.has_role('dorm_staff'))
      or private.is_homeroom_of(student_id)
    )
  );

-- room issues ------------------------------------------------------------------------------
create policy room_issues_read on app.room_issues for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (reported_by = (select auth.uid()) or (select private.has_any_role(array['dorm_staff', 'admin'])))
  );
create policy room_issues_insert on app.room_issues for insert to authenticated
  with check (school_id = (select private.current_school_id()) and reported_by = (select auth.uid()));
create policy room_issues_update on app.room_issues for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['dorm_staff', 'admin'])));

-- kitchen --------------------------------------------------------------------------------------
create policy menus_read on app.menus for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy menus_insert on app.menus for insert to authenticated
  with check (school_id = (select private.current_school_id()) and (select private.has_any_role(array['kitchen_staff', 'admin'])));
create policy menus_update on app.menus for update to authenticated
  using (school_id = (select private.current_school_id()) and (select private.has_any_role(array['kitchen_staff', 'admin'])));

create policy meal_cancel_read on app.meal_cancellations for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id)
         or (select private.has_any_role(array['kitchen_staff', 'dorm_staff', 'admin'])))
  );
create policy meal_cancel_insert on app.meal_cancellations for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and source = 'manual'
    and ((student_id = (select auth.uid()) and (select private.has_role('student'))) or private.is_guardian_of(student_id))
  );
create policy meal_cancel_update on app.meal_cancellations for update to authenticated
  using (
    school_id = (select private.current_school_id()) and source = 'manual'
    and (student_id = (select auth.uid()) or private.is_guardian_of(student_id))
  );

create policy dishes_read on app.dish_suggestions for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy dishes_insert on app.dish_suggestions for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and student_id = (select auth.uid())
    and (select private.has_role('student')) and status = 'new'
  );
create policy dishes_update on app.dish_suggestions for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and (student_id = (select auth.uid()) or (select private.has_any_role(array['kitchen_staff', 'admin'])))
  );

create policy votes_read on app.dish_votes for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy votes_insert on app.dish_votes for insert to authenticated
  with check (school_id = (select private.current_school_id()) and student_id = (select auth.uid()) and (select private.has_role('student')));
create policy votes_update on app.dish_votes for update to authenticated
  using (student_id = (select auth.uid()));

-- contact book --------------------------------------------------------------------------------
create policy grades_read on app.grades for select to authenticated
  using (
    school_id = (select private.current_school_id())
    and (private.in_student_circle(student_id) or (select private.has_role('admin')))
  );
create policy grades_insert on app.grades for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and recorded_by = (select auth.uid())
    and (select private.has_role('teacher')) and private.is_homeroom_of(student_id)
  );
create policy grades_update on app.grades for update to authenticated
  using (
    school_id = (select private.current_school_id())
    and (select private.has_role('teacher')) and private.is_homeroom_of(student_id)
  );

-- tutor -------------------------------------------------------------------------------------------
create policy topics_read on app.lesson_topics for select to authenticated
  using (school_id = (select private.current_school_id()));
create policy topics_insert on app.lesson_topics for insert to authenticated
  with check (
    school_id = (select private.current_school_id()) and created_by = (select auth.uid())
    and (private.is_homeroom_class(class_id) or (select private.has_role('admin')))
  );
create policy topics_update on app.lesson_topics for update to authenticated
  using (school_id = (select private.current_school_id()) and created_by = (select auth.uid()));

-- Conversations are private to the student (teachers get aggregate stats via the backend).
create policy tutor_sessions_own on app.tutor_sessions for select to authenticated
  using (student_id = (select auth.uid()));
create policy tutor_sessions_insert on app.tutor_sessions for insert to authenticated
  with check (student_id = (select auth.uid()) and (select private.has_role('student')));
create policy tutor_sessions_update on app.tutor_sessions for update to authenticated
  using (student_id = (select auth.uid()));

create policy tutor_messages_own on app.tutor_messages for select to authenticated
  using (student_id = (select auth.uid()));
create policy tutor_messages_insert on app.tutor_messages for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (select 1 from app.tutor_sessions s where s.id = session_id and s.student_id = (select auth.uid()))
  );

create policy tutor_usage_own on app.tutor_usage for select to authenticated
  using (student_id = (select auth.uid()));

create policy practice_own on app.tutor_practice_sets for select to authenticated
  using (student_id = (select auth.uid()));
create policy practice_insert on app.tutor_practice_sets for insert to authenticated
  with check (student_id = (select auth.uid()) and (select private.has_role('student')));
create policy practice_update on app.tutor_practice_sets for update to authenticated
  using (student_id = (select auth.uid()));
