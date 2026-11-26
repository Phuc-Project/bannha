"""Verification of Supabase Auth access tokens (JWT)."""

import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any
from uuid import NAMESPACE_OID, UUID, uuid5

import httpx
import jwt
from jwt import PyJWKSet

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
        require_authenticated_role: bool = True,
        leeway_seconds: int = 30,
    ) -> None:
        self._issuer = issuer
        self._audience = audience
        self._resolve_key = resolve_key
        self._algorithms = algorithms
        self._require_role = require_authenticated_role
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

        if self._require_role and payload.get("role") != "authenticated":
            raise AuthError()
        raw_sub = str(payload.get("sub") or "").strip()
        if not raw_sub:
            raise AuthError()
        try:
            user_id = UUID(raw_sub)
        except ValueError:
            if self._require_role:
                raise AuthError() from None
            user_id = uuid5(NAMESPACE_OID, f"firebase:{raw_sub}")
        session_id = payload.get("session_id")
        return TokenClaims(
            user_id=user_id,
            role="authenticated",
            session_id=str(session_id) if session_id else None,
            raw=payload,
        )


class ThrottledJwks:
    """Signing keys by `kid`. An unknown kid triggers at most one refetch per interval, so
    forged tokens with random kids cannot hammer Supabase or stall the server."""

    def __init__(
        self,
        fetch: Callable[[], dict[str, Any]],
        *,
        min_refresh_seconds: float = 60,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._fetch = fetch
        self._min_refresh = min_refresh_seconds
        self._clock = clock
        self._keys: dict[str, Any] = {}
        self._last_fetch: float | None = None
        self._lock = threading.Lock()

    def resolve(self, token: str) -> Any:
        try:
            kid = jwt.get_unverified_header(token).get("kid")
        except jwt.PyJWTError as exc:
            raise AuthError() from exc
        if not kid:
            raise AuthError()
        key = self._keys.get(kid)
        if key is not None:
            return key
        with self._lock:
            now = self._clock()
            if self._last_fetch is None or now - self._last_fetch >= self._min_refresh:
                self._last_fetch = now
                self._keys = self._fetch()
        key = self._keys.get(kid)
        if key is None:
            raise AuthError()
        return key


def fetch_jwks(url: str) -> dict[str, Any]:
    res = httpx.get(url, timeout=5)
    res.raise_for_status()
    jwk_set = PyJWKSet.from_dict(res.json())
    return {k.key_id: k.key for k in jwk_set.keys if k.key_id}


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

    url = settings.jwks_url
    jwks = ThrottledJwks(lambda: fetch_jwks(url))
    return JwtVerifier(
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        resolve_key=jwks.resolve,
        algorithms=ASYMMETRIC_ALGORITHMS,
        require_authenticated_role=settings.auth_provider == "supabase",
    )
