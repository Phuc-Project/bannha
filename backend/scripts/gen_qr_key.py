"""Generate an Ed25519 keypair for signing student QR cards.

Usage:
    uv run python -m scripts.gen_qr_key
"""

from app.modules.dorm.qr import generate_ed25519_keypair


def main() -> int:
    priv, pub = generate_ed25519_keypair()
    print("# Đặt dòng dưới vào backend/.env (KHÔNG commit lên git):")
    print(f"QR_SIGNING_PRIVATE_KEY={priv}")
    print("QR_KEY_VERSION=1")
    print()
    print("# Khóa công khai tương ứng (lưu vào bảng app.qr_signing_keys):")
    print(f"QR_PUBLIC_KEY={pub}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
