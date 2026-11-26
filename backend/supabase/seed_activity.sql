-- BẢN NHÀ · sample activity (menus, attendance, requests, grades, community). Dates are
-- relative to the day you run `db reset` so the app always has "this week" data.

create or replace function pg_temp.sid(label text) returns uuid
language sql immutable as $$ select md5('ban-nha:' || label)::uuid $$;

create temp view seed_students as
select p.id, p.username, p.full_name, p.class_id, row_number() over (order by p.username) as n
from app.profiles p where 'student' = any (p.roles);

-- menus: this week and next week (Mon–Sun), 3 meals -------------------------------------------
insert into app.menus (school_id, date, meal, dishes)
select pg_temp.sid('school'), d::date, plan.meal, plan.dishes
from generate_series(date_trunc('week', current_date), date_trunc('week', current_date) + interval '13 days', interval '1 day') d
join (values
  (1, 'breakfast', array['Xôi ngô', 'Lạc rang']),
  (2, 'breakfast', array['Bánh mì', 'Sữa đậu nành']),
  (3, 'breakfast', array['Cháo thịt băm']),
  (4, 'breakfast', array['Mì nấu thịt', 'Rau cải']),
  (5, 'breakfast', array['Xôi đỗ xanh', 'Muối vừng']),
  (6, 'breakfast', array['Bún nấu thịt']),
  (7, 'breakfast', array['Cháo đậu xanh', 'Trứng luộc']),
  (1, 'lunch', array['Cơm trắng', 'Thịt kho', 'Canh rau cải', 'Đậu phụ rán']),
  (2, 'lunch', array['Cơm trắng', 'Cá rán', 'Canh bí nấu tôm', 'Rau muống luộc']),
  (3, 'lunch', array['Cơm trắng', 'Gà luộc', 'Canh rau ngót', 'Su su xào']),
  (4, 'lunch', array['Cơm trắng', 'Thịt rang', 'Canh cải chua', 'Đậu phụ sốt cà chua']),
  (5, 'lunch', array['Cơm trắng', 'Trứng rán', 'Canh mướp', 'Bắp cải luộc']),
  (6, 'lunch', array['Cơm trắng', 'Thịt lợn luộc', 'Canh rau cải', 'Măng xào']),
  (7, 'lunch', array['Cơm trắng', 'Cá kho', 'Canh bí đỏ', 'Rau cải xào tỏi']),
  (1, 'dinner', array['Cơm trắng', 'Đậu phụ sốt cà chua', 'Canh rau cải nấu thịt', 'Cá rán']),
  (2, 'dinner', array['Cơm trắng', 'Thịt kho trứng', 'Canh bí xanh']),
  (3, 'dinner', array['Cơm trắng', 'Thịt xào su hào', 'Canh rau dền']),
  (4, 'dinner', array['Cơm trắng', 'Gà rang gừng', 'Canh cải']),
  (5, 'dinner', array['Cơm trắng', 'Cá sốt cà chua', 'Canh rau ngót']),
  (6, 'dinner', array['Cơm trắng', 'Thịt rang cháy cạnh', 'Canh mồng tơi']),
  (7, 'dinner', array['Cơm trắng', 'Trứng đúc thịt', 'Canh bầu'])
) as plan (dow, meal, dishes) on plan.dow = extract(isodow from d)::int;

-- evening self-study attendance for the past 14 days ---------------------------------------------
insert into app.attendance_sessions (id, school_id, kind, date, created_by, closed_at)
select pg_temp.sid('att:' || d::date), pg_temp.sid('school'), 'evening_study', d::date,
       pg_temp.sid('user:qs01'), d::date + time '21:00'
from generate_series(current_date - 14, current_date - 1, interval '1 day') d;

insert into app.attendance_records (school_id, session_id, student_id, status, method, recorded_at, recorded_by)
select pg_temp.sid('school'), pg_temp.sid('att:' || d::date), s.id,
  case
    when (s.n * 7 + extract(doy from d)::int) % 23 = 0 then 'absent'
    when (s.n * 5 + extract(doy from d)::int) % 11 = 0 then 'late'
    when s.username = 'hs24005' and d::date = current_date - 3 then 'excused'
    else 'present'
  end,
  'qr', d::date + time '19:05', pg_temp.sid('user:qs01')
from generate_series(current_date - 14, current_date - 1, interval '1 day') d
cross join seed_students s;

