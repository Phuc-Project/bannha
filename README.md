# BẢN NHÀ — Ứng dụng hỗ trợ học sinh dân tộc nội trú

> *"Xa bản, vẫn có nhà. Một ứng dụng – mọi việc của đời sống nội trú."*

Dự án được tổ chức tối giản, sạch gọn gồm **Frontend thuần HTML5 + CSS3 + JavaScript** (không dùng React, không dùng Rust, không cần cài đặt `node_modules`) và **Backend FastAPI + Supabase**.

## Cấu trúc thư mục

```text
ban-nha/
├── frontend/
│   ├── index.html                  ← Nhấp đúp mở trực tiếp hoặc chạy bằng Live Server
│   ├── styles/                     ← tokens.css, layout.css, components.css, motion.css
│   ├── js/
│   │   ├── config.js               ← Nơi điền khóa Firebase / Supabase & API Gia sư AI
│   │   ├── app.js                  ← Bộ điều phối & hiệu ứng View Transitions
│   │   ├── core/                   ← utils.js, domain.js, seed.js, store.js (0 trùng dữ liệu)
│   │   ├── services/
│   │   │   ├── auth-adapter.js     ← Viết sẵn Supabase Auth + Firebase Auth + Demo Offline
│   │   │   └── ai-tutor-api.js     ← Tích hợp sẵn 1 API Gia sư AI nhỏ gọn
│   │   └── views/                  ← Giao diện 8 chức năng, Quản trị trường & /dev/ui
│   ├── fonts/                      ← Font tiếng Việt Be Vietnam Pro (.woff2)
│   └── sw.js                       ← Service Worker hỗ trợ chạy khi mất mạng
└── backend/
    ├── app/                        ← FastAPI (Auth kép Supabase/Firebase, Sync, /api/v1/tutor/ask)
    ├── supabase/                   ← SQL Migrations & chính sách phân quyền RLS
    ├── scripts/                    ← Sinh khóa QR Ed25519 & dữ liệu mẫu
    └── pyproject.toml              ← Cấu hình Python quản lý bằng uv
```

## Cách chạy ngay

1. **Chạy Frontend & Dùng thử ngay (Không cần đăng nhập):**
   - Nhấp đúp trực tiếp tệp `frontend/index.html` trên trình duyệt (hoặc chuột phải chọn **Open with Live Server**).
   - Trang giới thiệu cho phép bấm **Dùng thử ngay — không cần tài khoản** hoặc chọn trực tiếp 1 trong 7 vai trò (Học sinh, Phụ huynh, Giáo viên, Quản sinh, Y tế, Nhà bếp, Quản trị) để trải nghiệm đầy đủ 8 chức năng ngay lập tức. Thanh **Bản dùng thử** phía trên hỗ trợ chuyển nhanh giữa các vai trò và tự xóa sạch dữ liệu tạm khi thoát.
   - Hoặc bấm **Đăng nhập** với tài khoản mẫu có sẵn (mật khẩu mặc định: `MatKhau2026`).
2. **Ghép nối Đăng nhập (Firebase / Supabase) cho đồng đội:**
   - Mở `frontend/js/config.js` → đổi `auth.provider` sang `'supabase'` hoặc `'firebase'` và điền khóa. Toàn bộ hàm xử lý đã viết sẵn tại `frontend/js/services/auth-adapter.js`.
3. **Ghép nối API Gia sư AI:**
   - Mở `frontend/js/config.js` → điền `api.baseUrl` (gọi `POST /api/v1/tutor/ask`) hoặc đặt `aiTutor.mode = 'direct'` và điền URL/API Key nhỏ vào `aiTutor.endpoint`.
4. **Chạy Backend FastAPI (`backend/`):**
   ```bash
   cd backend
   uv sync
   uv run uvicorn --factory app.main:app_factory --reload --port 8010
   ```
