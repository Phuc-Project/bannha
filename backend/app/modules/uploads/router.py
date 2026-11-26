"""POST /api/v1/uploads — a one-time signed URL to upload one image to private Storage.

The server decides the path (<school_id>/<uuid>.<ext>) and records who it was issued to in
app.uploads. The path deliberately carries no user id (donors stay anonymous); rows may only
reference paths issued to their writer (enforced by database triggers).
"""

from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.common.deps import AppSettings, Engine, Http, User
from app.common.schemas import ApiResponse, ok
from app.common.supabase_admin import SupabaseAdmin
from app.common.users import CurrentUser
from app.core.db import service_transaction
from app.core.errors import AppError, ForbiddenError

router = APIRouter(prefix="/api/v1", tags=["uploads"])

Bucket = Literal["avatars", "room-issues", "menus", "donations", "culture", "tutor"]
ContentType = Literal["image/webp", "image/jpeg", "image/png"]

EXTENSIONS: dict[str, str] = {"image/webp": "webp", "image/jpeg": "jpg", "image/png": "png"}

# Which active roles may upload into which bucket.
BUCKET_ROLES: dict[str, frozenset[str]] = {
    "avatars": frozenset({"admin"}),
    "room-issues": frozenset({"student", "dorm_staff"}),
    "menus": frozenset({"kitchen_staff"}),
    "donations": frozenset({"student", "teacher", "dorm_staff"}),
    "culture": frozenset({"student"}),
    "tutor": frozenset({"student"}),
}


class UploadIn(BaseModel):
    bucket: Bucket
    content_type: ContentType
    size_bytes: Annotated[int, Field(gt=0)]


class UploadOut(BaseModel):
    bucket: str
    path: str
    upload_url: str
    token: str | None


DAILY_UPLOAD_LIMIT = 40


def build_path(user: CurrentUser, content_type: str) -> str:
    return f"{user.school_id}/{uuid4()}.{EXTENSIONS[content_type]}"


def check_upload(user: CurrentUser, body: UploadIn, max_mb: int) -> None:
    if user.active_role not in BUCKET_ROLES[body.bucket]:
        raise ForbiddenError("Tài khoản của bạn không tải ảnh vào mục này được.")
    if body.size_bytes > max_mb * 1024 * 1024:
        raise AppError("FILE_TOO_LARGE", f"Ảnh quá lớn. Chỉ nhận ảnh dưới {max_mb} MB.", 413)


@router.post("/uploads")
async def create_upload(
    body: UploadIn, user: User, http: Http, settings: AppSettings, engine: Engine
) -> ApiResponse[UploadOut]:
    check_upload(user, body, settings.max_upload_mb)
    path = build_path(user, body.content_type)
    async with service_transaction(engine) as conn:
        today = await conn.execute(
            text("""select count(*) from app.uploads
                    where owner_id = :u and created_at > now() - interval '1 day'"""),
            {"u": user.id},
        )
        if today.scalar_one() >= DAILY_UPLOAD_LIMIT:
            raise AppError(
                "UPLOAD_LIMIT", "Hôm nay bạn đã tải đủ số ảnh cho phép. Mai thử lại nhé.", 429
            )
        await conn.execute(
            text("""insert into app.uploads (path, school_id, bucket, owner_id)
                    values (:p, :s, :b, :u)"""),
            {"p": path, "s": user.school_id, "b": body.bucket, "u": user.id},
        )
    signed = await SupabaseAdmin(http, settings).create_signed_upload(body.bucket, path)
    return ok(
        UploadOut(bucket=body.bucket, path=path, upload_url=signed["url"], token=signed["token"])
    )
