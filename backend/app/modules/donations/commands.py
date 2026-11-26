"""Offline sync commands for donations, private student item requests, and staff matches."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_user
from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.sync.registry import Result, command

DonationCategory = Literal["textbook", "uniform", "winter_clothes", "school_supplies", "other"]
ClothingSize = Literal["XS", "S", "M", "L", "XL", "XXL"]
ItemCondition = Literal["like_new", "good", "used"]


class DonationCreate(BaseModel):
    id: UUID
    category: DonationCategory
    title: Annotated[str, Field(min_length=2, max_length=120)]
    grade: Annotated[int | None, Field(ge=6, le=12)] = None
    size: ClothingSize | None = None
    condition: ItemCondition
    photo_path: str | None = None


class ItemRequestCreate(BaseModel):
    id: UUID
    category: DonationCategory
    item_id: UUID | None = None
    grade: Annotated[int | None, Field(ge=6, le=12)] = None
    size: ClothingSize | None = None
    note: Annotated[str | None, Field(max_length=500)] = None


class ItemRequestCancel(BaseModel):
    id: UUID


class MatchPropose(BaseModel):
    id: UUID
    item_id: UUID
    request_id: UUID


class MatchHandOver(BaseModel):
    id: UUID


@command("donation.create", DonationCreate, roles=("student", "teacher", "dorm_staff", "admin"))
async def create_donation(conn: AsyncConnection, user: CurrentUser, p: DonationCreate) -> Result:
    await conn.execute(
        text("""
            insert into app.donation_items
                (id, school_id, donor_id, category, title, grade, size,
                 condition, photo_path, status)
            values (:id, :s, :u, :cat, :title, :gr, :sz, :cond, :ph, 'available')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "cat": p.category,
            "title": p.title,
            "gr": p.grade,
            "sz": p.size,
            "cond": p.condition,
            "ph": p.photo_path,
        },
    )
    return {"id": str(p.id), "status": "available"}


@command("item_request.create", ItemRequestCreate, roles=("student",))
async def create_item_request(
    conn: AsyncConnection, user: CurrentUser, p: ItemRequestCreate
) -> Result:
    await conn.execute(
        text("""
            insert into app.item_requests
                (id, school_id, requester_id, category, item_id, grade, size, note, status)
            values (:id, :s, :u, :cat, :item, :gr, :sz, :note, 'open')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "cat": p.category,
            "item": p.item_id,
            "gr": p.grade,
            "sz": p.size,
            "note": p.note,
        },
    )
    return {"id": str(p.id), "status": "open"}


@command("item_request.cancel", ItemRequestCancel, roles=("student",))
async def cancel_item_request(
    conn: AsyncConnection, user: CurrentUser, p: ItemRequestCancel
) -> Result:
    res = await conn.execute(
        text("""
            update app.item_requests set status = 'cancelled'
            where id = :id and requester_id = :u and status = 'open' and deleted_at is null
        """),
        {"id": p.id, "u": user.id},
    )
    if res.rowcount == 0:
        raise AppError(
            "CANNOT_CANCEL", "Không thể hủy nhu cầu này (không tồn tại hoặc đã được ghép).", 409
        )
    return {"id": str(p.id), "status": "cancelled"}


@command("match.propose", MatchPropose, roles=("dorm_staff",))
async def propose_match(conn: AsyncConnection, user: CurrentUser, p: MatchPropose) -> Result:
    item_ok = (
        await conn.execute(
            text("""
                update app.donation_items set status = 'reserved'
                where id = :id and school_id = :s and status = 'available' and deleted_at is null
                returning id
            """),
            {"id": p.item_id, "s": user.school_id},
        )
    ).scalar_one_or_none()
    if item_ok is None:
        raise AppError("ITEM_UNAVAILABLE", "Món đồ này không còn sẵn để ghép.", 409)

    req_ok = (
        await conn.execute(
            text("""
                update app.item_requests set status = 'matched'
                where id = :id and school_id = :s and status = 'open' and deleted_at is null
                returning id
            """),
            {"id": p.request_id, "s": user.school_id},
        )
    ).scalar_one_or_none()
    if req_ok is None:
        raise AppError("REQUEST_UNAVAILABLE", "Nhu cầu này không còn ở trạng thái chờ ghép.", 409)

    await conn.execute(
        text("""
            insert into app.item_matches (id, school_id, item_id, request_id, matched_by, status)
            values (:id, :s, :item, :req, :u, 'proposed')
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "item": p.item_id,
            "req": p.request_id,
            "u": user.id,
        },
    )
    return {"id": str(p.id), "status": "proposed"}


@command("match.hand_over", MatchHandOver, roles=("dorm_staff",))
async def hand_over_match(conn: AsyncConnection, user: CurrentUser, p: MatchHandOver) -> Result:
    match_row = (
        await conn.execute(
            text("""
                update app.item_matches
                set status = 'handed_over', handed_over_at = now()
                where id = :id and school_id = :s and status = 'proposed' and deleted_at is null
                returning item_id, request_id
            """),
            {"id": p.id, "s": user.school_id},
        )
    ).one_or_none()
    if match_row is None:
        raise AppError("NOT_FOUND", "Không tìm thấy cặp ghép đang chờ trao.", 404)

    title = (
        await conn.execute(
            text("update app.donation_items set status = 'given' where id = :id returning title"),
            {"id": match_row.item_id},
        )
    ).scalar_one()
    requester_id = (
        await conn.execute(
            text("""
                update app.item_requests set status = 'fulfilled'
                where id = :id returning requester_id
            """),
            {"id": match_row.request_id},
        )
    ).scalar_one()
    await notify_user(
        conn,
        requester_id,
        "donation.handed_over",
        f"Món đồ '{title}' đã sẵn sàng trao cho em",
        "Em ghé phòng quản sinh nhận nhé.",
        "/hs/do-cu",
    )
    return {"id": str(p.id), "status": "handed_over"}
