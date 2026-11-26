"""REST endpoint returning ranked 1-to-1 donation match suggestions for dorm staff."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.modules.donations.matching import (
    MatchableItem,
    MatchableRequest,
    suggest_matches,
)

router = APIRouter(prefix="/api/v1/donations", tags=["donations"])


class MatchSuggestionOut(BaseModel):
    item_id: UUID
    item_title: str
    condition: str
    request_id: UUID
    requester_id: UUID
    requester_name: str
    score: int


@router.get("/match-suggestions")
async def match_suggestions(
    user: Annotated[CurrentUser, Depends(require_roles("dorm_staff"))],
    conn: UserConn,
) -> ApiResponse[list[MatchSuggestionOut]]:
    item_rows = (
        await conn.execute(
            text("""
                select id, category, title, grade, size, condition
                from app.donation_items
                where school_id = :s and status = 'available' and deleted_at is null
            """),
            {"s": user.school_id},
        )
    ).all()
    req_rows = (
        await conn.execute(
            text("""
                select r.id, r.requester_id, r.category, r.item_id, r.grade, r.size,
                       r.created_at, d.full_name as requester_name
                from app.item_requests r
                join app.directory d on d.id = r.requester_id
                where r.school_id = :s and r.status = 'open' and r.deleted_at is null
            """),
            {"s": user.school_id},
        )
    ).all()

    items = [
        MatchableItem(
            id=r.id,
            category=r.category,
            title=r.title,
            grade=r.grade,
            size=r.size,
            condition=r.condition,
        )
        for r in item_rows
    ]
    requests = [
        MatchableRequest(
            id=r.id,
            requester_id=r.requester_id,
            category=r.category,
            item_id=r.item_id,
            grade=r.grade,
            size=r.size,
            created_at=r.created_at,
            requester_name=r.requester_name,
        )
        for r in req_rows
    ]
    suggestions = suggest_matches(items, requests)
    return ok([MatchSuggestionOut.model_validate(s, from_attributes=True) for s in suggestions])
