"""REST endpoints for Socratic Gemini AI tutor sessions and messages."""

from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.ai.gemini import TutorReply, ask_tutor
from app.ai.safety import DISTRESS_REPLY, detect_distress
from app.common.deps import AppSettings, Engine, Http, UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.supabase_admin import SupabaseAdmin
from app.common.users import CurrentUser
from app.core.errors import AppError, ForbiddenError
from app.core.timezone import vn_today
from app.modules.tutor.practice_router import router as practice_router
from app.modules.tutor.schemas import (
    CreateSessionIn,
    QuickAskIn,
    QuickAskOut,
    SendMessageIn,
    SessionOut,
    TutorMessageOut,
    UsageTodayOut,
)
from app.modules.tutor.service import consume_daily_quota, limit_error, persist_turn

router = APIRouter(prefix="/api/v1/tutor", tags=["tutor"])
router.include_router(practice_router)

MIN_ATTEMPTS_FOR_SOLUTION = 2


@router.post("/ask")
async def quick_ask_tutor(
    body: QuickAskIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[QuickAskOut]:
    """Lightweight single-call endpoint for the evening Socratic AI tutor."""
    if body.action == "solution" and body.attempt_count < MIN_ATTEMPTS_FOR_SOLUTION:
        raise AppError(
            "SOLUTION_LOCKED",
            "Em hãy tự thử hoặc nhận gợi ý ít nhất 2 lượt trước khi mở lời giải nhé.",
            409,
        )
    today = vn_today()
    limit = settings.ai_daily_limit_per_student
    if detect_distress(body.question):
        ai_out = TutorReply(reply=DISTRESS_REPLY, step="care", topic_tag=None, distress=True)
    else:
        turns: list[tuple[str, str]] = [(str(t.role), t.content) for t in body.history]
        ai_out = await ask_tutor(
            http,
            settings,
            subject=body.subject,
            topic_title=body.topic,
            action=body.action,
            history=turns,
            user_text=body.question,
        )
        if ai_out.distress:
            ai_out = TutorReply(reply=DISTRESS_REPLY, step="care", topic_tag=None, distress=True)
    new_count = await consume_daily_quota(engine, user.school_id, user.id, today, limit)
    return ok(
        QuickAskOut(
            reply=ai_out.reply,
            step=ai_out.step,
            distress=ai_out.distress,
            remaining_today=max(0, limit - new_count),
        )
    )


@router.get("/usage/today")
async def usage_today(
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
    settings: AppSettings,
) -> ApiResponse[UsageTodayOut]:
    today = vn_today()
    used = (
        await conn.execute(
            text("select count from app.tutor_usage where student_id = :u and date = :d"),
            {"u": user.id, "d": today},
        )
    ).scalar_one_or_none() or 0
    limit = settings.ai_daily_limit_per_student
    return ok(
        UsageTodayOut(date=today, used=int(used), limit=limit, remaining=max(0, limit - int(used)))
    )


@router.post("/sessions")
async def create_session(
    body: CreateSessionIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
) -> ApiResponse[SessionOut]:
    sid = body.id or uuid4()
    row = (
        await conn.execute(
            text("""
                insert into app.tutor_sessions (id, school_id, student_id, subject, lesson_topic_id)
                values (:id, :s, :u, :sub, :lt)
                returning id, subject, lesson_topic_id, created_at
            """),
            {
                "id": sid,
                "s": user.school_id,
                "u": user.id,
                "sub": body.subject,
                "lt": body.lesson_topic_id,
            },
        )
    ).one()
    return ok(SessionOut.model_validate(row, from_attributes=True))


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: UUID,
    body: SendMessageIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[TutorMessageOut]:
    sess = (
        await conn.execute(
            text("""
                select s.subject, lt.title as topic_title
                from app.tutor_sessions s
                left join app.lesson_topics lt on lt.id = s.lesson_topic_id
                where s.id = :id and s.student_id = :u and s.deleted_at is null
            """),
            {"id": session_id, "u": user.id},
        )
    ).one_or_none()
    if sess is None:
        raise AppError("NOT_FOUND", "Không tìm thấy phiên học này.", 404)

    if body.image_path is not None:
        owns = (
            await conn.execute(
                text("select private.owns_upload(:p, 'tutor')"), {"p": body.image_path}
            )
        ).scalar_one()
        if not owns:
            raise ForbiddenError("Ảnh đề bài không thuộc tài khoản của em.")

    history_rows = (
        await conn.execute(
            text("""
                select role, content from app.tutor_messages
                where session_id = :id and deleted_at is null
                order by created_at asc
            """),
            {"id": session_id},
        )
    ).all()
    user_attempts = sum(1 for r in history_rows if r.role == "user")
    if body.action == "solution" and user_attempts < MIN_ATTEMPTS_FOR_SOLUTION:
        raise AppError(
            "SOLUTION_LOCKED",
            "Em hãy tự thử hoặc nhận gợi ý ít nhất 2 lượt trước khi mở lời giải nhé.",
            409,
        )

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

    if detect_distress(body.text):
        ai_out = TutorReply(reply=DISTRESS_REPLY, step="care", topic_tag=None, distress=True)
    else:
        image_data = (
            await SupabaseAdmin(http, settings).download_object("tutor", body.image_path)
            if body.image_path
            else None
        )
        history = [(str(r.role), str(r.content)) for r in history_rows]
        ai_out = await ask_tutor(
            http,
            settings,
            subject=sess.subject,
            topic_title=sess.topic_title,
            action=body.action,
            history=history,
            user_text=body.text,
            image=image_data,
        )
        if ai_out.distress:
            ai_out = TutorReply(reply=DISTRESS_REPLY, step="care", topic_tag=None, distress=True)

    new_count = await consume_daily_quota(engine, user.school_id, user.id, today, limit)
    user_msg_id, asst_msg_id = await persist_turn(
        engine,
        school_id=user.school_id,
        session_id=session_id,
        student_id=user.id,
        user_text=body.text,
        image_path=body.image_path,
        action=body.action,
        ai_out=ai_out,
    )
    return ok(
        TutorMessageOut(
            user_message_id=user_msg_id,
            assistant_message_id=asst_msg_id,
            reply=ai_out.reply,
            step=ai_out.step,
            topic_tag=ai_out.topic_tag,
            distress=ai_out.distress,
            remaining_today=max(0, limit - new_count),
        )
    )
