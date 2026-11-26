-- BẢN NHÀ · notifications, announcements, and backend bookkeeping tables.

create table app.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  user_id uuid not null references app.profiles (id),
  type text not null check (type ~ '^[a-z_.]{3,60}$'),
  title text not null check (length(title) between 1 and 200),
  body text check (length(body) <= 2000),
  link text check (length(link) <= 300),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.notifications (user_id, created_at desc);

create table app.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  audience text not null check (audience in ('all', 'students', 'parents', 'class', 'student')),
  class_id uuid references app.classes (id),
  student_id uuid references app.profiles (id),
  title text not null check (length(title) between 1 and 200),
  body text not null check (length(body) between 1 and 5000),
  created_by uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((audience = 'class') = (class_id is not null)),
  check ((audience = 'student') = (student_id is not null))
);
create index on app.announcements (class_id);
create index on app.announcements (student_id);

create table app.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  announcement_id uuid not null references app.announcements (id),
  user_id uuid not null references app.profiles (id),
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (announcement_id, user_id)
);

-- Idempotency for /sync/push: one row per processed client command.
create table app.sync_ops (
  op_id uuid primary key,
  school_id uuid not null references app.schools (id),
  user_id uuid not null references app.profiles (id),
  command text not null check (command ~ '^[a-z_]+\.[a-z_]+$'),
  status text not null check (status in ('applied', 'rejected')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on app.sync_ops (user_id, created_at desc);

-- Public halves of the Ed25519 keys that sign student QR cards.
create table app.qr_signing_keys (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  version smallint not null check (version >= 1),
  public_key text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (school_id, version)
);

-- Scheduled reminders already sent (prevents duplicates).
create table app.reminder_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  kind text not null,
  ref_id uuid not null,
  user_id uuid not null references app.profiles (id),
  sent_on date not null,
  created_at timestamptz not null default now(),
  unique (kind, ref_id, user_id, sent_on)
);

-- Who changed sensitive things, and when.
create table app.audit_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  actor_id uuid references app.profiles (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on app.audit_log (school_id, created_at desc);
