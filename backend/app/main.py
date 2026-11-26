"""FastAPI application factory."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.db import create_engine
from app.core.errors import register_error_handlers
from app.core.limits import BodySizeLimit
from app.core.security import JwtVerifier, build_verifier
from app.jobs.reminders import router as jobs_router
from app.modules.admin.router import router as admin_router
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
    register_error_handlers(app)
    for router in ALL_ROUTERS:
        app.include_router(router)
    return app


def app_factory() -> FastAPI:
    """Entry point for `uvicorn --factory app.main:app_factory`."""
    return create_app()
