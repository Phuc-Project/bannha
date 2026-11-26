"""POST /api/v1/auth/register — public self-registration for students and parents.

Staff accounts (teacher, dorm, medical, kitchen, admin) are never self-registered: they are
created by the school admin. A new account joins the school given by SCHOOL_CODE (or the only
school in the database) and can log in immediately with the password it chose.
"""

import re
import time
from collections import defaultdict, deque
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.common.deps import AppSettings, Engine, Http
from app.common.schemas import ApiResponse, ok
from app.common.supabase_admin import SupabaseAdmin
from app.core.db import service_transaction
from app.core.errors import AppError
from app.modules.auth.router import password_problem

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

USERNAME_RE = re.compile(r"^[a-z]{2,6}[0-9]{2,6}$")
PER_IP_LIMIT = 5  # registrations per IP per hour (per server instance)
GLOBAL_HOURLY_LIMIT = 60  # registrations per hour across the whole school
WINDOW_SECONDS = 3600

_recent_by_ip: dict[str, deque[float]] = defaultdict(deque)


class RegisterIn(BaseModel):
    username: Annotated[str, Field(min_length=4, max_length=12)]
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    password: Annotated[str, Field(max_length=128)]
    role: Literal["student", "parent"]
    ethnicity: Annotated[str | None, Field(max_length=40)] = None

    @field_validator("username", mode="before")
    @classmethod
    def _normalize_username(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("full_name", "ethnicity", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        if isinstance(value, str):
            cleaned = " ".join(value.split())
            return cleaned or None
        return value


class RegisterOut(BaseModel):
    username: str
    role: str


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_ip_limit(ip: str) -> None:
    now = time.monotonic()
    hits = _recent_by_ip[ip]
    while hits and now - hits[0] > WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= PER_IP_LIMIT:
        raise AppError("TOO_MANY_ATTEMPTS", "Đăng ký quá nhiều lần. Hãy thử lại sau 1 giờ.", 429)
    hits.append(now)


@router.post("/register")
async def register(
    body: RegisterIn,
    request: Request,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[RegisterOut]:
    if not USERNAME_RE.match(body.username):
        raise AppError(
            "BAD_USERNAME",
            "Tên đăng nhập gồm 2–6 chữ cái không dấu rồi 2–6 chữ số, ví dụ: phuc2010.",
            422,
        )
    problem = password_problem(body.password, body.username)
    if problem:
        raise AppError("WEAK_PASSWORD", problem, 422)
    _check_ip_limit(_client_ip(request))

    async with service_transaction(engine) as conn:
        school = (
            await conn.execute(
                text("""select id from app.schools
                        where deleted_at is null and (cast(:code as text) is null or code = :code)
                        order by created_at limit 1"""),
                {"code": settings.school_code},
            )
        ).first()
        if school is None:
            raise AppError("NO_SCHOOL", "Hệ thống chưa có trường để đăng ký.", 503)
        recent = await conn.execute(
            text("""select count(*) from app.audit_log
                    where action = 'auth.registered' and created_at > now() - interval '1 hour'"""),
        )
        if recent.scalar_one() >= GLOBAL_HOURLY_LIMIT:
            raise AppError("TOO_MANY_ATTEMPTS", "Hệ thống đang quá tải đăng ký, thử lại sau.", 429)
        taken = (
            await conn.execute(
                text("select 1 from app.profiles where username = :u"), {"u": body.username}
            )
        ).first()
        if taken is not None:
            raise AppError("USERNAME_TAKEN", "Tên đăng nhập này đã có người dùng.", 409)

    admin = SupabaseAdmin(http, settings)
    uid = await admin.create_user(body.username, body.password)
    try:
        await _create_profile(engine, uid, school.id, body)
    except Exception:
        await admin.delete_user(uid)
        raise
    return ok(RegisterOut(username=body.username, role=body.role))


async def _create_profile(
    engine: AsyncEngine, uid: UUID, school_id: UUID, body: RegisterIn
) -> None:
    async with service_transaction(engine) as conn:
        await conn.execute(
            text("""insert into app.profiles
                        (id, school_id, username, full_name, roles, ethnicity,
                         must_change_password, active)
                    values (:id, :s, :u, :fn, :roles, :eth, false, true)"""),
            {
                "id": uid,
                "s": school_id,
                "u": body.username,
                "fn": body.full_name,
                "roles": [body.role],
                "eth": body.ethnicity,
            },
        )
        await conn.execute(
            text("""insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                    values (:s, :id, 'auth.registered', 'profile', :id)"""),
            {"s": school_id, "id": uid},
        )
