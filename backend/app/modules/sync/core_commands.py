"""Commands available from phase B1/B3: notices, announcements, and own contact details."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.core.errors import AppError, ForbiddenError
from app.modules.sync.registry import Result, command


class MarkNotificationRead(BaseModel):
    id: UUID


class MarkAnnouncementRead(BaseModel):
    announcement_id: UUID


class UpdateContact(BaseModel):
    phone: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None


class CreateAnnouncement(BaseModel):
    id: UUID
    audience: Literal["all", "students", "parents", "class", "student"]
    class_id: UUID | None = None
    student_id: UUID | None = None
    title: Annotated[str, Field(min_length=1, max_length=200)]
    body: Annotated[str, Field(min_length=1, max_length=5000)]

    @model_validator(mode="after")
    def _validate_target(self) -> "CreateAnnouncement":
        if (self.audience == "class") != (self.class_id is not None):
            raise ValueError("Thông báo theo lớp phải chọn đúng một lớp.")
        if (self.audience == "student") != (self.student_id is not None):
            raise ValueError("Thông báo cá nhân phải chọn đúng một học sinh.")
        return self


@command("notification.mark_read", MarkNotificationRead)
async def mark_notification_read(
    conn: AsyncConnection, _user: CurrentUser, p: MarkNotificationRead
) -> Result:
    res = await conn.execute(
        text("""update app.notifications set read_at = coalesce(read_at, now())
                where id = :id and user_id = auth.uid()"""),
        {"id": p.id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy thông báo này.", 404)
    return {"id": str(p.id)}


@command("announcement.mark_read", MarkAnnouncementRead)
async def mark_announcement_read(
    conn: AsyncConnection, user: CurrentUser, p: MarkAnnouncementRead
) -> Result:
    visible = await conn.execute(
        text("select 1 from app.announcements where id = :id and deleted_at is null"),
        {"id": p.announcement_id},
    )
    if visible.first() is None:
        raise AppError("NOT_FOUND", "Không tìm thấy thông báo này.", 404)
    await conn.execute(
        text("""insert into app.announcement_reads (school_id, announcement_id, user_id)
                values (:s, :a, :u) on conflict (announcement_id, user_id) do nothing"""),
        {"s": user.school_id, "a": p.announcement_id, "u": user.id},
    )
    return {"announcement_id": str(p.announcement_id)}


@command("profile.update_contact", UpdateContact)
async def update_contact(conn: AsyncConnection, user: CurrentUser, p: UpdateContact) -> Result:
    await conn.execute(
        text("update app.profiles set phone = :phone where id = :id"),
        {"phone": p.phone, "id": user.id},
    )
    return {"phone": p.phone}


@command("announcement.create", CreateAnnouncement, roles=("teacher", "dorm_staff", "admin"))
async def create_announcement(
    conn: AsyncConnection, user: CurrentUser, p: CreateAnnouncement
) -> Result:
    if user.active_role == "teacher" and not user.has("admin", "dorm_staff"):
        if p.audience == "class":
            allowed = (
                await conn.execute(text("select private.is_homeroom_class(:c)"), {"c": p.class_id})
            ).scalar_one()
        elif p.audience == "student":
            allowed = (
                await conn.execute(text("select private.is_homeroom_of(:st)"), {"st": p.student_id})
            ).scalar_one()
        else:
            allowed = False
        if not allowed:
            raise ForbiddenError(
                "Giáo viên chỉ gửi được thông báo cho lớp chủ nhiệm hoặc học sinh lớp mình."
            )

    await conn.execute(
        text("""
            insert into app.announcements
                (id, school_id, audience, class_id, student_id, title, body, created_by)
            values (:id, :s, :aud, :c, :st, :title, :body, :u)
            on conflict (id) do update
                set title = excluded.title, body = excluded.body
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "aud": p.audience,
            "c": p.class_id,
            "st": p.student_id,
            "title": p.title,
            "body": p.body,
            "u": user.id,
        },
    )
    return {"id": str(p.id)}