-- leave requests in every state ---------------------------------------------------------------------
insert into app.leave_requests (id, school_id, student_id, created_by, kind, from_at, to_at, reason, status, reviewed_by, reviewed_at, review_note) values
  (pg_temp.sid('leave:1'), pg_temp.sid('school'), pg_temp.sid('user:hs24001'), pg_temp.sid('user:hs24001'), 'go_home',
   date_trunc('week', current_date) + interval '4 days 16 hours', date_trunc('week', current_date) + interval '6 days 17 hours',
   'Về bản dự đám cưới anh họ, bố đón lúc 16:30 thứ Sáu.', 'pending', null, null, null),
  (pg_temp.sid('leave:2'), pg_temp.sid('school'), pg_temp.sid('user:hs24007'), pg_temp.sid('user:ph01'), 'go_home',
   date_trunc('week', current_date) + interval '5 days 7 hours', date_trunc('week', current_date) + interval '6 days 17 hours',
   'Nhà có việc, bố đón cháu Mai sáng thứ Bảy.', 'approved', pg_temp.sid('user:qs01'), now() - interval '1 day', null),
  (pg_temp.sid('leave:3'), pg_temp.sid('school'), pg_temp.sid('user:hs24005'), pg_temp.sid('user:hs24005'), 'sick',
   current_date - 3 + time '18:00', current_date - 3 + time '22:00', 'Đau bụng, đã báo y tế.', 'approved',
   pg_temp.sid('user:gv02'), current_date - 3 + time '17:30', 'Nghỉ ngơi, theo dõi thêm.'),
  (pg_temp.sid('leave:4'), pg_temp.sid('school'), pg_temp.sid('user:hs24012'), pg_temp.sid('user:hs24012'), 'other',
   current_date + 1 + time '14:00', current_date + 1 + time '17:00', 'Ra chợ mua vở và bút.', 'rejected',
   pg_temp.sid('user:qs01'), now() - interval '3 hours', 'Chiều mai có lịch lao động, em xin vào cuối tuần nhé.');

insert into app.meal_cancellations (school_id, student_id, date, meal, source, leave_request_id)
select pg_temp.sid('school'), pg_temp.sid('user:hs24007'), d::date, m.meal, 'leave_request', pg_temp.sid('leave:2')
from generate_series(date_trunc('week', current_date) + interval '5 days', date_trunc('week', current_date) + interval '6 days', interval '1 day') d
cross join (values ('breakfast'), ('lunch'), ('dinner')) as m (meal)
where not (d::date = date_trunc('week', current_date)::date + 5 and m.meal = 'breakfast');

-- term 1 grades: 6 subjects, oral + 15min + 45min + midterm ------------------------------------------
insert into app.grades (school_id, student_id, subject, term, school_year, kind, seq, score, recorded_by)
select pg_temp.sid('school'), s.id, sub.subject, 'HK1', '2026-2027', k.kind, 1,
  round((5 + ((s.n * 13 + sub.i * 7 + k.i * 3) % 50) / 10.0)::numeric, 1),
  c.homeroom_teacher_id
from seed_students s
join app.classes c on c.id = s.class_id
cross join (values (1, 'Toán'), (2, 'Ngữ văn'), (3, 'Tiếng Anh'), (4, 'Vật lí'), (5, 'Lịch sử'), (6, 'Sinh học')) as sub (i, subject)
cross join (values (1, 'oral'), (2, '15min'), (3, '45min'), (4, 'midterm')) as k (i, kind);

insert into app.lesson_topics (school_id, class_id, subject, week_start, title, summary, created_by) values
  (pg_temp.sid('school'), pg_temp.sid('class:10A1'), 'Toán', date_trunc('week', current_date), 'Mệnh đề và tập hợp',
   'Mệnh đề, phủ định, tập hợp con, các phép toán giao, hợp, hiệu.', pg_temp.sid('user:gv01')),
  (pg_temp.sid('school'), pg_temp.sid('class:11A2'), 'Vật lí', date_trunc('week', current_date), 'Dao động điều hòa',
   'Li độ, biên độ, chu kì, tần số; đồ thị dao động.', pg_temp.sid('user:gv02'));

-- announcements ----------------------------------------------------------------------------------------
insert into app.announcements (school_id, audience, class_id, title, body, created_by) values
  (pg_temp.sid('school'), 'parents', null, 'Họp phụ huynh học kỳ I',
   'Nhà trường mời Phụ huynh dự họp lúc 8:00 Chủ Nhật 13/12 tại hội trường.', pg_temp.sid('user:admin01')),
  (pg_temp.sid('school'), 'class', pg_temp.sid('class:10A1'), 'Kiểm tra 45 phút môn Toán',
   'Thứ Sáu tuần này, tiết 2. Các em ôn chương Mệnh đề – Tập hợp.', pg_temp.sid('user:gv01')),
  (pg_temp.sid('school'), 'all', null, 'Mặc áo ấm khi trời rét',
   'Nhiệt độ ban đêm xuống dưới 10 độ. Các em mặc đủ ấm, không tắm nước lạnh buổi tối.', pg_temp.sid('user:qs01'));

-- health ---------------------------------------------------------------------------------------------------
insert into app.health_reports (school_id, student_id, symptoms, temperature, note, status, handled_by, handled_note) values
  (pg_temp.sid('school'), pg_temp.sid('user:hs24005'), '{stomachache}', 37.2, 'Đau bụng sau bữa tối.', 'handled',
   pg_temp.sid('user:yt01'), 'Cho uống men tiêu hóa, theo dõi qua đêm.'),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24010'), '{fever,cough}', 38.1, 'Sốt từ chiều.', 'new', null, null);

insert into app.health_checks (school_id, student_id, height_cm, weight_kg, measured_at)
select pg_temp.sid('school'), s.id, 145 + (s.n * 3) % 20, 38 + (s.n * 7) % 15, date_trunc('month', current_date)::date - 60
from seed_students s;

-- scholarships, donations, culture (sample content: real students should rewrite it) -------------------
