"""Commands and weighted-average logic for grades and weekly lesson topics."""

from collections.abc import Sequence
from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.notify import notify_guardians
from app.common.users import CurrentUser
from app.core.errors import ForbiddenError
from app.modules.sync.registry import Result, command

GradeKind = Literal["oral", "15min", "45min", "midterm", "final"]
Term = Literal["HK1", "HK2"]

GRADE_WEIGHTS: dict[str, int] = {
    "oral": 1,
    "15min": 1,
    "45min": 2,
    "midterm": 2,
    "final": 3,
}


def compute_weighted_average(entries: Sequence[tuple[str, float]]) -> float | None:
    """Compute weighted subject average (`oral/15min x1`, `45min/midterm x2`, `final x3`)."""
    total_weight = 0
    weighted_sum = 0.0
    for kind, score in entries:
        weight = GRADE_WEIGHTS.get(kind, 1)
        weighted_sum += score * weight
        total_weight += weight
    if total_weight == 0:
        return None
    return round(weighted_sum / total_weight, 2)


class GradeBulkItem(BaseModel):
    id: UUID
    student_id: UUID
    kind: GradeKind
    seq: Annotated[int, Field(ge=1, le=10)] = 1
    score: Annotated[float, Field(ge=0, le=10)]


class GradesUpsertBulk(BaseModel):
    school_year: Annotated[str, Field(pattern=r"^[0-9]{4}-[0-9]{4}$")]
    term: Term
    subject: Annotated[str, Field(min_length=2, max_length=60)]
    items: Annotated[list[GradeBulkItem], Field(min_length=1, max_length=200)]


class LessonTopicUpsert(BaseModel):
    id: UUID
    class_id: UUID
    subject: Annotated[str, Field(min_length=2, max_length=60)]
    week_start: date
    title: Annotated[str, Field(min_length=2, max_length=200)]
    summary: Annotated[str | None, Field(max_length=2000)] = None


@command("grades.upsert_bulk", GradesUpsertBulk, roles=("teacher",))
async def upsert_grades_bulk(
    conn: AsyncConnection, user: CurrentUser, p: GradesUpsertBulk
) -> Result:
    unique_students = list(dict.fromkeys(item.student_id for item in p.items))
    for st_id in unique_students:
        allowed = (
            await conn.execute(text("select private.is_homeroom_of(:st)"), {"st": st_id})
        ).scalar_one()
        if not allowed:
            raise ForbiddenError("Giáo viên chỉ nhập điểm cho học sinh lớp chủ nhiệm.")

    for item in p.items:
        await conn.execute(
            text("""
                insert into app.grades
                    (id, school_id, student_id, subject, term, school_year,
                     kind, seq, score, recorded_by)
                values (:id, :s, :st, :sub, :term, :sy, :kind, :seq, :score, :u)
                on conflict (student_id, school_year, term, subject, kind, seq)
                where deleted_at is null
                do update set score = excluded.score, recorded_by = excluded.recorded_by
            """),
            {
                "id": item.id,
                "s": user.school_id,
                "st": item.student_id,
                "sub": p.subject,
                "term": p.term,
                "sy": p.school_year,
                "kind": item.kind,
                "seq": item.seq,
                "score": round(item.score, 2),
                "u": user.id,
            },
        )

    for st_id in unique_students:
        await notify_guardians(
            conn,
            st_id,
            "grades.updated",
            f"Có điểm mới môn {p.subject}",
            f"Học kỳ {p.term} năm học {p.school_year}.",
            "/ph/diem",
        )
    return {"updated": len(p.items)}


@command("lesson_topic.upsert", LessonTopicUpsert, roles=("teacher",))
async def upsert_lesson_topic(
    conn: AsyncConnection, user: CurrentUser, p: LessonTopicUpsert
) -> Result:
    if not user.has("admin"):
        allowed = (
            await conn.execute(text("select private.is_homeroom_class(:c)"), {"c": p.class_id})
        ).scalar_one()
        if not allowed:
            raise ForbiddenError("Giáo viên chỉ cập nhật chủ đề tuần cho lớp chủ nhiệm.")

    await conn.execute(
        text("""
            insert into app.lesson_topics
                (id, school_id, class_id, subject, week_start, title, summary, created_by)
            values (:id, :s, :c, :sub, :w, :title, :sum, :u)
            on conflict (id) do update
                set subject = excluded.subject,
                    week_start = excluded.week_start,
                    title = excluded.title,
                    summary = excluded.summary
        """),
        {
            "id": p.id,
            "s": user.school_id,
            "c": p.class_id,
            "sub": p.subject,
            "w": p.week_start,
            "title": p.title,
            "sum": p.summary,
            "u": user.id,
        },
    )
    return {"id": str(p.id)}
