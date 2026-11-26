"""Database access.

Every user request runs inside `user_transaction`, which switches the connection to the
`authenticated` role with the caller's JWT claims, so Postgres row level security applies
exactly as if the client had queried Supabase directly. `service_transaction` bypasses RLS
and is only for admin tasks, scheduled jobs and system notifications.
"""

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from app.core.config import Settings
from app.core.security import TokenClaims


def create_engine(settings: Settings) -> AsyncEngine:
    return create_async_engine(
        settings.database_url.get_secret_value(),
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_pool_size,
        pool_pre_ping=True,
        pool_recycle=300,
        # Error messages/logs must not carry bound values (health notes, JWT claims…).
        hide_parameters=True,
        # Safe behind Supabase's pooler: no cached statements, unique prepared-statement names.
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
        },
    )


@asynccontextmanager
async def user_transaction(
    engine: AsyncEngine, claims: TokenClaims
) -> AsyncIterator[AsyncConnection]:
    """One transaction as the signed-in user; RLS is enforced."""
    async with engine.begin() as conn:
        await conn.execute(
            text("select set_config('request.jwt.claims', :claims, true)"),
            {"claims": json.dumps(claims.raw)},
        )
        await conn.exec_driver_sql("set local statement_timeout = '5s'")
        await conn.exec_driver_sql("set local role authenticated")
        yield conn


@asynccontextmanager
async def service_transaction(engine: AsyncEngine) -> AsyncIterator[AsyncConnection]:
    """One transaction that bypasses RLS. Use only where the caller's rights are already checked."""
    async with engine.begin() as conn:
        await conn.exec_driver_sql("set local role service_role")
        yield conn
