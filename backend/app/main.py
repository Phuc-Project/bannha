"""FastAPI application factory."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import Settings, get_settings
from app.core.db import create_engine
from app.core.errors import register_error_handlers
from app.core.limits import BodySizeLimit
from app.core.security import JwtVerifier, build_verifier
from app.jobs.reminders import router as jobs_router
from app.modules.admin.router import router as admin_router
from app.modules.auth.register import router as register_router
from app.modules.auth.router import router as auth_router
from app.modules.contact_book.router import router as contact_book_router
from app.modules.culture.router import router as culture_router
from app.modules.donations.router import router as donations_router
from app.modules.dorm.router import router as dorm_router
from app.modules.kitchen.router import router as kitchen_router
from app.modules.me.router import router as me_router
from app.modules.scholarships.router import router as scholarships_router
from app.modules.sync.router import router as sync_router
from app.modules.system.router import router as system_router
from app.modules.tutor.router import router as tutor_router
from app.modules.uploads.router import router as uploads_router

ALL_ROUTERS = (
    system_router,
    me_router,
    auth_router,
    register_router,
    sync_router,
    uploads_router,
    dorm_router,
    kitchen_router,
    contact_book_router,
    tutor_router,
    donations_router,
    scholarships_router,
    culture_router,
    admin_router,
    jobs_router,
)


class SecurityHeadersMiddleware:
    """Attach baseline browser security headers to every HTTP response."""

    def __init__(self, app: ASGIApp, is_production: bool = True) -> None:
        self.app = app
        self.headers: list[tuple[bytes, bytes]] = [
            (b"x-content-type-options", b"nosniff"),
            (b"x-frame-options", b"DENY"),
            (b"referrer-policy", b"strict-origin-when-cross-origin"),
            (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
            (b"content-security-policy", b"default-src 'none'; frame-ancestors 'none'"),
        ]
        if is_production:
            self.headers.append(
                (b"strict-transport-security", b"max-age=31536000; includeSubDomains")
            )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                raw = list(message.get("headers", []))
                raw.extend(self.headers)
                message = {**message, "headers": raw}
            await send(message)

        await self.app(scope, receive, send_with_headers)


def create_app(settings: Settings | None = None, verifier: JwtVerifier | None = None) -> FastAPI:
    cfg = settings or get_settings()
    logging.basicConfig(level=logging.INFO if cfg.is_production else logging.DEBUG)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        await app.state.http.aclose()
        await app.state.engine.dispose()

    app = FastAPI(
        title="BẢN NHÀ API",
        version="0.1.0",
        lifespan=lifespan,
        # Interactive docs only outside production.
        docs_url=None if cfg.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if cfg.is_production else "/openapi.json",
    )
    app.state.settings = cfg
    app.state.verifier = verifier or build_verifier(cfg)
    app.state.engine = create_engine(cfg)
    app.state.http = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Active-Role"],
        max_age=600,
    )
    app.add_middleware(BodySizeLimit)
    app.add_middleware(SecurityHeadersMiddleware, is_production=cfg.is_production)
    register_error_handlers(app)
    for router in ALL_ROUTERS:
        app.include_router(router)
    return app


def app_factory() -> FastAPI:
    """Entry point for `uvicorn --factory app.main:app_factory`."""
    return create_app()
