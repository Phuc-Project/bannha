"""REST endpoints for student grade summaries and announcement read receipts."""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import User, UserConn
from app.common.schemas import ApiResponse, ok
from app.core.errors import AppError, ForbiddenError
from app.modules.contact_book.commands import compute_weighted_average

router = APIRouter(prefix="/api/v1", tags=["contact-book"])


class GradeEntryOut(BaseModel):
    id: UUID
    kind: str
    seq: int
    score: float
    updated_at: datetime


class SubjectGradesOut(BaseModel):
    school_year: str
    term: str
    subject: str
    average: float | None
    grades: list[GradeEntryOut]


class StudentGradesOut(BaseModel):
    student_id: UUID
    subjects: list[SubjectGradesOut]


class AnnouncementReaderOut(BaseModel):
    user_id: UUID
    full_name: str
    read_at: datetime


class AnnouncementReadsOut(BaseModel):
    announcement_id: UUID
    read_count: int
    readers: list[AnnouncementReaderOut]


@router.get("/contact-book/students/{student_id}/grades")
async def student_grades(
    student_id: UUID,
    user: User,
    conn: UserConn,
    term: Annotated[Literal["HK1", "HK2"] | None, Query()] = None,
    school_year: Annotated[str | None, Query(pattern=r"^[0-9]{4}-[0-9]{4}$")] = None,
) -> ApiResponse[StudentGradesOut]:
    can_view = user.active_role == "admin" or bool(
        (
            await conn.execute(text("select private.in_student_circle(:st)"), {"st": student_id})
        ).scalar_one()
    )
    if not can_view:
        raise ForbiddenError("Bạn không có quyền xem bảng điểm của học sinh này.")

    rows = (
        await conn.execute(
            text("""
                select id, school_year, term, subject, kind, seq,
                       score::float8 as score, updated_at
                from app.grades
                where student_id = :st and school_id = :s and deleted_at is null
                  and (:term is null or term = :term)
                  and (:sy is null or school_year = :sy)
                order by school_year desc, term, subject, kind, seq
            """),
            {"st": student_id, "s": user.school_id, "term": term, "sy": school_year},
        )
    ).all()

    grouped: dict[tuple[str, str, str], list[GradeEntryOut]] = {}
    for row in rows:
        key = (row.school_year, row.term, row.subject)
        grouped.setdefault(key, []).append(GradeEntryOut.model_validate(row, from_attributes=True))

    subjects = [
        SubjectGradesOut(
            school_year=sy,
            term=tm,
            subject=subj,
            average=compute_weighted_average([(g.kind, g.score) for g in items]),
            grades=items,
        )
        for (sy, tm, subj), items in grouped.items()
    ]
    return ok(StudentGradesOut(student_id=student_id, subjects=subjects))


@router.get("/announcements/{announcement_id}/reads")
async def announcement_reads(
    announcement_id: UUID,
    user: User,
    conn: UserConn,
) -> ApiResponse[AnnouncementReadsOut]:
    ann = (
        await conn.execute(
            text("""
                select created_by from app.announcements
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": announcement_id, "s": user.school_id},
        )
    ).one_or_none()
    if ann is None:
        raise AppError("NOT_FOUND", "Không tìm thấy thông báo này.", 404)
    if ann.created_by != user.id:
        raise ForbiddenError("Chỉ người gửi mới xem được danh sách đã đọc thông báo này.")

    rows = (
        await conn.execute(
            text("""
                select ar.user_id, d.full_name, ar.read_at
                from app.announcement_reads ar
                join app.directory d on d.id = ar.user_id
                where ar.announcement_id = :id and ar.deleted_at is null
                order by ar.read_at desc
            """),
            {"id": announcement_id},
        )
    ).all()
    readers = [AnnouncementReaderOut.model_validate(r, from_attributes=True) for r in rows]
    return ok(
        AnnouncementReadsOut(
            announcement_id=announcement_id,
            read_count=len(readers),
            readers=readers,
        )
    )
