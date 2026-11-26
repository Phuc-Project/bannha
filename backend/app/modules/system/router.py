"""Liveness/readiness probes and a session check for the frontend."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.common.deps import Claims, UserConn, get_engine
from app.common.schemas import ApiError, ApiResponse, ok

logger = logging.getLogger(__name__)
router = APIRouter(tags=["system"])


class HealthStatus(BaseModel):
    status: str


class SessionInfo(BaseModel):
    user_id: UUID
    db_user_id: UUID | None


@router.get("/health")
async def health() -> ApiResponse[HealthStatus]:
    """Liveness: the process is up (used by Render's health check)."""
    return ok(HealthStatus(status="ok"))


@router.get("/health/ready", response_model=None)
async def ready(
    engine: Annotated[AsyncEngine, Depends(get_engine)],
) -> ApiResponse[HealthStatus] | JSONResponse:
    """Readiness: the database answers."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
    except Exception:
        logger.exception("Database not reachable")
        body = ApiResponse[None](
            success=False,
            error=ApiError(code="DB_UNAVAILABLE", message="Chưa kết nối được cơ sở dữ liệu."),
        )
        return JSONResponse(status_code=503, content=body.model_dump(mode="json"))
    return ok(HealthStatus(status="ready"))


@router.get("/api/v1/session")
async def session(claims: Claims, conn: UserConn) -> ApiResponse[SessionInfo]:
    """Confirms the token is valid and that Postgres sees the same user (auth.uid())."""
    result = await conn.execute(text("select auth.uid()"))
    db_user = result.scalar_one_or_none()
    return ok(SessionInfo(user_id=claims.user_id, db_user_id=db_user))
