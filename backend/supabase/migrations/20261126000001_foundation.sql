-- BẢN NHÀ · foundation: schemas, schools, people, classes, rooms.
-- All business tables live in schema `app`, which is NOT exposed through PostgREST:
-- clients reach data only through the FastAPI backend (RLS still applies there).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
create schema if not exists private;

-- updated_at maintenance -------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- schools -----------------------------------------------------------------------
create table app.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  address text,
  dorm_hotline text check (dorm_hotline ~ '^[0-9+ ]{6,20}$'),
  medical_hotline text check (medical_hotline ~ '^[0-9+ ]{6,20}$'),
  meal_cancel_cutoff_hour smallint not null default 15 check (meal_cancel_cutoff_hour between 0 and 23),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- dorm rooms ----------------------------------------------------------------------
create table app.dorm_rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  building text not null check (length(building) between 1 and 40),
  name text not null check (length(name) between 1 and 40),
  capacity smallint not null default 8 check (capacity between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (school_id, building, name)
);

-- profiles (1:1 with auth.users) ---------------------------------------------------
create table app.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references app.schools (id),
  username text not null unique check (username ~ '^[a-z]{2,6}[0-9]{2,6}$'),
  full_name text not null check (length(full_name) between 2 and 120),
  roles text[] not null check (
    cardinality(roles) >= 1
    and roles <@ array['student', 'teacher', 'dorm_staff', 'medical_staff', 'kitchen_staff', 'parent', 'admin']
  ),
  phone text check (phone ~ '^[0-9+ ]{6,20}$'),
  ethnicity text check (length(ethnicity) <= 40),
  avatar_path text,
  class_id uuid,
  room_id uuid references app.dorm_rooms (id),
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- classes -------------------------------------------------------------------------
create table app.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  name text not null check (length(name) between 1 and 20),
  grade smallint not null check (grade between 6 and 12),
  school_year text not null check (school_year ~ '^[0-9]{4}-[0-9]{4}$'),
  homeroom_teacher_id uuid references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (school_id, school_year, name)
);

alter table app.profiles
  add constraint profiles_class_fk foreign key (class_id) references app.classes (id);

-- parent ↔ student --------------------------------------------------------------
create table app.guardian_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  parent_id uuid not null references app.profiles (id),
  student_id uuid not null references app.profiles (id),
  relation text not null default 'guardian'
    check (relation in ('father', 'mother', 'grandparent', 'sibling', 'guardian')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (parent_id, student_id),
  check (parent_id <> student_id)
);

create index on app.profiles (class_id);
create index on app.profiles (room_id);
create index on app.guardian_links (student_id);
create index on app.classes (homeroom_teacher_id);
