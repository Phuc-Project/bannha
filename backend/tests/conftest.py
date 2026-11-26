"""Shared fixtures: an app wired to a test signing key, and a token factory."""

import time
from collections.abc import AsyncIterator, Callable
from typing import Any
from uuid import UUID, uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.security import ASYMMETRIC_ALGORITHMS, JwtVerifier
from app.main import create_app

SUPABASE_URL = "http://127.0.0.1:54321"
ISSUER = f"{SUPABASE_URL}/auth/v1"

TokenFactory = Callable[..., str]


@pytest.fixture(scope="session")
def signing_key() -> ec.EllipticCurvePrivateKey:
    return ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def settings() -> Settings:
    return Settings(
        app_env="test",
        supabase_url=SUPABASE_URL,
        supabase_service_role_key="test-service-key",
        database_url="postgresql+asyncpg://user:pass@127.0.0.1:1/none",
        cors_origins=["http://localhost:5173"],
    )


@pytest.fixture
def verifier(signing_key: ec.EllipticCurvePrivateKey) -> JwtVerifier:
    public_key = signing_key.public_key()
    return JwtVerifier(
        issuer=ISSUER,
        audience="authenticated",
        resolve_key=lambda _token: public_key,
        algorithms=ASYMMETRIC_ALGORITHMS,
    )


@pytest.fixture
def make_token(signing_key: ec.EllipticCurvePrivateKey) -> TokenFactory:
    def factory(
        *,
        sub: UUID | str | None = None,
        exp_in: int = 3600,
        aud: str = "authenticated",
        iss: str = ISSUER,
        role: str = "authenticated",
        key: Any = None,
        **extra: Any,
    ) -> str:
        now = int(time.time())
        payload: dict[str, Any] = {
            "sub": str(sub or uuid4()),
            "aud": aud,
            "iss": iss,
            "role": role,
            "iat": now,
            "exp": now + exp_in,
            **extra,
        }
        return jwt.encode(payload, key or signing_key, algorithm="ES256")

    return factory


@pytest.fixture
def app(settings: Settings, verifier: JwtVerifier) -> FastAPI:
    return create_app(settings, verifier)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        yield http
