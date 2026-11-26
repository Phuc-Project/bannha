-- BẢN NHÀ · sample data for local development (`npx supabase db reset`).
-- Accounts get a random password here; `uv run python scripts/seed.py` then sets SEED_PASSWORD.
-- IDs are deterministic (md5 of a label) so tests can refer to them.

create or replace function pg_temp.sid(label text) returns uuid
language sql immutable as $$ select md5('ban-nha:' || label)::uuid $$;

-- school, rooms, classes -------------------------------------------------------------------
insert into app.schools (id, name, code, address, dorm_hotline, medical_hotline, meal_cancel_cutoff_hour)
values (pg_temp.sid('school'), '[TÊN TRƯỜNG]', 'ptdtnt-mau', '[ĐỊA CHỈ TRƯỜNG]', '0212 3800 101', '0212 3800 115', 15);

insert into app.dorm_rooms (id, school_id, building, name, capacity)
select pg_temp.sid('room:' || r), pg_temp.sid('school'), left(r, 1), r, 8
from unnest(array['A101', 'A102', 'A103', 'B201', 'B202', 'B203']) as r;

-- accounts ----------------------------------------------------------------------------------
create temp table seed_accounts (
  username text primary key, full_name text, roles text[], ethnicity text, class text, room text
);
insert into seed_accounts values
  ('admin01', 'Đinh Văn Quang', '{admin}', null, null, null),
  ('gv01', 'Hoàng Thị Thu', '{teacher,dorm_staff}', 'Tày', null, null),
  ('gv02', 'Bùi Văn Hưng', '{teacher}', 'Mường', null, null),
  ('qs01', 'Hà Văn Quân', '{dorm_staff}', 'Thái', null, null),
  ('yt01', 'Đinh Thị Hằng', '{medical_staff}', null, null, null),
  ('bep01', 'Lương Thị Nhung', '{kitchen_staff}', 'Thái', null, null),
  ('ph01', 'Lò Văn Thắm', '{parent}', 'Thái', null, null),
  ('ph02', 'Giàng A Lử', '{parent}', 'Mông', null, null),
  ('hs24001', 'Giàng A Páo', '{student}', 'Mông', '10A1', 'A101'),
  ('hs24002', 'Vàng Thị Dua', '{student}', 'Mông', '10A1', 'B201'),
  ('hs24003', 'Triệu Văn Phú', '{student}', 'Dao', '10A1', 'A101'),
  ('hs24004', 'Bàn Thị Mây', '{student}', 'Dao', '11A2', 'B201'),
  ('hs24005', 'Hoàng Thị Lan', '{student}', 'Tày', '11A2', 'B201'),
  ('hs24006', 'Nông Văn Toàn', '{student}', 'Tày', '10A1', 'A101'),
  ('hs24007', 'Lò Thị Mai', '{student}', 'Thái', '11A2', 'B202'),
  ('hs24008', 'Lường Văn Khánh', '{student}', 'Thái', '10A1', 'A102'),
  ('hs24009', 'Bùi Thị Hoa', '{student}', 'Mường', '11A2', 'B202'),
  ('hs24010', 'Lăng Văn Sơn', '{student}', 'Nùng', '11A2', 'A102'),
  ('hs24011', 'Lò Văn Pắn', '{student}', 'Khơ Mú', '10A1', 'A103'),
  ('hs24012', 'Lỳ Thị Xuân', '{student}', 'Hà Nhì', '10A1', 'B203'),
  ('hs24013', 'Lam Văn Hùng', '{student}', 'Sán Dìu', '11A2', 'A103'),
  ('hs24014', 'Sùng Thị Nga', '{student}', 'Giáy', '11A2', 'B203');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', pg_temp.sid('user:' || a.username), 'authenticated', 'authenticated',
  a.username || '@bannha.internal',
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', ''
from seed_accounts a;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), pg_temp.sid('user:' || a.username), pg_temp.sid('user:' || a.username)::text,
  jsonb_build_object('sub', pg_temp.sid('user:' || a.username)::text,
                     'email', a.username || '@bannha.internal', 'email_verified', true),
  'email', now(), now(), now()
from seed_accounts a;

insert into app.profiles (id, school_id, username, full_name, roles, ethnicity, room_id, must_change_password)
select pg_temp.sid('user:' || a.username), pg_temp.sid('school'), a.username, a.full_name, a.roles, a.ethnicity,
       case when a.room is null then null else pg_temp.sid('room:' || a.room) end, true
from seed_accounts a;

insert into app.classes (id, school_id, name, grade, school_year, homeroom_teacher_id) values
  (pg_temp.sid('class:10A1'), pg_temp.sid('school'), '10A1', 10, '2026-2027', pg_temp.sid('user:gv01')),
  (pg_temp.sid('class:11A2'), pg_temp.sid('school'), '11A2', 11, '2026-2027', pg_temp.sid('user:gv02'));

update app.profiles p set class_id = pg_temp.sid('class:' || a.class)
from seed_accounts a
where p.username = a.username and a.class is not null;

insert into app.guardian_links (school_id, parent_id, student_id, relation) values
  (pg_temp.sid('school'), pg_temp.sid('user:ph01'), pg_temp.sid('user:hs24007'), 'father'),
  (pg_temp.sid('school'), pg_temp.sid('user:ph01'), pg_temp.sid('user:hs24011'), 'father'),
  (pg_temp.sid('school'), pg_temp.sid('user:ph02'), pg_temp.sid('user:hs24001'), 'father');
