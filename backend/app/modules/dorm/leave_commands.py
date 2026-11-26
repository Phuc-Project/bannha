"""Offline sync commands for dorm leave requests and room maintenance issues."""

from datetime import datetime, timedelta
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_guardians, notify_user
from app.common.users import CurrentUser
from app.core.errors import AppError, ForbiddenError
from app.core.timezone import meals_in_leave_range
from app.modules.sync.registry import Result, command

LeaveKind = Literal["go_home", "sick", "other"]
IssueCategory = Literal["electric", "water", "door_window", "bed", "other"]


class LeaveCreate(BaseModel):
    id: UUID
    student_id: UUID
    kind: LeaveKind
    from_at: datetime
    to_at: datetime
    reason: Annotated[str, Field(min_length=2, max_length=1000)]

    @model_validator(mode="after")
    def _valid_range(self) -> "LeaveCreate":
        if self.to_at <= self.from_at:
            raise ValueError("Thời gian kết thúc phải sau thời gian bắt đầu.")
        if self.to_at - self.from_at > timedelta(days=30):
            raise ValueError("Đơn xin phép không vượt quá 30 ngày.")
        return self


class LeaveCancel(BaseModel):
    id: UUID


class LeaveReview(BaseModel):
    id: UUID
    status: Literal["approved", "rejected"]
    review_note: Annotated[str | None, Field(max_length=500)] = None


class RoomIssueCreate(BaseModel):
    id: UUID
    room_id: UUID
    category: IssueCategory
    description: Annotated[str, Field(min_length=2, max_length=1000)]
    photo_path: str | None = None


class RoomIssueUpdateStatus(BaseModel):
    id: UUID
    status: Literal["open", "in_progress", "resolved"]


@command("leave_request.create", LeaveCreate, roles=("student", "parent"))
async def create_leave(conn: AsyncConnection, user: CurrentUser, p: LeaveCreate) -> Result:
    if user.active_role == "student":
        if p.student_id != user.id:
            raise ForbiddenError("Học sinh chỉ tạo đơn xin phép cho chính mình.")
    else:
        is_guard = (
            await conn.execute(text("select private.is_guardian_of(:st)"), {"st": p.student_id})
        ).scalar_one()
        if not is_guard:
            raise ForbiddenError("Bạn chỉ tạo đơn xin phép cho con mình.")

    await conn.execute(
        text("""
            insert into app.leave_requests
                (id, school_id, student_id, created_by, kind, from_at, to_at, reason, status)
            values (:id, :s, :st, :u, :k, :f, :t, :r, 'pending')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "st": p.student_id,
            "u": user.id,
            "k": p.kind,
            "f": p.from_at,
            "t": p.to_at,
            "r": p.reason,
        },
    )
    return {"id": str(p.id), "status": "pending"}


@command("leave_request.cancel", LeaveCancel, roles=("student", "parent"))
async def cancel_leave(conn: AsyncConnection, user: CurrentUser, p: LeaveCancel) -> Result:
    res = await conn.execute(
        text("""
            update app.leave_requests set status = 'cancelled'
            where id = :id and created_by = :u and status = 'pending' and deleted_at is null
        """),
        {"id": p.id, "u": user.id},
    )
    if res.rowcount == 0:
        raise AppError(
            "CANNOT_CANCEL", "Không thể hủy đơn này (đơn không tồn tại hoặc đã xử lý).", 409
        )
    await conn.execute(
        text("select private.set_leave_meal_cancellations(:id, '{}'::date[], '{}'::text[])"),
        {"id": p.id},
    )
    return {"id": str(p.id), "status": "cancelled"}


@command("leave_request.review", LeaveReview, roles=("dorm_staff", "teacher"))
async def review_leave(conn: AsyncConnection, user: CurrentUser, p: LeaveReview) -> Result:
    lr = (
        await conn.execute(
            text("""
                select student_id, kind, from_at, to_at, status
                from app.leave_requests
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": p.id, "s": user.school_id},
        )
    ).one_or_none()
    if lr is None:
        raise AppError("NOT_FOUND", "Không tìm thấy đơn xin phép này.", 404)
    if lr.status == "cancelled":
        raise AppError("LEAVE_CANCELLED", "Đơn xin phép này đã được người tạo hủy.", 409)
    if user.active_role == "teacher" and not user.has("dorm_staff"):
        homeroom = (
            await conn.execute(text("select private.is_homeroom_of(:st)"), {"st": lr.student_id})
        ).scalar_one()
        if not homeroom:
            raise ForbiddenError("Giáo viên chỉ duyệt đơn cho học sinh lớp chủ nhiệm.")

    await conn.execute(
        text("""
            update app.leave_requests
            set status = :st, reviewed_by = :u, reviewed_at = now(), review_note = :note
            where id = :id
        """),
        {"st": p.status, "u": user.id, "note": p.review_note, "id": p.id},
    )
    slots = (
        meals_in_leave_range(lr.from_at, lr.to_at)
        if lr.kind == "go_home" and p.status == "approved"
        else []
    )
    dates = [d for d, _ in slots]
    meals = [m for _, m in slots]
    await conn.execute(
        text(
            "select private.set_leave_meal_cancellations("
            ":id, cast(:d as date[]), cast(:m as text[]))"
        ),
        {"id": p.id, "d": dates, "m": meals},
    )
    label = "đã được duyệt" if p.status == "approved" else "chưa được duyệt"
    title = f"Đơn xin phép {label}"
    await notify_user(conn, lr.student_id, f"leave_request.{p.status}", title, p.review_note)
    await notify_guardians(conn, lr.student_id, f"leave_request.{p.status}", title, p.review_note)
    return {"id": str(p.id), "status": p.status, "meals_cancelled": len(slots)}


@command("room_issue.create", RoomIssueCreate, roles=("student", "dorm_staff"))
async def create_room_issue(conn: AsyncConnection, user: CurrentUser, p: RoomIssueCreate) -> Result:
    await conn.execute(
        text("""
            insert into app.room_issues
                (id, school_id, room_id, reported_by, category, description, photo_path, status)
            values (:id, :s, :r, :u, :c, :d, :ph, 'open')
            on conflict (id) do nothing
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "r": p.room_id,
            "u": user.id,
            "c": p.category,
            "d": p.description,
            "ph": p.photo_path,
        },
    )
    return {"id": str(p.id), "status": "open"}


@command("room_issue.update_status", RoomIssueUpdateStatus, roles=("dorm_staff",))
async def update_room_issue_status(
    conn: AsyncConnection, user: CurrentUser, p: RoomIssueUpdateStatus
) -> Result:
    res = await conn.execute(
        text("""
            update app.room_issues set status = :st
            where id = :id and school_id = :s and deleted_at is null
        """),
        {"st": p.status, "id": p.id, "s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy báo hỏng phòng này.", 404)
    return {"id": str(p.id), "status": p.status}
