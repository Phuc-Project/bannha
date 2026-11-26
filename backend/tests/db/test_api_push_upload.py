"""B1 push commands and uploads against the real stack."""

from uuid import uuid4

import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from tests.db.api_fixtures import PASSWORD, Login
from tests.db.conftest import DB_URL, uid

pytestmark = [
    pytest.mark.usefixtures("ready"),
    pytest.mark.skipif(not PASSWORD, reason="SEED_PASSWORD not set"),
]


async def _ph01_notification_id() -> str:
    assert DB_URL
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        row = await conn.execute(
            text("update app.notifications set read_at = null where user_id = :u returning id"),
            {"u": uid("ph01")},
        )
        nid = str(row.scalar_one())
    await engine.dispose()
    return nid


async def test_push_is_idempotent_per_op_id(api: AsyncClient, login: Login) -> None:
    headers = await login("ph01")
    op = {
        "op_id": str(uuid4()),
        "command": "notification.mark_read",
        "payload": {"id": await _ph01_notification_id()},
    }
    first = (await api.post("/api/v1/sync/push", headers=headers, json={"ops": [op]})).json()
    again = (await api.post("/api/v1/sync/push", headers=headers, json={"ops": [op]})).json()
    assert first["data"]["results"][0]["status"] == "applied"
    assert again["data"]["results"] == first["data"]["results"]


async def test_push_reports_each_op_separately(api: AsyncClient, login: Login) -> None:
    headers = await login("ph02")
    ops = [
        {
            "op_id": str(uuid4()),
            "command": "notification.mark_read",
            "payload": {"id": await _ph01_notification_id()},
        },
        {"op_id": str(uuid4()), "command": "khong.ton_tai", "payload": {}},
        {"op_id": str(uuid4()), "command": "profile.update_contact", "payload": {"phone": "abc"}},
        {
            "op_id": str(uuid4()),
            "command": "profile.update_contact",
            "payload": {"phone": "0912 345 678"},
        },
    ]
    results = (await api.post("/api/v1/sync/push", headers=headers, json={"ops": ops})).json()[
        "data"
    ]["results"]
    assert [r["status"] for r in results] == ["rejected", "rejected", "rejected", "applied"]
    # Someone else's notification looks like it does not exist.
    assert results[0]["error"]["code"] == "NOT_FOUND"
    assert results[1]["error"]["code"] == "UNKNOWN_COMMAND"
    assert results[2]["error"]["code"] == "VALIDATION_ERROR"


async def test_upload_url_is_scoped_to_the_user(api: AsyncClient, login: Login) -> None:
    headers = await login("hs24001")
    res = await api.post(
        "/api/v1/uploads",
        headers=headers,
        json={"bucket": "culture", "content_type": "image/webp", "size_bytes": 1200},
    )
    data = res.json()["data"]
    assert data["path"].split("/")[1] == str(uid("hs24001"))
    async with httpx.AsyncClient() as http:
        put = await http.put(
            data["upload_url"],
            content=b"RIFF\x00\x00\x00\x00WEBP",
            headers={"Content-Type": "image/webp"},
        )
    assert put.status_code == 200


async def test_upload_rules(api: AsyncClient, login: Login) -> None:
    student = await login("hs24001")
    menus = await api.post(
        "/api/v1/uploads",
        headers=student,
        json={"bucket": "menus", "content_type": "image/webp", "size_bytes": 10},
    )
    assert menus.status_code == 403
    huge = await api.post(
        "/api/v1/uploads",
        headers=student,
        json={"bucket": "culture", "content_type": "image/webp", "size_bytes": 6 * 1024 * 1024},
    )
    assert huge.json()["error"]["code"] == "FILE_TOO_LARGE"
    svg = await api.post(
        "/api/v1/uploads",
        headers=student,
        json={"bucket": "culture", "content_type": "image/svg+xml", "size_bytes": 10},
    )
    assert svg.status_code == 422
