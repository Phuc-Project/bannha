-- BẢN NHÀ · 3. Sổ liên lạc · 4. Gia sư AI · 5. Y tế học đường

create table app.grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  subject text not null check (length(subject) between 2 and 60),
  term text not null check (term in ('HK1', 'HK2')),
  school_year text not null check (school_year ~ '^[0-9]{4}-[0-9]{4}$'),
  kind text not null check (kind in ('oral', '15min', '45min', 'midterm', 'final')),
  seq smallint not null default 1 check (seq between 1 and 10),
  score numeric(4, 2) not null check (score between 0 and 10),
  recorded_by uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index grades_one_slot
  on app.grades (student_id, school_year, term, subject, kind, seq) where deleted_at is null;

create table app.lesson_topics (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  class_id uuid not null references app.classes (id),
  subject text not null check (length(subject) between 2 and 60),
  week_start date not null,
  title text not null check (length(title) between 2 and 200),
  summary text check (length(summary) <= 2000),
  created_by uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.lesson_topics (class_id, week_start);

create table app.tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  subject text not null check (length(subject) between 2 and 60),
  lesson_topic_id uuid references app.lesson_topics (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.tutor_sessions (student_id, created_at desc);

create table app.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  session_id uuid not null references app.tutor_sessions (id),
  student_id uuid not null references app.profiles (id),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) <= 8000),
  image_path text,
  action text check (action in ('ask', 'hint', 'solution')),
  topic_tag text check (length(topic_tag) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.tutor_messages (session_id, created_at);

create table app.tutor_usage (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  date date not null,
  count smallint not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (student_id, date)
);

create table app.tutor_practice_sets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  lesson_topic_id uuid not null references app.lesson_topics (id),
  questions jsonb not null,
  answers jsonb,
  score smallint check (score between 0 and 5),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app.health_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  symptoms text[] not null check (
    cardinality(symptoms) between 1 and 10
    and symptoms <@ array['fever', 'headache', 'stomachache', 'cough', 'dizzy', 'sore_throat', 'vomit', 'injury', 'other']
  ),
  temperature numeric(3, 1) check (temperature between 34 and 43),
  note text check (length(note) <= 1000),
  status text not null default 'new' check (status in ('new', 'seen', 'handled')),
  handled_by uuid references app.profiles (id),
  handled_note text check (length(handled_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.health_reports (student_id, created_at desc);
create index on app.health_reports (school_id, status);

create table app.health_checks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  height_cm numeric(4, 1) check (height_cm between 80 and 220),
  weight_kg numeric(4, 1) check (weight_kg between 15 and 150),
  measured_at date not null,
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.health_checks (student_id, measured_at);

create table app.medical_reminders (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  title text not null check (length(title) between 2 and 200),
  due_at timestamptz not null,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.medical_reminders (school_id, due_at);

create table app.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  location_note text check (length(location_note) <= 300),
  client_at timestamptz,
  acknowledged_by uuid references app.profiles (id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.sos_alerts (school_id, created_at desc);
