-- BẢN NHÀ · authorization helpers used by RLS policies.
-- SECURITY DEFINER so they can read app.profiles without recursing into its own policies.
-- Roles and school always come from app.profiles, never from JWT claims.

create or replace function private.current_school_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.school_id
  from app.profiles p
  where p.id = auth.uid() and p.active and p.deleted_at is null
$$;

create or replace function private.has_role(role_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((
    select role_name = any (p.roles)
    from app.profiles p
    where p.id = auth.uid() and p.active and p.deleted_at is null
  ), false)
$$;

create or replace function private.has_any_role(role_names text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((
    select p.roles && role_names
    from app.profiles p
    where p.id = auth.uid() and p.active and p.deleted_at is null
  ), false)
$$;

create or replace function private.is_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.has_any_role(array['teacher', 'dorm_staff', 'medical_staff', 'kitchen_staff', 'admin'])
$$;

create or replace function private.is_guardian_of(student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from app.guardian_links g
    where g.parent_id = auth.uid() and g.student_id = student and g.deleted_at is null
  )
$$;

create or replace function private.is_homeroom_class(class uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from app.classes c
    where c.id = class and c.homeroom_teacher_id = auth.uid() and c.deleted_at is null
  )
$$;

create or replace function private.is_homeroom_of(student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.profiles s
    join app.classes c on c.id = s.class_id
    where s.id = student and c.homeroom_teacher_id = auth.uid() and c.deleted_at is null
  )
$$;

-- The student, their guardians and their homeroom teacher.
create or replace function private.in_student_circle(student uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select student = auth.uid() or private.is_guardian_of(student) or private.is_homeroom_of(student)
$$;

create or replace function private.my_class_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.class_id from app.profiles p where p.id = auth.uid()
$$;

-- True when running as a privileged role (backend service / migrations), not as an end user.
create or replace function private.is_system()
returns boolean
language sql stable
set search_path = ''
as $$
  select current_user in ('service_role', 'postgres', 'supabase_admin')
$$;

-- Users may edit only their contact fields; identity and access fields need the backend.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_system() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.school_id is distinct from old.school_id
     or new.username is distinct from old.username
     or new.roles is distinct from old.roles
     or new.class_id is distinct from old.class_id
     or new.room_id is distinct from old.room_id
     or new.must_change_password is distinct from old.must_change_password
     or new.active is distinct from old.active
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'profile field is managed by the school' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on app.profiles
  for each row execute function private.guard_profile_update();

-- Rows always belong to the writer's school (blocks cross-school writes).
create or replace function private.guard_school_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_system() then
    return new;
  end if;
  if new.school_id is distinct from private.current_school_id() then
    raise exception 'row belongs to another school' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.school_id is distinct from old.school_id then
    raise exception 'school_id cannot change' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function
  private.current_school_id(), private.has_role(text), private.has_any_role(text[]),
  private.is_staff(), private.is_guardian_of(uuid), private.is_homeroom_class(uuid),
  private.is_homeroom_of(uuid), private.in_student_circle(uuid), private.my_class_id()
from public, anon;

grant usage on schema private to authenticated, service_role;
grant execute on function
  private.current_school_id(), private.has_role(text), private.has_any_role(text[]),
  private.is_staff(), private.is_guardian_of(uuid), private.is_homeroom_class(uuid),
  private.is_homeroom_of(uuid), private.in_student_circle(uuid), private.my_class_id(),
  private.is_system()
to authenticated, service_role;
