"""Shared fixtures for API tests against the real local stack."""

import os
from collections.abc import AsyncIterator, Callable, Coroutine
from typing import Any

import httpx
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.main import create_app
from tests.db.conftest import DB_URL

PASSWORD = os.environ.get("SEED_PASSWORD", "")
Login = Callable[[str], Coroutine[Any, Any, dict[str, str]]]


async def set_flag(usernames: list[str], value: bool) -> None:
    assert DB_URL
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        await conn.execute(
            text("update app.profiles set must_change_password = :v where username = any(:u)"),
            {"v": value, "u": usernames},
        )
    await engine.dispose()


@pytest.fixture
async def api() -> AsyncIterator[AsyncClient]:
    app = create_app(Settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    await app.state.http.aclose()
    await app.state.engine.dispose()


@pytest.fixture
def login() -> Login:
    settings = Settings()

    async def token_for(username: str) -> dict[str, str]:
        async with httpx.AsyncClient() as http:
            res = await http.post(
                f"{settings.supabase_base}/auth/v1/token",
                params={"grant_type": "password"},
                headers={"apikey": settings.supabase_service_role_key.get_secret_value()},
                json={"email": f"{username}@bannha.internal", "password": PASSWORD},
            )
        res.raise_for_status()
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return token_for


@pytest.fixture
async def ready() -> AsyncIterator[None]:
    """Seeded accounts with the first-password step already done."""
    users = ["hs24001", "ph01", "ph02", "qs01", "bep01"]
    await set_flag(users, False)
    yield
    await set_flag(users, True)
