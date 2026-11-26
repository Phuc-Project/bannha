"""In-app notification helpers for parents, students, and staff."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.core.db import service_transaction

_NOTIFY_FN = text("select private.create_notification(:u, :t, :title, :body, :link)")
_GUARDIANS = text(
    "select parent_id from app.guardian_links where student_id = :sid and deleted_at is null"
)


async def notify_user(
    conn: AsyncConnection,
    user_id: UUID,
    n_type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    """Insert one notification using the SECURITY DEFINER helper (safe inside user savepoints)."""
    await conn.execute(
        _NOTIFY_FN,
        {"u": user_id, "t": n_type, "title": title, "body": body, "link": link},
    )


async def notify_users(
    conn: AsyncConnection,
    user_ids: Iterable[UUID],
    n_type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> int:
    """Notify each unique user ID; returns count of notifications created."""
    seen: set[UUID] = set()
    for uid in user_ids:
        if uid not in seen:
            seen.add(uid)
            await notify_user(conn, uid, n_type, title, body, link)
    return len(seen)


async def notify_guardians(
    conn: AsyncConnection,
    student_id: UUID,
    n_type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> int:
    """Notify all linked parents/guardians of `student_id`."""
    rows = (await conn.execute(_GUARDIANS, {"sid": student_id})).scalars().all()
    return await notify_users(conn, rows, n_type, title, body, link)


async def service_notify_user(
    engine: AsyncEngine,
    school_id: UUID,
    user_id: UUID,
    n_type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    """Insert a notification directly inside a standalone service_role transaction."""
    async with service_transaction(engine) as conn:
        await conn.execute(
            text("""
                insert into app.notifications (school_id, user_id, type, title, body, link)
                values (:s, :u, :t, :title, :body, :link)
            """),
            {
                "s": school_id,
                "u": user_id,
                "t": n_type,
                "title": title,
                "body": body,
                "link": link,
            },
        )
