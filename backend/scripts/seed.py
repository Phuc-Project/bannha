"""Set the shared dev password on every seeded account (local development only).

Usage (after `npx supabase db reset`):
    SEED_PASSWORD=... uv run python -m scripts.seed

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from backend/.env. Refuses to run against
anything but a local stack so it can never touch the real school's accounts.
"""

import os
import sys
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings

LOCAL_HOSTS = {"127.0.0.1", "localhost"}
MIN_PASSWORD_LENGTH = 8


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252
    settings = get_settings()
    password = os.environ.get("SEED_PASSWORD", "")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.stderr.write("Đặt SEED_PASSWORD (ít nhất 8 ký tự) trước khi chạy.\n")
        return 1
    if urlparse(settings.supabase_base).hostname not in LOCAL_HOSTS:
        sys.stderr.write("Chỉ chạy seed với Supabase local.\n")
        return 1

    key = settings.supabase_service_role_key.get_secret_value()
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    domain = "@" + settings.account_email_domain
    with httpx.Client(
        base_url=f"{settings.supabase_base}/auth/v1", headers=headers, timeout=20
    ) as http:
        res = http.get("/admin/users", params={"per_page": 1000})
        res.raise_for_status()
        users = [u for u in res.json()["users"] if str(u.get("email", "")).endswith(domain)]
        for user in users:
            http.put(f"/admin/users/{user['id']}", json={"password": password}).raise_for_status()
    sys.stdout.write(f"Đã đặt mật khẩu cho {len(users)} tài khoản mẫu.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
