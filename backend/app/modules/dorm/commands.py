"""Offline sync commands for dormitory attendance sessions and QR/manual check-ins."""

from datetime import date, datetime, time
from typing import Annotated, Literal
from uuid import UUID, uuid4

from pydantic import AliasChoices, BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_guardians
from app.common.users import CurrentUser
from app.core.errors import AppError
from app.core.timezone import VN_TZ, vn_now
from app.modules.dorm import leave_commands as _leave_commands  # noqa: F401
from app.modules.dorm.qr import verify_student_qr
from app.modules.sync.registry import Result, command

SessionKind = Literal["morning", "evening_study", "night_check"]
AttendanceStatus = Literal["present", "late", "absent", "excused"]

_SESSION_CHECK_TIME: dict[str, time] = {
    "morning": time(6, 30),
    "evening_study": time(19, 30),
    "night_check": time(21, 45),
}


class OpenSession(BaseModel):
    id: UUID
    kind: SessionKind
    date: date
    building: Annotated[str | None, Field(max_length=40)] = None


class RecordQr(BaseModel):
    id: UUID
    session_id: UUID
    qr_token: Annotated[
        str, Field(min_length=10, max_length=300, validation_alias=AliasChoices("qr_token", "qr"))
    ]
    recorded_at: datetime | None = None


