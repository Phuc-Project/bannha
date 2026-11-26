"""Offline sync commands for menus, meal cancellations, and hometown dish suggestions."""

from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.core.errors import AppError, ForbiddenError
from app.core.timezone import is_before_meal_cutoff
from app.modules.sync.registry import Result, command

Meal = Literal["breakfast", "lunch", "dinner"]


class MenuUpsert(BaseModel):
    id: UUID
    date: date
    meal: Meal
    dishes: Annotated[list[str], Field(max_length=12)]
    note: Annotated[str | None, Field(max_length=500)] = None
    photo_path: str | None = None


class MealCancel(BaseModel):
    id: UUID
    student_id: UUID
    date: date
    meal: Meal


class MealUncancel(BaseModel):
    student_id: UUID
    date: date
    meal: Meal


class DishSuggest(BaseModel):
    id: UUID
    name: Annotated[str, Field(min_length=2, max_length=120)]
    ethnicity: Annotated[str | None, Field(max_length=40)] = None
    description: Annotated[str | None, Field(max_length=1000)] = None


class DishVote(BaseModel):
    id: UUID
    suggestion_id: UUID


class DishUnvote(BaseModel):
    suggestion_id: UUID


class DishSetStatus(BaseModel):
    id: UUID
    status: Literal["new", "planned", "served"]


async def _check_student_and_cutoff(
    conn: AsyncConnection, user: CurrentUser, student_id: UUID, meal_date: date
) -> None:
    if user.active_role == "student":
        if student_id != user.id:
            raise ForbiddenError("Học sinh chỉ báo suất ăn cho chính mình.")
    else:
        is_guard = (
            await conn.execute(text("select private.is_guardian_of(:st)"), {"st": student_id})
        ).scalar_one()
        if not is_guard:
            raise ForbiddenError("Phụ huynh chỉ báo suất ăn cho con mình.")

    cutoff_hour = int(
        (
            await conn.execute(
                text("select meal_cancel_cutoff_hour from app.schools where id = :s"),
                {"s": user.school_id},
            )
        ).scalar_one()
    )
    if not is_before_meal_cutoff(meal_date, cutoff_hour):
        raise AppError(
            "MEAL_CUTOFF_PASSED",
            f"Đã quá {cutoff_hour:02d}:00 ngày hôm trước, không đổi suất ăn ngày "
            f"{meal_date.strftime('%d/%m')} được nữa.",
            409,
        )


@command("menu.upsert", MenuUpsert, roles=("kitchen_staff", "admin"))
async def upsert_menu(conn: AsyncConnection, user: CurrentUser, p: MenuUpsert) -> Result:
    row_id = (
        await conn.execute(
            text("""
                insert into app.menus (id, school_id, date, meal, dishes, note, photo_path)
                values (:id, :s, :d, :m, :dishes, :note, :ph)
                on conflict (school_id, date, meal) where deleted_at is null
                do update set dishes = excluded.dishes,
                              note = excluded.note,
                              photo_path = coalesce(excluded.photo_path, app.menus.photo_path)
                returning id
            """),
            {
                "id": p.id,
                "s": user.school_id,
                "d": p.date,
                "m": p.meal,
                "dishes": p.dishes,
                "note": p.note,
                "ph": p.photo_path,
            },
        )
    ).scalar_one()
    return {"id": str(row_id), "date": str(p.date), "meal": p.meal}


@command("meal.cancel", MealCancel, roles=("student", "parent"))
async def cancel_meal(conn: AsyncConnection, user: CurrentUser, p: MealCancel) -> Result:
    await _check_student_and_cutoff(conn, user, p.student_id, p.date)
    await conn.execute(
        text("""
            insert into app.meal_cancellations (id, school_id, student_id, date, meal, source)
            values (:id, :s, :st, :d, :m, 'manual')
            on conflict (student_id, date, meal) where deleted_at is null do nothing
        """),
        {"id": p.id, "s": user.school_id, "st": p.student_id, "d": p.date, "m": p.meal},
    )
    return {
        "student_id": str(p.student_id),
        "date": str(p.date),
        "meal": p.meal,
        "cancelled": True,
    }


@command("meal.uncancel", MealUncancel, roles=("student", "parent"))
async def uncancel_meal(conn: AsyncConnection, user: CurrentUser, p: MealUncancel) -> Result:
    await _check_student_and_cutoff(conn, user, p.student_id, p.date)
    await conn.execute(
        text("""
            update app.meal_cancellations set deleted_at = now()
            where student_id = :st and date = :d and meal = :m
              and source = 'manual' and deleted_at is null
        """),
        {"st": p.student_id, "d": p.date, "m": p.meal},
    )
    return {
        "student_id": str(p.student_id),
        "date": str(p.date),
        "meal": p.meal,
        "cancelled": False,
    }


@command("dish.suggest", DishSuggest, roles=("student",))
async def suggest_dish(conn: AsyncConnection, user: CurrentUser, p: DishSuggest) -> Result:
    await conn.execute(
        text("""
            insert into app.dish_suggestions
                (id, school_id, student_id, name, ethnicity, description, status)
            values (:id, :s, :u, :name, :eth, :desc, 'new')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "u": user.id,
            "name": p.name,
            "eth": p.ethnicity,
            "desc": p.description,
        },
    )
    return {"id": str(p.id), "status": "new"}


@command("dish.vote", DishVote, roles=("student",))
async def vote_dish(conn: AsyncConnection, user: CurrentUser, p: DishVote) -> Result:
    await conn.execute(
        text("""
            insert into app.dish_votes (id, school_id, suggestion_id, student_id)
            values (:id, :s, :sug, :u)
            on conflict (suggestion_id, student_id) do update set deleted_at = null
        """),
        {"id": p.id, "s": user.school_id, "sug": p.suggestion_id, "u": user.id},
    )
    return {"suggestion_id": str(p.suggestion_id), "voted": True}


@command("dish.unvote", DishUnvote, roles=("student",))
async def unvote_dish(conn: AsyncConnection, user: CurrentUser, p: DishUnvote) -> Result:
    await conn.execute(
        text("""
            update app.dish_votes set deleted_at = now()
            where suggestion_id = :sug and student_id = :u and deleted_at is null
        """),
        {"sug": p.suggestion_id, "u": user.id},
    )
    return {"suggestion_id": str(p.suggestion_id), "voted": False}


@command("dish.set_status", DishSetStatus, roles=("kitchen_staff", "admin"))
async def set_dish_status(conn: AsyncConnection, user: CurrentUser, p: DishSetStatus) -> Result:
    res = await conn.execute(
        text("""
            update app.dish_suggestions set status = :st
            where id = :id and school_id = :s and deleted_at is null
        """),
        {"st": p.status, "id": p.id, "s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy món đề xuất này.", 404)
    return {"id": str(p.id), "status": p.status}
