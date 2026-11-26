"""Practice-set and class topic-stat endpoints for the AI tutor module."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.ai.gemini import generate_practice
from app.common.deps import AppSettings, Engine, Http, UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.core.db import service_transaction
from app.core.errors import AppError, ForbiddenError
from app.core.timezone import vn_today
from app.modules.tutor.schemas import (
    ClassTopicStatsOut,
    PracticeAnswersIn,
    PracticeCreateIn,
    PracticeGradeOut,
    PracticeQuestionPublic,
    PracticeSetOut,
    TopicStatItem,
)
from app.modules.tutor.service import (
    consume_daily_quota,
    grade_and_persist_practice,
    limit_error,
    persist_practice_set,
)

router = APIRouter()


@router.post("/practice")
async def create_practice(
    body: PracticeCreateIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[PracticeSetOut]:
    topic = (
        await conn.execute(
            text("""
                select id, subject, title, summary from app.lesson_topics
                where id = :id and school_id = :s and deleted_at is null
            """),
            {"id": body.lesson_topic_id, "s": user.school_id},
        )
    ).one_or_none()
    if topic is None:
        raise AppError("NOT_FOUND", "Không tìm thấy chủ đề bài học này.", 404)

    today = vn_today()
    limit = settings.ai_daily_limit_per_student
    used_now = (
        await conn.execute(
            text("select count from app.tutor_usage where student_id = :u and date = :d"),
            {"u": user.id, "d": today},
        )
    ).scalar_one_or_none() or 0
    if int(used_now) >= limit:
        raise limit_error(limit)

    items = await generate_practice(
        http, settings, subject=topic.subject, title=topic.title, summary=topic.summary
    )
    await consume_daily_quota(engine, user.school_id, user.id, today, limit)
    set_id = await persist_practice_set(
        engine,
        school_id=user.school_id,
        student_id=user.id,
        lesson_topic_id=body.lesson_topic_id,
        items=items,
    )
    public_q = [
        PracticeQuestionPublic(index=idx, prompt=q.prompt, choices=q.choices)
        for idx, q in enumerate(items)
    ]
    return ok(PracticeSetOut(id=set_id, lesson_topic_id=body.lesson_topic_id, questions=public_q))


@router.post("/practice/{set_id}/answers")
async def grade_practice(
    set_id: UUID,
    body: PracticeAnswersIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
    engine: Engine,
) -> ApiResponse[PracticeGradeOut]:
    pset = (
        await conn.execute(
            text("""
                select questions from app.tutor_practice_sets
                where id = :id and student_id = :u and deleted_at is null
            """),
            {"id": set_id, "u": user.id},
        )
    ).one_or_none()
    if pset is None:
        raise AppError("NOT_FOUND", "Không tìm thấy bộ câu hỏi luyện tập này.", 404)

    graded = await grade_and_persist_practice(
        engine,
        set_id=set_id,
        student_id=user.id,
        questions=list(pset.questions),
        answers=body.answers,
    )
    return ok(graded)


@router.get("/classes/{class_id}/topic-stats")
async def class_topic_stats(
    class_id: UUID,
    user: Annotated[CurrentUser, Depends(require_roles("teacher", "admin"))],
    conn: UserConn,
    engine: Engine,
) -> ApiResponse[ClassTopicStatsOut]:
    cls = (
        await conn.execute(
            text(
                "select 1 from app.classes where id = :c and school_id = :s and deleted_at is null"
            ),
            {"c": class_id, "s": user.school_id},
        )
    ).first()
    if cls is None:
        raise AppError("NOT_FOUND", "Không tìm thấy lớp học này.", 404)
    if user.active_role == "teacher" and not user.has("admin"):
        homeroom = (
            await conn.execute(text("select private.is_homeroom_class(:c)"), {"c": class_id})
        ).scalar_one()
        if not homeroom:
            raise ForbiddenError("Giáo viên chỉ xem thống kê chủ đề của lớp chủ nhiệm.")

    async with service_transaction(engine) as sconn:
        rows = (
            await sconn.execute(
                text("""
                    select tm.topic_tag, count(*)::int as question_count
                    from app.tutor_messages tm
                    join app.profiles p on p.id = tm.student_id
                    where p.school_id = :s and p.class_id = :c
                      and tm.role = 'assistant' and tm.topic_tag is not null
                      and tm.deleted_at is null
                    group by tm.topic_tag
                    order by question_count desc, tm.topic_tag asc
                    limit 20
                """),
                {"s": user.school_id, "c": class_id},
            )
        ).all()
    return ok(
        ClassTopicStatsOut(
            class_id=class_id,
            topics=[TopicStatItem.model_validate(r, from_attributes=True) for r in rows],
        )
    )
