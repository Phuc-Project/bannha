"""Offline sync commands for health reports, growth checks, medical reminders, and SOS alerts."""

from datetime import date, datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_guardians
from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.sync.registry import Result, command

Symptom = Literal[
    "fever",
    "headache",
    "stomachache",
    "cough",
    "dizzy",
    "sore_throat",
    "vomit",
    "injury",
    "other",
]


class HealthReportCreate(BaseModel):
    id: UUID
    symptoms: Annotated[list[Symptom], Field(min_length=1, max_length=10)]
    temperature: Annotated[float | None, Field(ge=34, le=43)] = None
    note: Annotated[str | None, Field(max_length=1000)] = None


class HealthReportUpdate(BaseModel):
    id: UUID
    status: Literal["new", "seen", "handled"]
    handled_note: Annotated[str | None, Field(max_length=1000)] = None


class HealthCheckRecord(BaseModel):
    id: UUID
    student_id: UUID
    height_cm: Annotated[float | None, Field(ge=80, le=220)] = None
    weight_kg: Annotated[float | None, Field(ge=15, le=150)] = None
    measured_at: date
    note: Annotated[str | None, Field(max_length=500)] = None


class MedicalReminderCreate(BaseModel):
    id: UUID
    student_id: UUID
    title: Annotated[str, Field(min_length=2, max_length=200)]
    due_at: datetime


class MedicalReminderDone(BaseModel):
    id: UUID


class SosRaise(BaseModel):
    id: UUID
    location_note: Annotated[str | None, Field(max_length=300)] = None
    client_at: datetime | None = None


class SosAcknowledge(BaseModel):
    id: UUID


@command("health_report.create", HealthReportCreate, roles=("student",))
async def create_health_report(
    conn: AsyncConnection, user: CurrentUser, p: HealthReportCreate
) -> Result:
    await conn.execute(
        text("""
            insert into app.health_reports
                (id, school_id, student_id, symptoms, temperature, note, status)
            values (:id, :s, :u, :sym, :temp, :note, 'new')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "sym": p.symptoms,
            "temp": round(p.temperature, 1) if p.temperature is not None else None,
            "note": p.note,
        },
    )
    await notify_guardians(
        conn,
        user.id,
        "health.reported",
        f"Em {user.full_name} gửi báo sức khỏe",
        "Cán bộ y tế nhà trường đã nhận được thông tin để theo dõi.",
        "/ph/suc-khoe",
    )
    return {"id": str(p.id), "status": "new"}


@command("health_report.update", HealthReportUpdate, roles=("medical_staff",))
async def update_health_report(
    conn: AsyncConnection, user: CurrentUser, p: HealthReportUpdate
) -> Result:
    res = await conn.execute(
        text("""
            update app.health_reports
            set status = :st, handled_by = :u, handled_note = :note
            where id = :id and school_id = :s and deleted_at is null
        """),
        {"st": p.status, "u": user.id, "note": p.handled_note, "id": p.id, "s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy phiếu báo sức khỏe này.", 404)
    return {"id": str(p.id), "status": p.status}


@command("health_check.record", HealthCheckRecord, roles=("medical_staff",))
async def record_health_check(
    conn: AsyncConnection, user: CurrentUser, p: HealthCheckRecord
) -> Result:
    await conn.execute(
        text("""
            insert into app.health_checks
                (id, school_id, student_id, height_cm, weight_kg, measured_at, note)
            values (:id, :s, :st, :h, :w, :m, :note)
            on conflict (id) do update
                set height_cm = excluded.height_cm,
                    weight_kg = excluded.weight_kg,
                    measured_at = excluded.measured_at,
                    note = excluded.note
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "st": p.student_id,
            "h": round(p.height_cm, 1) if p.height_cm is not None else None,
            "w": round(p.weight_kg, 1) if p.weight_kg is not None else None,
            "m": p.measured_at,
            "note": p.note,
        },
    )
    return {"id": str(p.id), "student_id": str(p.student_id)}


@command("medical_reminder.create", MedicalReminderCreate, roles=("medical_staff",))
async def create_medical_reminder(
    conn: AsyncConnection, user: CurrentUser, p: MedicalReminderCreate
) -> Result:
    await conn.execute(
        text("""
            insert into app.medical_reminders (id, school_id, student_id, title, due_at)
            values (:id, :s, :st, :title, :due)
            on conflict (id) do update
                set title = excluded.title, due_at = excluded.due_at
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "st": p.student_id,
            "title": p.title,
            "due": p.due_at,
        },
    )
    return {"id": str(p.id)}


@command("medical_reminder.done", MedicalReminderDone, roles=("medical_staff",))
async def done_medical_reminder(
    conn: AsyncConnection, user: CurrentUser, p: MedicalReminderDone
) -> Result:
    res = await conn.execute(
        text("""
            update app.medical_reminders
            set done_at = coalesce(done_at, now())
            where id = :id and school_id = :s and deleted_at is null
        """),
        {"id": p.id, "s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy lịch nhắc y tế này.", 404)
    return {"id": str(p.id), "done": True}


@command("sos.raise", SosRaise, roles=("student",))
async def raise_sos(conn: AsyncConnection, user: CurrentUser, p: SosRaise) -> Result:
    await conn.execute(
        text("""
            insert into app.sos_alerts (id, school_id, student_id, location_note, client_at)
            values (:id, :s, :u, :loc, :cat)
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "loc": p.location_note,
            "cat": p.client_at,
        },
    )
    return {"id": str(p.id)}


@command("sos.acknowledge", SosAcknowledge, roles=("dorm_staff", "medical_staff"))
async def acknowledge_sos(conn: AsyncConnection, user: CurrentUser, p: SosAcknowledge) -> Result:
    claimed = (
        await conn.execute(
            text("""
                update app.sos_alerts
                set acknowledged_by = :u, acknowledged_at = now()
                where id = :id and school_id = :s
                  and acknowledged_by is null and deleted_at is null
                returning id
            """),
            {"u": user.id, "id": p.id, "s": user.school_id},
        )
    ).scalar_one_or_none()
    if claimed is not None:
        return {"id": str(p.id), "acknowledged_by": str(user.id)}

    existing = (
        await conn.execute(
            text("""
                select acknowledged_by from app.sos_alerts
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": p.id, "s": user.school_id},
        )
    ).one_or_none()
    if existing is None:
        raise AppError("NOT_FOUND", "Không tìm thấy tín hiệu SOS này.", 404)
    if existing.acknowledged_by == user.id:
        return {"id": str(p.id), "acknowledged_by": str(user.id)}
    raise AppError(
        "ALREADY_ACKNOWLEDGED",
        "Đã có thầy cô khác nhận hỗ trợ tín hiệu SOS này.",
        409,
        {"acknowledged_by": str(existing.acknowledged_by)},
    )
