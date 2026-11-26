from httpx import AsyncClient

from tests.conftest import TokenFactory


async def test_health_uses_the_standard_envelope(client: AsyncClient) -> None:
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"success": True, "data": {"status": "ok"}, "error": None, "meta": None}


async def test_ready_reports_503_in_vietnamese_when_db_is_down(client: AsyncClient) -> None:
    res = await client.get("/health/ready")
    assert res.status_code == 503
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "DB_UNAVAILABLE"
    assert "cơ sở dữ liệu" in body["error"]["message"]


async def test_session_requires_a_bearer_token(client: AsyncClient) -> None:
    res = await client.get("/api/v1/session")
    assert res.status_code == 401
    assert res.json()["error"] == {
        "code": "UNAUTHENTICATED",
        "message": "Bạn cần đăng nhập để dùng chức năng này.",
        "details": None,
    }


async def test_session_rejects_an_expired_token(
    client: AsyncClient, make_token: TokenFactory
) -> None:
    res = await client.get(
        "/api/v1/session", headers={"Authorization": f"Bearer {make_token(exp_in=-600)}"}
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "TOKEN_EXPIRED"


async def test_unknown_route_returns_vietnamese_404(client: AsyncClient) -> None:
    res = await client.get("/api/v1/khong-co")
    assert res.status_code == 404
    assert res.json()["error"] == {
        "code": "NOT_FOUND",
        "message": "Không tìm thấy nội dung này.",
        "details": None,
    }


async def test_cors_allows_only_the_frontend_origin(client: AsyncClient) -> None:
    preflight = {
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
    }
    allowed = await client.options(
        "/health", headers={"Origin": "http://localhost:5173", **preflight}
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    blocked = await client.options(
        "/health", headers={"Origin": "https://evil.example", **preflight}
    )
    assert "access-control-allow-origin" not in blocked.headers
