"""FastAPI dependencies shared by every module."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.core.config import Settings
from app.core.db import user_transaction
from app.core.errors import AuthError
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


Claims = Annotated[TokenClaims, Depends(get_claims)]
UserConn = Annotated[AsyncConnection, Depends(get_user_conn)]
