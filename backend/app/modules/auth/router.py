"""POST /api/v1/auth/change-password — required on first login, allowed any time.

The backend changes the password itself (Supabase admin API) and clears
`must_change_password` in the same request, so the flag can never be cleared without a
real password change.
"""

import re
from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import text

from app.common.deps import AppSettings, Engine, Http, UserAnyState
from app.common.schemas import ApiResponse, ok
from app.common.supabase_admin import SupabaseAdmin
from app.core.db import service_transaction
from app.core.errors import AppError

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

MIN_LENGTH = 8
_HAS_LETTER = re.compile(r"[A-Za-zÀ-ỹ]")
_HAS_DIGIT = re.compile(r"\d")


class ChangePasswordIn(BaseModel):
    current_password: Annotated[str, Field(min_length=1, max_length=128)]
    new_password: Annotated[str, Field(max_length=128)]

    @model_validator(mode="after")
    def _differs(self) -> "ChangePasswordIn":
        if self.new_password == self.current_password:
            raise ValueError("Mật khẩu mới phải khác mật khẩu cũ.")
        return self


class ChangePasswordOut(BaseModel):
    changed: bool


def password_problem(password: str, username: str) -> str | None:
    """Vietnamese explanation of why a password is too weak, or None if acceptable."""
    if len(password) < MIN_LENGTH:
        return f"Mật khẩu cần ít nhất {MIN_LENGTH} ký tự."
    if not (_HAS_LETTER.search(password) and _HAS_DIGIT.search(password)):
        return "Mật khẩu cần có cả chữ và số."
    if username.lower() in password.lower():
        return "Mật khẩu không được chứa mã đăng nhập."
    return None


@router.post("/change-password")
async def change_password(
    body: ChangePasswordIn,
    user: UserAnyState,
    http: Http,
    engine: Engine,
    settings: AppSettings,
) -> ApiResponse[ChangePasswordOut]:
    problem = password_problem(body.new_password, user.username)
    if problem:
        raise AppError("WEAK_PASSWORD", problem, 422)

    admin = SupabaseAdmin(http, settings)
    if not await admin.password_is_correct(user.username, body.current_password):
        raise AppError("WRONG_PASSWORD", "Mật khẩu hiện tại chưa đúng.", 400)

    await admin.set_password(user.id, body.new_password)
    async with service_transaction(engine) as conn:
        await conn.execute(
            text("update app.profiles set must_change_password = false where id = :id"),
            {"id": user.id},
        )
        await conn.execute(
            text("""insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                    values (:s, :id, 'password.changed', 'profile', :id)"""),
            {"s": user.school_id, "id": user.id},
        )
    return ok(ChangePasswordOut(changed=True))
