"""REST endpoints for kitchen meal headcount summaries."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.core.timezone import vn_today

router = APIRouter(prefix="/api/v1/kitchen", tags=["kitchen"])


class MealCountRow(BaseModel):
    meal: str
    total_students: int
    cancelled: int
    to_cook: int


class MealCountsOut(BaseModel):
    date: date
    meals: list[MealCountRow]


@router.get("/meal-counts")
async def meal_counts(
    user: Annotated[CurrentUser, Depends(require_roles("kitchen_staff", "dorm_staff", "admin"))],
    conn: UserConn,
    target_date: Annotated[date | None, Query(alias="date")] = None,
) -> ApiResponse[MealCountsOut]:
    day = target_date or vn_today()
    rows = (
        await conn.execute(
            text("""
                select meal, total_students, cancelled, to_cook
                from app.meal_counts
                where school_id = :s and date = :d
                order by case meal when 'breakfast' then 1 when 'lunch' then 2 else 3 end
            """),
            {"s": user.school_id, "d": day},
        )
    ).all()
    return ok(
        MealCountsOut(
            date=day,
            meals=[MealCountRow.model_validate(r, from_attributes=True) for r in rows],
        )
    )
