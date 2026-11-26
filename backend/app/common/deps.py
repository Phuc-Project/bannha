"""FastAPI dependencies shared by every module."""

from collections.abc import AsyncIterator
from typing import Annotated

import httpx
from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.common.users import CurrentUser, load_current_user
from app.core.config import Settings
from app.core.db import user_transaction
from app.core.errors import AppError, AuthError, ForbiddenError
from app.core.security import JwtVerifier, TokenClaims

_bearer = HTTPBearer(auto_error=False)


def get_settings_dep(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_verifier(request: Request) -> JwtVerifier:
    verifier: JwtVerifier = request.app.state.verifier
    return verifier


def get_engine(request: Request) -> AsyncEngine:
    engine: AsyncEngine = request.app.state.engine
    return engine


def get_http(request: Request) -> httpx.AsyncClient:
    client: httpx.AsyncClient = request.app.state.http
    return client


async def get_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[JwtVerifier, Depends(get_verifier)],
) -> TokenClaims:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthError("UNAUTHENTICATED", "Bạn cần đăng nhập để dùng chức năng này.")
    return verifier.verify(credentials.credentials)


async def get_user_conn(
    claims: Annotated[TokenClaims, Depends(get_claims)],
    engine: Annotated[AsyncEngine, Depends(get_engine)],
) -> AsyncIterator[AsyncConnection]:
    async with user_transaction(engine, claims) as conn:
        yield conn


async def get_user_any_state(
    conn: Annotated[AsyncConnection, Depends(get_user_conn)],
    x_active_role: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    """The user, even if they still have to change their first password."""
    return await load_current_user(conn, x_active_role)


async def get_current_user(
    user: Annotated[CurrentUser, Depends(get_user_any_state)],
) -> CurrentUser:
    """The user, ready to use the app (first password already changed)."""
    if user.must_change_password:
        raise AppError(
            "MUST_CHANGE_PASSWORD", "Em cần đổi mật khẩu lần đầu trước khi dùng ứng dụng.", 403
        )
    return user


def require_roles(*roles: str):  # type: ignore[no-untyped-def]  # returns a FastAPI dependency
    """Dependency factory: the *active* role must be one of `roles`."""

    async def check(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.active_role not in roles:
            raise ForbiddenError()
        return user

    return check


Claims = Annotated[TokenClaims, Depends(get_claims)]
UserConn = Annotated[AsyncConnection, Depends(get_user_conn)]
User = Annotated[CurrentUser, Depends(get_current_user)]
UserAnyState = Annotated[CurrentUser, Depends(get_user_any_state)]
Engine = Annotated[AsyncEngine, Depends(get_engine)]
Http = Annotated[httpx.AsyncClient, Depends(get_http)]
AppSettings = Annotated[Settings, Depends(get_settings_dep)]
