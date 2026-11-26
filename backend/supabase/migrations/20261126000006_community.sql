-- BẢN NHÀ · 6. Ngân hàng đồ cũ · 7. Học bổng & hướng nghiệp · 8. Kho văn hóa

create table app.donation_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  donor_id uuid not null references app.profiles (id),
  category text not null check (category in ('textbook', 'uniform', 'winter_clothes', 'school_supplies', 'other')),
  title text not null check (length(title) between 2 and 120),
  grade smallint check (grade between 6 and 12),
  size text check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  condition text not null check (condition in ('like_new', 'good', 'used')),
  photo_path text,
  status text not null default 'available' check (status in ('available', 'reserved', 'given')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.donation_items (school_id, status, category);

create table app.item_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  requester_id uuid not null references app.profiles (id),
  category text not null check (category in ('textbook', 'uniform', 'winter_clothes', 'school_supplies', 'other')),
  item_id uuid references app.donation_items (id),
  grade smallint check (grade between 6 and 12),
  size text check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  note text check (length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'matched', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.item_requests (school_id, status, category);

create table app.item_matches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  item_id uuid not null references app.donation_items (id),
  request_id uuid not null references app.item_requests (id),
  matched_by uuid not null references app.profiles (id),
  status text not null default 'proposed' check (status in ('proposed', 'handed_over', 'cancelled')),
  handed_over_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index item_matches_active_item
  on app.item_matches (item_id) where status <> 'cancelled' and deleted_at is null;

create table app.scholarships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  title text not null check (length(title) between 2 and 200),
  provider text not null check (length(provider) between 2 and 200),
  amount_text text check (length(amount_text) <= 120),
  eligibility text not null check (length(eligibility) <= 3000),
  for_ethnic_minority boolean not null default false,
  grades smallint[] not null default '{}',
  deadline date,
  apply_link text check (apply_link ~ '^https://'),
  created_by uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app.scholarship_bookmarks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  scholarship_id uuid not null references app.scholarships (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (student_id, scholarship_id)
);

create table app.articles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  category text not null check (category in ('admission_policy', 'career', 'guide')),
  title text not null check (length(title) between 2 and 200),
  body_md text not null check (length(body_md) <= 50000),
  published boolean not null default false,
  created_by uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app.career_results (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  student_id uuid not null references app.profiles (id),
  answers jsonb not null,
  top_groups text[] not null check (top_groups <@ array['R', 'I', 'A', 'S', 'E', 'C']),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table app.culture_posts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  author_id uuid not null references app.profiles (id),
  ethnicity text not null check (length(ethnicity) between 2 and 40),
  category text not null check (category in ('costume', 'festival', 'food', 'custom', 'language', 'craft')),
  title text not null check (length(title) between 2 and 200),
  body text not null check (length(body) between 10 and 10000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 4),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  reviewed_by uuid references app.profiles (id),
  review_note text check (length(review_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on app.culture_posts (school_id, status, ethnicity);

create table app.culture_likes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references app.schools (id),
  post_id uuid not null references app.culture_posts (id),
  user_id uuid not null references app.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (post_id, user_id)
);
