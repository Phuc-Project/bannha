"""B1 API end to end: real Supabase Auth tokens, real database, RLS on."""

import httpx
import pytest
from httpx import AsyncClient

from app.core.config import Settings
from tests.db.api_fixtures import PASSWORD, Login, set_flag
from tests.db.conftest import uid

pytestmark = pytest.mark.skipif(not PASSWORD, reason="SEED_PASSWORD not set")


async def test_me_before_first_password_change(api: AsyncClient, login: Login) -> None:
    res = await api.get("/api/v1/me", headers=await login("hs24001"))
    me = res.json()["data"]
    assert me["must_change_password"] is True
    assert me["class_info"]["name"] == "10A1"
    assert me["room_name"] == "A101"
    assert me["school"]["dorm_hotline"] == "0212 3800 101"


async def test_app_is_locked_until_password_changed(api: AsyncClient, login: Login) -> None:
    res = await api.post(
        "/api/v1/sync/pull", headers=await login("hs24001"), json={"cursors": {"menus": None}}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "MUST_CHANGE_PASSWORD"


async def test_parent_me_lists_children(api: AsyncClient, login: Login) -> None:
    me = (await api.get("/api/v1/me", headers=await login("ph01"))).json()["data"]
    assert [c["full_name"] for c in me["children"]] == ["Lò Thị Mai", "Lò Văn Pắn"]


async def test_role_header_must_be_one_of_my_roles(api: AsyncClient, login: Login) -> None:
    headers = {**await login("hs24001"), "X-Active-Role": "admin"}
    assert (await api.get("/api/v1/me", headers=headers)).status_code == 403


async def test_change_password_flow(api: AsyncClient, login: Login) -> None:
    headers = await login("hs24014")
    url = "/api/v1/auth/change-password"
    wrong = await api.post(
        url,
        headers=headers,
        json={"current_password": "sai-mat-khau", "new_password": "Ban2026moi"},
    )
    assert wrong.json()["error"]["code"] == "WRONG_PASSWORD"
    weak = await api.post(
        url, headers=headers, json={"current_password": PASSWORD, "new_password": "12345678"}
    )
    assert weak.json()["error"]["code"] == "WEAK_PASSWORD"
    try:
        good = await api.post(
            url, headers=headers, json={"current_password": PASSWORD, "new_password": "NgaBan2026"}
        )
        assert good.status_code == 200
        me = (await api.get("/api/v1/me", headers=headers)).json()["data"]
        assert me["must_change_password"] is False
    finally:
        settings = Settings()
        key = settings.supabase_service_role_key.get_secret_value()
        async with httpx.AsyncClient() as http:
            await http.put(
                f"{settings.supabase_base}/auth/v1/admin/users/{uid('hs24014')}",
                headers={"apikey": key, "Authorization": f"Bearer {key}"},
                json={"password": PASSWORD},
            )
        await set_flag(["hs24014"], True)


@pytest.mark.usefixtures("ready")
async def test_pull_respects_rls_and_pages(api: AsyncClient, login: Login) -> None:
    headers = await login("ph01")
    body = {"cursors": {"profiles": None, "grades": None}, "limit": 20}
    data = (await api.post("/api/v1/sync/pull", headers=headers, json=body)).json()["data"]
    assert {r["username"] for r in data["tables"]["profiles"]["rows"]} == {
        "ph01",
        "hs24007",
        "hs24011",
    }
    grades = data["tables"]["grades"]
    assert len(grades["rows"]) == 20
    assert grades["has_more"] is True

    seen = len(grades["rows"])
    cursor = grades["next_cursor"]
    while True:
        page = (
            await api.post(
                "/api/v1/sync/pull",
                headers=headers,
                json={"cursors": {"grades": cursor}, "limit": 20},
            )
        ).json()["data"]["tables"]["grades"]
        seen += len(page["rows"])
        cursor = page["next_cursor"]
        if not page["has_more"]:
            break
    assert seen == 2 * 24


@pytest.mark.usefixtures("ready")
async def test_pull_hides_donors_from_students(api: AsyncClient, login: Login) -> None:
    body = {"cursors": {"donation_items": None}}
    student = (
        await api.post("/api/v1/sync/pull", headers=await login("hs24001"), json=body)
    ).json()
    assert all("donor_id" not in r for r in student["data"]["tables"]["donation_items"]["rows"])
    staff = (await api.post("/api/v1/sync/pull", headers=await login("qs01"), json=body)).json()
    assert all("donor_id" in r for r in staff["data"]["tables"]["donation_items"]["rows"])


@pytest.mark.usefixtures("ready")
async def test_pull_refuses_internal_tables(api: AsyncClient, login: Login) -> None:
    res = await api.post(
        "/api/v1/sync/pull", headers=await login("qs01"), json={"cursors": {"audit_log": None}}
    )
    assert res.json()["error"]["code"] == "UNKNOWN_TABLE"
