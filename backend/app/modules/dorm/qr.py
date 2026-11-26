"""Ed25519 signing and verification for offline student QR cards.

Token format: `BN1.<student_id>.<version>.<base64url_sig>`
Signed payload: `BN1.<student_id>.<version>` (ASCII bytes).
"""

import base64
import binascii
from collections.abc import Mapping
from uuid import UUID

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
)

from app.core.errors import AppError

PREFIX = "BN1"


def _b64u_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64u_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def generate_ed25519_keypair() -> tuple[str, str]:
    """Generate `(private_key_b64url, public_key_b64url)` raw 32-byte Ed25519 keys."""
    priv = Ed25519PrivateKey.generate()
    priv_raw = priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
    pub_raw = priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    return _b64u_encode(priv_raw), _b64u_encode(pub_raw)


def public_key_from_private(private_key_b64url: str) -> str:
    """Derive the base64url raw 32-byte public key from a private key."""
    priv = _load_private_key(private_key_b64url)
    pub_raw = priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    return _b64u_encode(pub_raw)


def _load_private_key(private_key_b64url: str) -> Ed25519PrivateKey:
    try:
        raw = _b64u_decode(private_key_b64url.strip())
        if len(raw) != 32:
            raise ValueError("Ed25519 raw private key must be 32 bytes")
        return Ed25519PrivateKey.from_private_bytes(raw)
    except (binascii.Error, ValueError) as exc:
        raise AppError("QR_KEY_INVALID", "Khóa ký thẻ QR trên máy chủ không hợp lệ.", 500) from exc


def sign_student_qr(student_id: UUID, version: int, private_key_b64url: str) -> str:
    """Sign a student QR token (`BN1.<student_id>.<version>.<sig>`)."""
    if version < 1:
        raise AppError("QR_KEY_INVALID", "Phiên bản khóa QR phải lớn hơn hoặc bằng 1.", 500)
    priv = _load_private_key(private_key_b64url)
    payload = f"{PREFIX}.{student_id}.{version}"
    sig = priv.sign(payload.encode("ascii"))
    return f"{payload}.{_b64u_encode(sig)}"


def verify_student_qr(token: str, public_keys_by_version: Mapping[int, str]) -> tuple[UUID, int]:
    """Verify a QR token against active school public keys; returns `(student_id, version)`."""
    parts = token.strip().split(".")
    if len(parts) != 4 or parts[0] != PREFIX or not parts[3]:
        raise AppError("INVALID_QR", "Mã thẻ QR không đúng định dạng.")
    try:
        student_id = UUID(parts[1])
        version = int(parts[2])
    except ValueError as exc:
        raise AppError("INVALID_QR", "Mã thẻ QR không đúng định dạng.") from exc
    if version < 1:
        raise AppError("INVALID_QR", "Mã thẻ QR không đúng định dạng.")

    pub_b64 = public_keys_by_version.get(version)
    if pub_b64 is None:
        raise AppError("INVALID_QR", "Thẻ QR dùng phiên bản khóa cũ hoặc không thuộc trường mình.")
    try:
        pub_raw = _b64u_decode(pub_b64.strip())
        sig_raw = _b64u_decode(parts[3])
        if len(pub_raw) != 32 or len(sig_raw) != 64:
            raise ValueError("unexpected key or signature length")
        pub = Ed25519PublicKey.from_public_bytes(pub_raw)
        payload = f"{PREFIX}.{student_id}.{version}".encode("ascii")
        pub.verify(sig_raw, payload)
    except (binascii.Error, ValueError, InvalidSignature) as exc:
        raise AppError("INVALID_QR", "Chữ ký trên thẻ QR không hợp lệ.") from exc

    return student_id, version
