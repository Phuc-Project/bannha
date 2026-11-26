"""Offline sync commands for bookmarking and unbookmarking scholarships."""

from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.modules.sync.registry import Result, command


class ScholarshipBookmark(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    scholarship_id: UUID


class ScholarshipUnbookmark(BaseModel):
    scholarship_id: UUID


@command("scholarship.bookmark", ScholarshipBookmark, roles=("student",))
async def bookmark_scholarship(
    conn: AsyncConnection, user: CurrentUser, p: ScholarshipBookmark
) -> Result:
    await conn.execute(
        text("""
            insert into app.scholarship_bookmarks (id, school_id, student_id, scholarship_id)
            values (:id, :s, :u, :sch)
            on conflict (student_id, scholarship_id) do update set deleted_at = null
        """),
        {"id": p.id, "s": user.school_id, "u": user.id, "sch": p.scholarship_id},
    )
    return {"scholarship_id": str(p.scholarship_id), "bookmarked": True}


@command("scholarship.unbookmark", ScholarshipUnbookmark, roles=("student",))
async def unbookmark_scholarship(
    conn: AsyncConnection, user: CurrentUser, p: ScholarshipUnbookmark
) -> Result:
    await conn.execute(
        text("""
            update app.scholarship_bookmarks set deleted_at = now()
            where student_id = :u and scholarship_id = :sch and deleted_at is null
        """),
        {"u": user.id, "sch": p.scholarship_id},
    )
    return {"scholarship_id": str(p.scholarship_id), "bookmarked": False}
