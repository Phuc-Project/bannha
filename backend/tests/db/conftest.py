"""Fixtures for tests against the local Supabase database (seeded by `npx supabase db reset`).

Each test runs in one transaction that is rolled back, so tests never change the seed data.
`act_as(username)` switches the same transaction to that user's identity (RLS applies);
`act_as_system()` switches back to the privileged role for test setup.
"""

import hashlib
import json
import os
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any
from uuid import UUID

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

DB_URL = os.environ.get("TEST_DATABASE_URL")

ActAs = Callable[[str], Awaitable[None]]


def sid(label: str) -> UUID:
    """Same deterministic ids as supabase/seed*.sql: md5('ban-nha:' || label)::uuid."""
    return UUID(hashlib.md5(f"ban-nha:{label}".encode()).hexdigest())  # noqa: S324


def uid(username: str) -> UUID:
    return sid(f"user:{username}")


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    for item in items:
        if "tests/db" in item.nodeid.replace("\\", "/"):
            item.add_marker(pytest.mark.db)
            if not DB_URL:
                item.add_marker(pytest.mark.skip(reason="TEST_DATABASE_URL not set"))


@pytest.fixture
async def conn() -> AsyncIterator[AsyncConnection]:
    assert DB_URL
    engine = create_async_engine(DB_URL)
    try:
        async with engine.connect() as connection:
            trans = await connection.begin()
            try:
                yield connection
            finally:
                await trans.rollback()
    finally:
        await engine.dispose()


@pytest.fixture
def act_as(conn: AsyncConnection) -> ActAs:
    async def switch(username: str) -> None:
        await conn.exec_driver_sql("reset role")
        claims = {"sub": str(uid(username)), "role": "authenticated"}
        await conn.execute(
            text("select set_config('request.jwt.claims', :c, true)"), {"c": json.dumps(claims)}
        )
        await conn.exec_driver_sql("set local role authenticated")

    return switch


@pytest.fixture
def act_as_system(conn: AsyncConnection) -> Callable[[], Awaitable[None]]:
    async def switch() -> None:
        await conn.exec_driver_sql("reset role")

    return switch


async def count(conn: AsyncConnection, sql: str, **params: Any) -> int:
    return int((await conn.execute(text(sql), params)).scalar_one())


async def blocked(conn: AsyncConnection, sql: str, **params: Any) -> bool:
    """True when the statement is refused (RLS / privilege / guard trigger)."""
    savepoint = await conn.begin_nested()
    try:
        result = await conn.execute(text(sql), params)
    except DBAPIError:
        await savepoint.rollback()
        return True
    affected = result.rowcount
    await savepoint.rollback()
    # UPDATEs hidden by RLS do not raise; they simply touch zero rows.
    return affected == 0
