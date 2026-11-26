"""Verification of Supabase Auth access tokens (JWT)."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import jwt
from jwt import PyJWKClient

from app.core.config import Settings
from app.core.errors import AuthError

# Asymmetric algorithms used by Supabase signing keys (JWKS).
ASYMMETRIC_ALGORITHMS = ["ES256", "RS256", "EdDSA"]

KeyResolver = Callable[[str], Any]


@dataclass(frozen=True, slots=True)
class TokenClaims:
    user_id: UUID
    role: str
    session_id: str | None
    raw: dict[str, Any]


class JwtVerifier:
    """Checks signature, expiry, audience and issuer. Never trusts app roles inside the token."""

    def __init__(
        self,
        *,
        issuer: str,
        audience: str,
        resolve_key: KeyResolver,
        algorithms: list[str],
        leeway_seconds: int = 30,
    ) -> None:
        self._issuer = issuer
        self._audience = audience
        self._resolve_key = resolve_key
        self._algorithms = algorithms
        self._leeway = leeway_seconds

    def verify(self, token: str) -> TokenClaims:
        try:
            key = self._resolve_key(token)
            payload: dict[str, Any] = jwt.decode(
                token,
                key=key,
                algorithms=self._algorithms,
                audience=self._audience,
                issuer=self._issuer,
                leeway=self._leeway,
                options={"require": ["exp", "sub", "aud", "iss"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthError(
                "TOKEN_EXPIRED", "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại."
            ) from exc
        except (jwt.PyJWTError, ValueError) as exc:
            raise AuthError() from exc

        if payload.get("role") != "authenticated":
            raise AuthError()
        try:
            user_id = UUID(str(payload["sub"]))
        except ValueError as exc:
            raise AuthError() from exc
        session_id = payload.get("session_id")
        return TokenClaims(
            user_id=user_id,
            role="authenticated",
            session_id=str(session_id) if session_id else None,
            raw=payload,
        )


def build_verifier(settings: Settings) -> JwtVerifier:
    """JWKS (asymmetric keys) in production; the legacy HS256 secret only if configured."""
    if settings.supabase_jwt_secret is not None:
        secret = settings.supabase_jwt_secret.get_secret_value()
        return JwtVerifier(
            issuer=settings.jwt_issuer,
            audience=settings.supabase_jwt_audience,
            resolve_key=lambda _token: secret,
            algorithms=["HS256"],
        )

    jwks = PyJWKClient(settings.jwks_url, cache_keys=True, lifespan=600, timeout=5)
    return JwtVerifier(
        issuer=settings.jwt_issuer,
        audience=settings.supabase_jwt_audience,
        resolve_key=lambda token: jwks.get_signing_key_from_jwt(token).key,
        algorithms=ASYMMETRIC_ALGORITHMS,
    )