class RecordManual(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    status: AttendanceStatus


class CloseSession(BaseModel):
    session_id: UUID


async def _ensure_open_session(conn: AsyncConnection, school_id: UUID, session_id: UUID) -> None:
    row = (
        await conn.execute(
            text("""
                select closed_at from app.attendance_sessions
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": session_id, "s": school_id},
        )
    ).one_or_none()
    if row is None:
        raise AppError("NOT_FOUND", "Không tìm thấy phiên điểm danh này.", 404)
    if row.closed_at is not None:
        raise AppError("SESSION_CLOSED", "Phiên điểm danh đã đóng.", 409)


async def _ensure_school_student(conn: AsyncConnection, school_id: UUID, student_id: UUID) -> None:
    ok_student = (
        await conn.execute(
            text("""
                select 1 from app.profiles
                where id = :st and school_id = :s and 'student' = any(roles)
                  and active and deleted_at is null
            """),
            {"st": student_id, "s": school_id},
        )
    ).first()
    if ok_student is None:
        raise AppError("STUDENT_NOT_FOUND", "Học sinh không thuộc trường mình.", 404)


@command("attendance.open_session", OpenSession, roles=("dorm_staff",))
async def open_session(conn: AsyncConnection, user: CurrentUser, p: OpenSession) -> Result:
    await conn.execute(
        text("""
            insert into app.attendance_sessions (id, school_id, kind, date, building, created_by)
            values (:id, :s, :k, :d, :b, :u)
            on conflict (id) do nothing
        """),
        {"id": p.id, "s": user.school_id, "k": p.kind, "d": p.date, "b": p.building, "u": user.id},
    )
    return {"id": str(p.id)}


@command("attendance.record_qr", RecordQr, roles=("dorm_staff",))
async def record_qr(conn: AsyncConnection, user: CurrentUser, p: RecordQr) -> Result:
    await _ensure_open_session(conn, user.school_id, p.session_id)
    key_rows = (
        await conn.execute(
            text("""
                select version, public_key from app.qr_signing_keys
                where school_id = :s and revoked_at is null and deleted_at is null
            """),
            {"s": user.school_id},
        )
    ).all()
    keys = {int(r.version): str(r.public_key) for r in key_rows}
    student_id, _version = verify_student_qr(p.qr_token, keys)
    await _ensure_school_student(conn, user.school_id, student_id)
    ts = p.recorded_at or vn_now()
    await conn.execute(
        text("""
            insert into app.attendance_records
                (id, school_id, session_id, student_id, status, method, recorded_at, recorded_by)
            values (:id, :s, :sess, :st, 'present', 'qr', :ts, :u)
            on conflict (session_id, student_id) do update
                set status = 'present', method = 'qr', recorded_at = excluded.recorded_at,
                    recorded_by = excluded.recorded_by, deleted_at = null
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "sess": p.session_id,
            "st": student_id,
            "ts": ts,
            "u": user.id,
        },
    )
    return {"id": str(p.id), "student_id": str(student_id), "status": "present"}


@command("attendance.record_manual", RecordManual, roles=("dorm_staff",))
async def record_manual(conn: AsyncConnection, user: CurrentUser, p: RecordManual) -> Result:
    await _ensure_open_session(conn, user.school_id, p.session_id)
    await _ensure_school_student(conn, user.school_id, p.student_id)
    await conn.execute(
        text("""
            insert into app.attendance_records
                (id, school_id, session_id, student_id, status, method, recorded_by)
            values (:id, :s, :sess, :st, :status, 'manual', :u)
            on conflict (session_id, student_id) do update
                set status = excluded.status, method = 'manual',
                    recorded_by = excluded.recorded_by, deleted_at = null
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "sess": p.session_id,
            "st": p.student_id,
            "status": p.status,
            "u": user.id,
        },
    )
    return {"id": str(p.id), "student_id": str(p.student_id), "status": p.status}


@command("attendance.close_session", CloseSession, roles=("dorm_staff",))
async def close_session(conn: AsyncConnection, user: CurrentUser, p: CloseSession) -> Result:
    sess = (
        await conn.execute(
            text("""
                update app.attendance_sessions
                set closed_at = coalesce(closed_at, now())
                where id = :id and school_id = :s and deleted_at is null
                returning kind, date, building
            """),
            {"id": p.session_id, "s": user.school_id},
        )
    ).one_or_none()
    if sess is None:
        raise AppError("NOT_FOUND", "Không tìm thấy phiên điểm danh này.", 404)

    check_at = datetime.combine(sess.date, _SESSION_CHECK_TIME[sess.kind], tzinfo=VN_TZ)
    missing = (
        await conn.execute(
            text("""
                select p.id, p.full_name,
                       exists (
                         select 1 from app.leave_requests lr
                         where lr.student_id = p.id and lr.status = 'approved'
                           and lr.deleted_at is null
                           and lr.from_at <= :check_at and lr.to_at >= :check_at
                       ) as has_leave
                from app.profiles p
                join app.dorm_rooms r on r.id = p.room_id
                where p.school_id = :s and 'student' = any(p.roles)
                  and p.active and p.deleted_at is null and r.deleted_at is null
                  and (:b is null or r.building = :b)
                  and not exists (
                    select 1 from app.attendance_records ar
                    where ar.session_id = :sess and ar.student_id = p.id and ar.deleted_at is null
                  )
            """),
            {"s": user.school_id, "b": sess.building, "sess": p.session_id, "check_at": check_at},
        )
    ).all()

    absent = 0
    excused = 0
    for row in missing:
        st_status = "excused" if row.has_leave else "absent"
        await conn.execute(
            text("""
                insert into app.attendance_records
                    (id, school_id, session_id, student_id, status, method, recorded_by)
                values (:id, :s, :sess, :st, :status, 'auto', :u)
                on conflict (session_id, student_id) do nothing
            """),
            {
                "id": uuid4(),
                "s": user.school_id,
                "sess": p.session_id,
                "st": row.id,
                "status": st_status,
                "u": user.id,
            },
        )
        if st_status == "excused":
            excused += 1
        else:
            absent += 1
            await notify_guardians(
                conn,
                row.id,
                "attendance.absent",
                f"Em {row.full_name} vắng điểm danh",
                f"Phiên điểm danh ngày {sess.date.strftime('%d/%m/%Y')} chưa ghi nhận em có mặt.",
                "/ph/hom-nay",
            )
    return {"session_id": str(p.session_id), "absent": absent, "excused": excused}
