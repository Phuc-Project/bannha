-- BẢN NHÀ · system helpers for in-transaction notifications and leave meal sync.
-- SECURITY DEFINER so authenticated command handlers can notify users in their school
-- and sync leave-linked meal cancellations without opening raw table policies.

create or replace function private.create_notification(
  target_user uuid,
  n_type text,
  n_title text,
  n_body text default null,
  n_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school uuid;
  v_target_school uuid;
  v_id uuid;
begin
  select p.school_id into v_target_school
  from app.profiles p
  where p.id = target_user and p.deleted_at is null;

  if v_target_school is null then
    raise exception 'recipient not found' using errcode = 'P0002';
  end if;

  if private.is_system() then
    v_school := v_target_school;
  else
    v_school := private.current_school_id();
    if v_school is null or v_school is distinct from v_target_school then
      raise exception 'cannot notify user outside school' using errcode = '42501';
    end if;
  end if;

  insert into app.notifications (school_id, user_id, type, title, body, link)
  values (v_school, target_user, n_type, n_title, n_body, n_link)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function private.set_leave_meal_cancellations(
  p_leave_id uuid,
  p_dates date[],
  p_meals text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lr app.leave_requests%rowtype;
  v_inserted integer := 0;
begin
  select * into v_lr
  from app.leave_requests lr
  where lr.id = p_leave_id and lr.deleted_at is null;

  if not found then
    raise exception 'leave request not found' using errcode = 'P0002';
  end if;

  if not private.is_system() then
    if v_lr.school_id is distinct from private.current_school_id()
       or not (
         v_lr.created_by = auth.uid()
         or private.has_role('dorm_staff')
         or private.is_homeroom_of(v_lr.student_id)
       ) then
      raise exception 'not allowed to sync leave meals' using errcode = '42501';
    end if;
  end if;

  update app.meal_cancellations
  set deleted_at = now()
  where leave_request_id = p_leave_id
    and source = 'leave_request'
    and deleted_at is null;

  if v_lr.status = 'approved'
     and v_lr.kind = 'go_home'
     and coalesce(cardinality(p_dates), 0) > 0 then
    insert into app.meal_cancellations (school_id, student_id, date, meal, source, leave_request_id)
    select v_lr.school_id, v_lr.student_id, t.d, t.m, 'leave_request', p_leave_id
    from unnest(p_dates, p_meals) as t(d, m)
    on conflict (student_id, date, meal) where deleted_at is null do nothing;

    get diagnostics v_inserted = row_count;
  end if;

  return v_inserted;
end;
$$;

revoke all on function
  private.create_notification(uuid, text, text, text, text),
  private.set_leave_meal_cancellations(uuid, date[], text[])
from public, anon;

grant execute on function
  private.create_notification(uuid, text, text, text, text),
  private.set_leave_meal_cancellations(uuid, date[], text[])
to authenticated, service_role;
