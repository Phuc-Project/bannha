"""Integration: user_transaction really runs as the signed-in user (needs local Supabase).

Run with: npx supabase start  →  TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres uv run pytest -m db
"""

import os
from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.db import service_transaction, user_transaction
from app.core.security import TokenClaims

DB_URL = os.environ.get("TEST_DATABASE_URL")

pytestmark = [
    pytest.mark.db,
    pytest.mark.skipif(not DB_URL, reason="TEST_DATABASE_URL not set (local Supabase not running)"),
]


async def test_user_transaction_sets_role_and_auth_uid() -> None:
    assert DB_URL
    engine = create_async_engine(DB_URL)
    user_id = uuid4()
    claims = TokenClaims(
        user_id=user_id,
        role="authenticated",
        session_id=None,
        raw={"sub": str(user_id), "role": "authenticated"},
    )
    try:
        async with user_transaction(engine, claims) as conn:
            row = (await conn.execute(text("select current_user, auth.uid()"))).one()
        assert row[0] == "authenticated"
        assert row[1] == user_id

        # Settings are transaction-local: a fresh connection is back to the pool user.
        async with engine.connect() as conn:
            assert (await conn.execute(text("select current_user"))).scalar_one() != "authenticated"

        async with service_transaction(engine) as conn:
            assert (await conn.execute(text("select current_user"))).scalar_one() == "service_role"
    finally:
        await engine.dispose()
