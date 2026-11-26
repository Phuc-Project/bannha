-- BẢN NHÀ · 1. Ký túc xá số · 2. Bếp ăn minh bạch

create table app.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  kind text not null check (kind in ('morning', 'evening_study', 'night_check')),
  date date not null,
  building text check (length(building) <= 40),
  created_by uuid not null references app.profiles (id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.attendance_sessions (school_id, date);

create table app.attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  session_id uuid not null references app.attendance_sessions (id),
  student_id uuid not null references app.profiles (id),
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  method text not null check (method in ('qr', 'manual', 'auto')),
  recorded_at timestamptz not null default now(),
  recorded_by uuid references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (session_id, student_id)
);
create index on app.attendance_records (student_id);

create table app.leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  created_by uuid not null references app.profiles (id),
  kind text not null check (kind in ('go_home', 'sick', 'other')),
  from_at timestamptz not null,
  to_at timestamptz not null,
  reason text not null check (length(reason) between 2 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references app.profiles (id),
  reviewed_at timestamptz,
  review_note text check (length(review_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (to_at > from_at),
  check (to_at - from_at <= interval '30 days')
);
create index on app.leave_requests (student_id, from_at);
create index on app.leave_requests (school_id, status);

create table app.room_issues (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  room_id uuid not null references app.dorm_rooms (id),
  reported_by uuid not null references app.profiles (id),
  category text not null check (category in ('electric', 'water', 'door_window', 'bed', 'other')),
  description text not null check (length(description) between 2 and 1000),
  photo_path text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.room_issues (school_id, status);

create table app.menus (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  dishes text[] not null default '{}' check (cardinality(dishes) <= 12),
  note text check (length(note) <= 500),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index menus_one_per_meal on app.menus (school_id, date, meal) where deleted_at is null;

create table app.meal_cancellations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  source text not null default 'manual' check (source in ('manual', 'leave_request')),
  leave_request_id uuid references app.leave_requests (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((source = 'leave_request') = (leave_request_id is not null))
);
create unique index meal_cancellations_once
  on app.meal_cancellations (student_id, date, meal) where deleted_at is null;
create index on app.meal_cancellations (school_id, date);

create table app.dish_suggestions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  name text not null check (length(name) between 2 and 120),
  ethnicity text check (length(ethnicity) <= 40),
  description text check (length(description) <= 1000),
  status text not null default 'new' check (status in ('new', 'planned', 'served')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app.dish_votes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  suggestion_id uuid not null references app.dish_suggestions (id),
  student_id uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (suggestion_id, student_id)
);

-- Meals to cook = boarders − cancellations, per school/date/meal (menu rows define the meals).
create view app.meal_counts
with (security_invoker = true)
as
select
  m.school_id,
  m.date,
  m.meal,
  b.total_students,
  coalesce(c.cancelled, 0) as cancelled,
  b.total_students - coalesce(c.cancelled, 0) as to_cook
from app.menus m
cross join lateral (
  select count(*)::int as total_students
  from app.profiles p
  where p.school_id = m.school_id and 'student' = any (p.roles)
    and p.room_id is not null and p.active and p.deleted_at is null
) b
left join lateral (
  select count(*)::int as cancelled
  from app.meal_cancellations mc
  where mc.school_id = m.school_id and mc.date = m.date and mc.meal = m.meal
    and mc.deleted_at is null
) c on true
where m.deleted_at is null;
