"""Apply a batch of offline commands, idempotently.

Each command runs in its own savepoint together with its `sync_ops` record, so a failing
command never affects the others and a retried command (same op_id) is never applied twice.
"""

import json
import logging
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ValidationError
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.sync.registry import get_command

logger = logging.getLogger(__name__)

Status = Literal["applied", "rejected", "retry"]


class OpResult(BaseModel):
    op_id: UUID
    status: Status
    result: dict[str, Any] | None = None
    error: dict[str, Any] | None = None


def _rejected(op_id: UUID, code: str, message: str) -> OpResult:
    return OpResult(op_id=op_id, status="rejected", error={"code": code, "message": message})


async def _previous(conn: AsyncConnection, op_id: UUID, name: str) -> OpResult | None:
    row = (
        await conn.execute(
            text(
                "select command, status, result from app.sync_ops"
                " where op_id = :id and user_id = auth.uid()"
            ),
            {"id": op_id},
        )
    ).one_or_none()
    if row is None:
        return None
    if row.command != name:
        return _rejected(op_id, "OP_ID_REUSED", "Mã thao tác bị trùng. Ứng dụng cần đồng bộ lại.")
    stored: dict[str, Any] = row.result
    if row.status == "applied":
        return OpResult(op_id=op_id, status="applied", result=stored)
    return OpResult(op_id=op_id, status="rejected", error=stored)


async def _record(
    conn: AsyncConnection, user: CurrentUser, op_id: UUID, name: str, res: OpResult
) -> None:
    payload = res.result if res.status == "applied" else res.error
    await conn.execute(
        text("""insert into app.sync_ops (op_id, school_id, user_id, command, status, result)
                values (:op, :s, :u, :c, :st, cast(:r as jsonb))
                on conflict (user_id, op_id) do nothing"""),
        {
            "op": op_id,
            "s": user.school_id,
            "u": user.id,
            "c": name,
            "st": res.status,
            "r": json.dumps(payload or {}, default=str),
        },
    )


async def apply_op(
    conn: AsyncConnection, user: CurrentUser, op_id: UUID, name: str, payload: dict[str, Any]
) -> OpResult:
    earlier = await _previous(conn, op_id, name)
    if earlier is not None:
        return earlier

    cmd = get_command(name)
    if cmd is None:
        return _rejected(op_id, "UNKNOWN_COMMAND", "Ứng dụng cần cập nhật để gửi thao tác này.")
    if cmd.roles and user.active_role not in cmd.roles:
        # Not recorded: the same op may succeed after the user switches to the right role.
        return _rejected(op_id, "WRONG_ROLE", "Hãy chuyển sang đúng vai trò rồi gửi lại.")
    try:
        data = cmd.payload.model_validate(payload)
    except ValidationError:
        res = _rejected(op_id, "VALIDATION_ERROR", "Dữ liệu của thao tác này chưa đúng.")
        await _record(conn, user, op_id, name, res)
        return res

    savepoint = await conn.begin_nested()
    try:
        result = await cmd.handler(conn, user, data)
        applied = OpResult(op_id=op_id, status="applied", result=result)
        await _record(conn, user, op_id, name, applied)
        await savepoint.commit()
        return applied
    except AppError as exc:
        await savepoint.rollback()
        res = _rejected(op_id, exc.code, exc.message)
    except IntegrityError:
        await savepoint.rollback()
        res = _rejected(op_id, "CONFLICT", "Dữ liệu này đã thay đổi hoặc bị trùng.")
    except DBAPIError as exc:
        await savepoint.rollback()
        if getattr(exc.orig, "sqlstate", None) == "42501":  # RLS / privilege refusal
            res = _rejected(op_id, "FORBIDDEN", "Tài khoản của bạn không có quyền làm việc này.")
        else:
            logger.exception("Command %s failed", name)
            return OpResult(op_id=op_id, status="retry", error={"code": "TEMPORARY"})
    await _record(conn, user, op_id, name, res)
    return res
