"""REST endpoints for dormitory QR keys, student QR card, and attendance session summary."""

from datetime import date, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import AppSettings, User, UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.core.errors import AppError, ForbiddenError
from app.modules.dorm.qr import sign_student_qr

router = APIRouter(prefix="/api/v1/dorm", tags=["dorm"])


class QrPublicKeyOut(BaseModel):
    version: int
    public_key: str
    created_at: datetime


class StudentQrOut(BaseModel):
    student_id: UUID
    version: int
    qr_token: str


class AttendanceRecordItem(BaseModel):
    student_id: UUID
    full_name: str
    status: str
    method: str
    recorded_at: datetime


class SessionSummaryOut(BaseModel):
    session_id: UUID
    kind: str
    date: date
    building: str | None
    closed_at: datetime | None
    counts: dict[str, int]
    records: list[AttendanceRecordItem]


@router.get("/qr-public-keys")
async def qr_public_keys(
    user: Annotated[CurrentUser, Depends(require_roles("dorm_staff", "admin"))],
    conn: UserConn,
) -> ApiResponse[list[QrPublicKeyOut]]:
    rows = (
        await conn.execute(
            text("""
                select version, public_key, created_at
                from app.qr_signing_keys
                where school_id = :s and revoked_at is null and deleted_at is null
                order by version desc
            """),
            {"s": user.school_id},
        )
    ).all()
    return ok([QrPublicKeyOut.model_validate(r, from_attributes=True) for r in rows])


@router.get("/students/{student_id}/qr")
async def student_qr(
    student_id: UUID,
    user: User,
    conn: UserConn,
    settings: AppSettings,
) -> ApiResponse[StudentQrOut]:
    allowed = user.active_role in ("admin", "dorm_staff") or (
        user.active_role == "student" and user.id == student_id
    )
    if not allowed:
        raise ForbiddenError("Bạn không có quyền xem mã thẻ QR của học sinh này.")
    if settings.qr_signing_private_key is None:
        raise AppError("QR_KEY_NOT_CONFIGURED", "Trường chưa cấu hình khóa ký thẻ QR.", 503)

    exists = (
        await conn.execute(
            text("""
                select 1 from app.profiles
                where id = :id and school_id = :s and 'student' = any(roles) and deleted_at is null
            """),
            {"id": student_id, "s": user.school_id},
        )
    ).first()
    if exists is None:
        raise AppError("NOT_FOUND", "Không tìm thấy học sinh này.", 404)

    token = sign_student_qr(
        student_id,
        settings.qr_key_version,
        settings.qr_signing_private_key.get_secret_value(),
    )
    return ok(StudentQrOut(student_id=student_id, version=settings.qr_key_version, qr_token=token))


@router.get("/sessions/{session_id}/summary")
async def session_summary(
    session_id: UUID,
    user: Annotated[CurrentUser, Depends(require_roles("dorm_staff", "teacher", "admin"))],
    conn: UserConn,
) -> ApiResponse[SessionSummaryOut]:
    sess = (
        await conn.execute(
            text("""
                select id, kind, date, building, closed_at
                from app.attendance_sessions
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": session_id, "s": user.school_id},
        )
    ).one_or_none()
    if sess is None:
        raise AppError("NOT_FOUND", "Không tìm thấy phiên điểm danh này.", 404)

    rows = (
        await conn.execute(
            text("""
                select ar.student_id, d.full_name, ar.status, ar.method, ar.recorded_at
                from app.attendance_records ar
                join app.directory d on d.id = ar.student_id
                where ar.session_id = :id and ar.deleted_at is null
                order by d.full_name
            """),
            {"id": session_id},
        )
    ).all()
    counts = {"present": 0, "late": 0, "absent": 0, "excused": 0}
    records: list[AttendanceRecordItem] = []
    for row in rows:
        counts[row.status] = counts.get(row.status, 0) + 1
        records.append(AttendanceRecordItem.model_validate(row, from_attributes=True))

    return ok(
        SessionSummaryOut(
            session_id=sess.id,
            kind=sess.kind,
            date=sess.date,
            building=sess.building,
            closed_at=sess.closed_at,
            counts=counts,
            records=records,
        )
    )
