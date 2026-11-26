"""Idempotent scholarship (7d / 1d) and medical reminders recorded in app.reminder_log.

Can be invoked via `POST /api/v1/jobs/reminders` (authenticated with `X-Jobs-Secret`)
or from a platform cron job (`uv run python -m app.jobs.reminders`).
"""

import asyncio
import secrets
from datetime import date, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Header
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.common.deps import AppSettings, Engine
from app.common.schemas import ApiResponse, ok
from app.core.config import get_settings
from app.core.db import create_engine, service_transaction
from app.core.errors import AppError, AuthError
from app.core.timezone import vn_today

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


class ReminderRunOut(BaseModel):
    date: date
    scholarship_sent: int
    medical_sent: int


async def _send_once(
    conn: AsyncConnection,
    *,
    school_id: UUID,
    kind: str,
    ref_id: UUID,
    user_id: UUID,
    sent_on: date,
    title: str,
    body: str | None,
    link: str,
) -> bool:
    logged = (
        await conn.execute(
            text("""
                insert into app.reminder_log (school_id, kind, ref_id, user_id, sent_on)
                values (:s, :k, :ref, :u, :d)
                on conflict (kind, ref_id, user_id, sent_on) do nothing
                returning id
            """),
            {"s": school_id, "k": kind, "ref": ref_id, "u": user_id, "d": sent_on},
        )
    ).scalar_one_or_none()
    if logged is None:
        return False
    await conn.execute(
        text("""
            insert into app.notifications (school_id, user_id, type, title, body, link)
            values (:s, :u, :t, :title, :body, :link)
        """),
        {
            "s": school_id,
            "u": user_id,
            "t": kind,
            "title": title,
            "body": body,
            "link": link,
        },
    )
    return True


async def run_reminders(engine: AsyncEngine, today: date | None = None) -> ReminderRunOut:
    """Send 7-day & 1-day bookmarked scholarship reminders and due medical reminders."""
    ref_date = today or vn_today()
    d7 = ref_date + timedelta(days=7)
    d1 = ref_date + timedelta(days=1)

    sch_sent = 0
    med_sent = 0
    async with service_transaction(engine) as conn:
        sch_rows = (
            await conn.execute(
                text("""
                    select sb.school_id, sb.student_id, s.id as scholarship_id,
                           s.title, s.deadline
                    from app.scholarship_bookmarks sb
                    join app.scholarships s on s.id = sb.scholarship_id
                    join app.profiles p on p.id = sb.student_id
                    where sb.deleted_at is null and s.deleted_at is null
                      and p.active and p.deleted_at is null
                      and s.deadline in (:d7, :d1)
                """),
                {"d7": d7, "d1": d1},
            )
        ).all()
        for row in sch_rows:
            days_left = (row.deadline - ref_date).days
            kind = f"scholarship.{days_left}d"
            sent = await _send_once(
                conn,
                school_id=row.school_id,
                kind=kind,
                ref_id=row.scholarship_id,
                user_id=row.student_id,
                sent_on=ref_date,
                title=f"Học bổng '{row.title}' còn {days_left} ngày hết hạn",
                body=f"Hạn nộp hồ sơ: {row.deadline.strftime('%d/%m/%Y')}.",
                link="/hs/hoc-bong",
            )
            if sent:
                sch_sent += 1

        med_rows = (
            await conn.execute(
                text("""
                    select mr.id as reminder_id, mr.school_id, mr.student_id, mr.title
                    from app.medical_reminders mr
                    join app.profiles p on p.id = mr.student_id
                    where mr.done_at is null and mr.deleted_at is null
                      and p.active and p.deleted_at is null
                      and (mr.due_at at time zone 'Asia/Ho_Chi_Minh')::date <= :today
                """),
                {"today": ref_date},
            )
        ).all()
        for row in med_rows:
            sent_student = await _send_once(
                conn,
                school_id=row.school_id,
                kind="medical.due",
                ref_id=row.reminder_id,
                user_id=row.student_id,
                sent_on=ref_date,
                title=f"Nhắc lịch y tế: {row.title}",
                body="Em ghé phòng y tế nhà trường theo lịch hẹn nhé.",
                link="/hs/suc-khoe",
            )
            if sent_student:
                med_sent += 1

            parents = (
                (
                    await conn.execute(
                        text("""
                        select parent_id from app.guardian_links
                        where student_id = :st and deleted_at is null
                    """),
                        {"st": row.student_id},
                    )
                )
                .scalars()
                .all()
            )
            for pid in parents:
                sent_parent = await _send_once(
                    conn,
                    school_id=row.school_id,
                    kind="medical.due",
                    ref_id=row.reminder_id,
                    user_id=pid,
                    sent_on=ref_date,
                    title=f"Lịch y tế của con: {row.title}",
                    body="Cán bộ y tế nhà trường sẽ theo dõi theo lịch hẹn.",
                    link="/ph/suc-khoe",
                )
                if sent_parent:
                    med_sent += 1

    return ReminderRunOut(date=ref_date, scholarship_sent=sch_sent, medical_sent=med_sent)


@router.post("/reminders")
async def trigger_reminders(
    engine: Engine,
    settings: AppSettings,
    x_jobs_secret: Annotated[str | None, Header()] = None,
) -> ApiResponse[ReminderRunOut]:
    if settings.jobs_secret is None:
        raise AppError("JOBS_NOT_CONFIGURED", "Chưa cấu hình khóa chạy tác vụ định kỳ.", 503)
    expected = settings.jobs_secret.get_secret_value()
    if not x_jobs_secret or not secrets.compare_digest(x_jobs_secret, expected):
        raise AuthError("INVALID_JOBS_SECRET", "Khóa tác vụ định kỳ không hợp lệ.")
    return ok(await run_reminders(engine))


async def _cli_main() -> int:
    cfg = get_settings()
    engine = create_engine(cfg)
    try:
        await run_reminders(engine)
    finally:
        await engine.dispose()
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(asyncio.run(_cli_main()))
