"""Commands available from phase B1: reading notices, editing own contact details."""

from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.sync.registry import Result, command


class MarkNotificationRead(BaseModel):
    id: UUID


class MarkAnnouncementRead(BaseModel):
    announcement_id: UUID


class UpdateContact(BaseModel):
    phone: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None


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
