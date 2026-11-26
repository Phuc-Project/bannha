"""GET /api/v1/sync/pull and POST /api/v1/sync/push."""

from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.common.deps import User, UserConn
from app.common.schemas import ApiResponse, ok
from app.core.errors import AppError
from app.modules.sync import core_commands  # noqa: F401  (registers commands)
from app.modules.sync.cursor import CursorError
from app.modules.sync.pull import pull_table
from app.modules.sync.push import OpResult, apply_op
from app.modules.sync.tables import PULLABLE

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])

MAX_TABLES = 40
MAX_OPS = 100


class TablePage(BaseModel):
    rows: list[dict[str, Any]]
    next_cursor: str
    has_more: bool


class PullOut(BaseModel):
    server_time: datetime
    tables: dict[str, TablePage]


class PullIn(BaseModel):
    cursors: dict[str, str | None] = Field(max_length=MAX_TABLES)
    limit: Annotated[int, Field(ge=1, le=1000)] = 500


@router.post("/pull")
async def pull(body: PullIn, user: User, conn: UserConn) -> ApiResponse[PullOut]:
    """Body: {"cursors": {"menus": "<cursor or null>", ...}}. Unknown tables are refused."""
    unknown = sorted(set(body.cursors) - PULLABLE)
    if unknown:
        raise AppError(
            "UNKNOWN_TABLE",
            "Ứng dụng cần cập nhật để đồng bộ dữ liệu này.",
            400,
            {"tables": unknown},
        )
    pages: dict[str, TablePage] = {}
    for table, cursor in sorted(body.cursors.items()):
        try:
            page = await pull_table(conn, user, table, cursor, body.limit)
        except CursorError as exc:
            raise AppError(
                "BAD_CURSOR", "Dữ liệu đồng bộ trên máy bị lỗi, cần tải lại.", 400, {"table": table}
            ) from exc
        pages[table] = TablePage.model_validate(page)
    return ok(PullOut(server_time=datetime.now(UTC), tables=pages))


class OpIn(BaseModel):
    op_id: UUID
    command: Annotated[str, Field(pattern=r"^[a-z_]+\.[a-z_]+$", max_length=80)]
    payload: dict[str, Any]
    client_at: datetime | None = None


class PushIn(BaseModel):
    ops: Annotated[list[OpIn], Field(min_length=1, max_length=MAX_OPS)]


class PushOut(BaseModel):
    results: list[OpResult]


@router.post("/push")
async def push(body: PushIn, user: User, conn: UserConn) -> ApiResponse[PushOut]:
    """Commands are applied in order; each result is applied / rejected / retry."""
    results = [await apply_op(conn, user, op.op_id, op.command, op.payload) for op in body.ops]
    return ok(PushOut(results=results))


@router.get("/tables")
async def tables(_user: User) -> ApiResponse[list[str]]:
    """The tables this server version can sync (lets old app versions detect upgrades)."""
    return ok(sorted(PULLABLE))
