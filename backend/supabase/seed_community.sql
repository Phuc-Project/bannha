-- BẢN NHÀ · sample scholarships, donations, culture posts, notifications.
-- Culture posts are placeholders marked "nội dung mẫu": real students must write their own.

create or replace function pg_temp.sid(label text) returns uuid
language sql immutable as $$ select md5('ban-nha:' || label)::uuid $$;

insert into app.scholarships (school_id, title, provider, amount_text, eligibility, for_ethnic_minority, grades, deadline, apply_link, created_by) values
  (pg_temp.sid('school'), 'Học bổng vượt khó học tốt', 'Hội Khuyến học tỉnh (mẫu)', '2.000.000 đồng/năm',
   'Học sinh dân tộc thiểu số, gia đình khó khăn, học lực khá trở lên.', true, '{10,11,12}',
   current_date + 6, null, pg_temp.sid('user:admin01')),
  (pg_temp.sid('school'), 'Học bổng tiếp sức đến trường', 'Quỹ doanh nghiệp địa phương (mẫu)', '1.500.000 đồng/kỳ',
   'Học sinh nội trú có hoàn cảnh đặc biệt, được GVCN giới thiệu.', true, '{10,11}',
   current_date + 30, null, pg_temp.sid('user:admin01')),
  (pg_temp.sid('school'), 'Học bổng học sinh giỏi cấp trường', 'Nhà trường', 'Bằng khen và 500.000 đồng',
   'Điểm trung bình học kỳ I từ 8,0 trở lên, hạnh kiểm tốt.', false, '{10,11,12}',
   current_date + 45, null, pg_temp.sid('user:admin01'));

insert into app.articles (school_id, category, title, body_md, published, created_by) values
  (pg_temp.sid('school'), 'admission_policy', 'Chế độ cử tuyển là gì?',
   E'Cử tuyển là cách Nhà nước chọn học sinh dân tộc thiểu số vào đại học, cao đẳng mà **không cần thi tuyển**, sau khi học xong về phục vụ ở địa phương.\n\n*Nội dung mẫu — nhà trường cần cập nhật theo văn bản mới nhất.*',
   true, pg_temp.sid('user:admin01'));

insert into app.donation_items (school_id, donor_id, category, title, grade, size, condition, status) values
  (pg_temp.sid('school'), pg_temp.sid('user:hs24004'), 'textbook', 'Bộ sách Toán 10 (2 tập)', 10, null, 'good', 'available'),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24009'), 'textbook', 'Sách Ngữ văn 10 tập 1', 10, null, 'used', 'available'),
  (pg_temp.sid('school'), pg_temp.sid('user:gv02'), 'winter_clothes', 'Áo khoác phao xanh', null, 'M', 'like_new', 'available'),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24013'), 'winter_clothes', 'Áo len cổ lọ', null, 'S', 'good', 'available'),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24005'), 'uniform', 'Áo đồng phục trắng', null, 'S', 'good', 'available'),
  (pg_temp.sid('school'), pg_temp.sid('user:qs01'), 'school_supplies', 'Hộp bút và thước kẻ', null, null, 'like_new', 'available');

insert into app.item_requests (school_id, requester_id, category, grade, size, note) values
  (pg_temp.sid('school'), pg_temp.sid('user:hs24011'), 'winter_clothes', null, 'M', 'Em chưa có áo ấm cho mùa đông.'),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24002'), 'textbook', 10, null, 'Em cần sách Toán 10.');

insert into app.culture_posts (school_id, author_id, ethnicity, category, title, body, status, reviewed_by) values
  (pg_temp.sid('school'), pg_temp.sid('user:hs24001'), 'Mông', 'festival', 'Tết của người Mông',
   'Nội dung mẫu, cần học sinh thật viết lại. Tết của người Mông thường diễn ra vào tháng Chạp, có ném pao và thổi khèn.',
   'published', pg_temp.sid('user:gv01')),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24004'), 'Dao', 'costume', 'Trang phục người Dao đỏ',
   'Nội dung mẫu, cần học sinh thật viết lại. Khăn đội đầu màu đỏ và áo thêu hoa văn là nét riêng của người Dao đỏ.',
   'published', pg_temp.sid('user:gv02')),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24005'), 'Tày', 'language', 'Lời chào của người Tày',
   'Nội dung mẫu, cần học sinh thật viết lại. Giới thiệu các câu chào hỏi thường ngày bằng tiếng Tày.',
   'published', pg_temp.sid('user:gv02')),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24008'), 'Thái', 'food', 'Cá nướng pa pỉnh tộp',
   'Nội dung mẫu, cần học sinh thật viết lại. Món cá gập nướng kẹp lá thơm của người Thái vùng Tây Bắc.',
   'published', pg_temp.sid('user:gv01')),
  (pg_temp.sid('school'), pg_temp.sid('user:hs24012'), 'Hà Nhì', 'craft', 'Nghề dệt vải của người Hà Nhì',
   'Nội dung mẫu, cần học sinh thật viết lại. Bài đang chờ thầy cô duyệt.', 'pending', null);

insert into app.notifications (school_id, user_id, type, title, body, link)
select pg_temp.sid('school'), pg_temp.sid('user:ph01'), 'leave_request.approved',
       'Đơn về nhà của em Lò Thị Mai đã được duyệt', 'Thầy Hà Văn Quân đã duyệt đơn về nhà cuối tuần.', '/ph/ve-nha';
