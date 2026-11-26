"""Offline sync commands for student cultural posts, teacher reviews, and likes."""

from typing import Annotated, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_user
from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.sync.registry import Result, command

CultureCategory = Literal["costume", "festival", "food", "custom", "language", "craft"]


class CulturePostCreate(BaseModel):
    id: UUID
    ethnicity: Annotated[str, Field(min_length=2, max_length=40)]
    category: CultureCategory
    title: Annotated[str, Field(min_length=2, max_length=200)]
    body: Annotated[str, Field(min_length=10, max_length=10000)]
    photo_paths: Annotated[list[str], Field(max_length=4)] = Field(default_factory=list)


class CulturePostReview(BaseModel):
    id: UUID
    status: Literal["published", "rejected"]
    review_note: Annotated[str | None, Field(max_length=500)] = None


class CulturePostLike(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    post_id: UUID


class CulturePostUnlike(BaseModel):
    post_id: UUID


@command("culture_post.create", CulturePostCreate, roles=("student",))
async def create_culture_post(
    conn: AsyncConnection, user: CurrentUser, p: CulturePostCreate
) -> Result:
    await conn.execute(
        text("""
            insert into app.culture_posts
                (id, school_id, author_id, ethnicity, category, title, body, photo_paths, status)
            values (:id, :s, :u, :eth, :cat, :t, :b, :ph, 'pending')
            on conflict (id) do update
                set ethnicity = excluded.ethnicity,
                    category = excluded.category,
                    title = excluded.title,
                    body = excluded.body,
                    photo_paths = excluded.photo_paths,
                    status = 'pending',
                    reviewed_by = null,
                    review_note = null
                where app.culture_posts.status <> 'published'
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "eth": p.ethnicity,
            "cat": p.category,
            "t": p.title,
            "b": p.body,
            "ph": p.photo_paths,
        },
    )
    return {"id": str(p.id), "status": "pending"}


@command("culture_post.review", CulturePostReview, roles=("teacher", "admin"))
async def review_culture_post(
    conn: AsyncConnection, user: CurrentUser, p: CulturePostReview
) -> Result:
    row = (
        await conn.execute(
            text("""
                update app.culture_posts
                set status = :st, reviewed_by = :u, review_note = :note
                where id = :id and school_id = :s and deleted_at is null
                returning author_id, title
            """),
            {"st": p.status, "u": user.id, "note": p.review_note, "id": p.id, "s": user.school_id},
        )
    ).one_or_none()
    if row is None:
        raise AppError("NOT_FOUND", "Không tìm thấy bài viết văn hóa này.", 404)

    title_msg = (
        f"Bài '{row.title}' đã được đăng lên Kho văn hóa"
        if p.status == "published"
        else f"Bài '{row.title}' cần chỉnh sửa thêm"
    )
    await notify_user(conn, row.author_id, f"culture_post.{p.status}", title_msg, p.review_note)
    return {"id": str(p.id), "status": p.status}


@command("culture_post.like", CulturePostLike)
async def like_culture_post(conn: AsyncConnection, user: CurrentUser, p: CulturePostLike) -> Result:
    exists = (
        await conn.execute(
            text("""
                select 1 from app.culture_posts
                where id = :id and school_id = :s and status = 'published' and deleted_at is null
            """),
            {"id": p.post_id, "s": user.school_id},
        )
    ).first()
    if exists is None:
        raise AppError("NOT_FOUND", "Không tìm thấy bài viết này.", 404)

    await conn.execute(
        text("""
            insert into app.culture_likes (id, school_id, post_id, user_id)
            values (:id, :s, :p, :u)
            on conflict (post_id, user_id) do update set deleted_at = null
        """),
        {"id": p.id, "s": user.school_id, "p": p.post_id, "u": user.id},
    )
    return {"post_id": str(p.post_id), "liked": True}


@command("culture_post.unlike", CulturePostUnlike)
async def unlike_culture_post(
    conn: AsyncConnection, user: CurrentUser, p: CulturePostUnlike
) -> Result:
    await conn.execute(
        text("""
            update app.culture_likes set deleted_at = now()
            where post_id = :p and user_id = :u and deleted_at is null
        """),
        {"p": p.post_id, "u": user.id},
    )
    return {"post_id": str(p.post_id), "liked": False}
