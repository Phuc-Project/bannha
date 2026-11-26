"""Service helpers for AI tutor daily quota and message/practice persistence."""

import json
from datetime import date
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.ai.gemini import PracticeItem, TutorReply
from app.core.db import service_transaction
from app.core.errors import AppError
from app.modules.tutor.schemas import GradedQuestionOut, PracticeGradeOut


def limit_error(limit: int) -> AppError:
    return AppError(
        "AI_DAILY_LIMIT_REACHED",
        f"Hôm nay em đã hỏi đủ {limit} câu. Mai hỏi tiếp nhé.",
        429,
    )


async def consume_daily_quota(
    engine: AsyncEngine, school_id: UUID, student_id: UUID, today: date, limit: int
) -> int:
    async with service_transaction(engine) as sconn:
        new_count = (
            await sconn.execute(
                text("""
                    insert into app.tutor_usage (school_id, student_id, date, count)
                    values (:s, :u, :d, 1)
                    on conflict (student_id, date)
                    do update set count = app.tutor_usage.count + 1
                    where app.tutor_usage.count < :lim
                    returning count
                """),
                {"s": school_id, "u": student_id, "d": today, "lim": limit},
            )
        ).scalar_one_or_none()
    if new_count is None:
        raise limit_error(limit)
    return int(new_count)


async def persist_turn(
    engine: AsyncEngine,
    *,
    school_id: UUID,
    session_id: UUID,
    student_id: UUID,
    user_text: str | None,
    image_path: str | None,
    action: str,
    ai_out: TutorReply,
) -> tuple[UUID, UUID]:
    user_msg_id = uuid4()
    asst_msg_id = uuid4()
    async with service_transaction(engine) as sconn:
        await sconn.execute(
            text("""
                insert into app.tutor_messages
                    (id, school_id, session_id, student_id, role, content, image_path, action)
                values (:id, :s, :sess, :u, 'user', :c, :img, :act)
            """),
            {
                "id": user_msg_id,
                "s": school_id,
                "sess": session_id,
                "u": student_id,
                "c": user_text or "[Ảnh đề bài]",
                "img": image_path,
                "act": action,
            },
        )
        await sconn.execute(
            text("""
                insert into app.tutor_messages
                    (id, school_id, session_id, student_id, role, content, topic_tag)
                values (:id, :s, :sess, :u, 'assistant', :c, :tag)
            """),
            {
                "id": asst_msg_id,
                "s": school_id,
                "sess": session_id,
                "u": student_id,
                "c": ai_out.reply,
                "tag": ai_out.topic_tag,
            },
        )
    return user_msg_id, asst_msg_id


async def persist_practice_set(
    engine: AsyncEngine,
    *,
    school_id: UUID,
    student_id: UUID,
    lesson_topic_id: UUID,
    items: list[PracticeItem],
) -> UUID:
    set_id = uuid4()
    stored = [q.model_dump() for q in items]
    async with service_transaction(engine) as sconn:
        await sconn.execute(
            text("""
                insert into app.tutor_practice_sets
                    (id, school_id, student_id, lesson_topic_id, questions)
                values (:id, :s, :u, :lt, cast(:q as jsonb))
            """),
            {
                "id": set_id,
                "s": school_id,
                "u": student_id,
                "lt": lesson_topic_id,
                "q": json.dumps(stored, ensure_ascii=False),
            },
        )
    return set_id


async def grade_and_persist_practice(
    engine: AsyncEngine,
    *,
    set_id: UUID,
    student_id: UUID,
    questions: list[dict[str, Any]],
    answers: list[int],
) -> PracticeGradeOut:
    if len(answers) != len(questions):
        raise AppError("INVALID_ANSWERS", "Số câu trả lời chưa khớp với bộ đề.", 422)

    graded: list[GradedQuestionOut] = []
    score = 0
    for idx, (q, ans) in enumerate(zip(questions, answers, strict=True)):
        correct_idx = int(q["answer_index"])
        is_ok = ans == correct_idx
        if is_ok:
            score += 1
        graded.append(
            GradedQuestionOut(
                index=idx,
                selected=ans,
                correct_index=correct_idx,
                is_correct=is_ok,
                explanation=str(q["explanation"]),
            )
        )

    async with service_transaction(engine) as sconn:
        await sconn.execute(
            text("""
                update app.tutor_practice_sets
                set answers = cast(:a as jsonb), score = :sc, graded_at = now()
                where id = :id and student_id = :u
            """),
            {"a": json.dumps(answers), "sc": score, "id": set_id, "u": student_id},
        )
    return PracticeGradeOut(id=set_id, score=score, total=len(questions), items=graded)
