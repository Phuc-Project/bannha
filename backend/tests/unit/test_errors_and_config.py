from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

from app.core.config import Settings
from app.core.errors import AppError, ForbiddenError, register_error_handlers


def _app() -> FastAPI:
    app = FastAPI()
    register_error_handlers(app)

    class Body(BaseModel):
        temperature: float

    @app.post("/validate")
    async def validate(body: Body) -> dict[str, float]:
        return {"t": body.temperature}

    @app.get("/domain")
    async def domain() -> None:
        raise AppError("MEAL_CUTOFF_PASSED", "Đã quá giờ báo cắt suất.", 409, {"cutoff": "15:00"})

    @app.get("/forbidden")
    async def forbidden() -> None:
        raise ForbiddenError()

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("select * from secrets")

    return app


async def _client() -> AsyncClient:
    return AsyncClient(
        transport=ASGITransport(app=_app(), raise_app_exceptions=False), base_url="http://t"
    )


async def test_domain_error_keeps_code_message_and_details() -> None:
    async with await _client() as c:
        res = await c.get("/domain")
    assert res.status_code == 409
    assert res.json()["error"] == {
        "code": "MEAL_CUTOFF_PASSED",
        "message": "Đã quá giờ báo cắt suất.",
        "details": {"cutoff": "15:00"},
    }


async def test_forbidden_error_is_403() -> None:
    async with await _client() as c:
        res = await c.get("/forbidden")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


async def test_validation_error_lists_fields_in_vietnamese_envelope() -> None:
    async with await _client() as c:
        res = await c.post("/validate", json={"temperature": "nóng"})
    assert res.status_code == 422
    error = res.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["details"]["fields"][0]["field"] == "temperature"


async def test_unexpected_errors_never_leak_internals() -> None:
    async with await _client() as c:
        res = await c.get("/boom")
    assert res.status_code == 500
    assert "select" not in res.text
    assert res.json()["error"]["code"] == "INTERNAL_ERROR"


def test_cors_origins_accept_comma_separated_env(monkeypatch: object) -> None:
    import pytest

    mp = pytest.MonkeyPatch()
    try:
        mp.setenv("SUPABASE_URL", "https://abc.supabase.co")
        mp.setenv("SUPABASE_SERVICE_ROLE_KEY", "k")
        mp.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h/db")
        mp.setenv("CORS_ORIGINS", "https://bannha.vercel.app, http://localhost:5173")
        cfg = Settings(_env_file=None)
    finally:
        mp.undo()
    assert cfg.cors_origins == ["https://bannha.vercel.app", "http://localhost:5173"]
    assert cfg.jwt_issuer == "https://abc.supabase.co/auth/v1"
    assert cfg.jwks_url == "https://abc.supabase.co/auth/v1/.well-known/jwks.json"
    assert cfg.is_production is False
