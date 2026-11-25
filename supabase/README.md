# Phân vùng Backend Supabase (`supabase/`)

Thư mục này chứa toàn bộ cấu hình cơ sở dữ liệu và logic phía máy chủ của **BẢN NHÀ** (triển khai từ **Giai đoạn 1**):

- `migrations/`: Schema Postgres, các hàm `private.*` (`SECURITY DEFINER`), chính sách RLS trên mọi bảng, triggers và views (`meal_counts`).
- `functions/`: Supabase Edge Functions (`admin-create-users`, `ai-tutor`, `attendance-verify`).
- `tests/`: Bộ kiểm thử RLS tự động (bao gồm kiểm chứng chặn truy cập trái quyền).
- `seed.sql`: Dữ liệu mẫu thực tế của trường PTDTNT.
