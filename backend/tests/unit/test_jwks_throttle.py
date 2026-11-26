from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core.errors import AuthError
from app.core.security import ThrottledJwks


class FakeFetcher:
    def __init__(self, keys: dict[str, Any]) -> None:
        self.keys = keys
        self.calls = 0

    def __call__(self) -> dict[str, Any]:
        self.calls += 1
        return dict(self.keys)


def _token(kid: str) -> str:
    key = ec.generate_private_key(ec.SECP256R1())
    return jwt.encode({"sub": "x"}, key, algorithm="ES256", headers={"kid": kid})


def test_known_kid_is_served_from_cache() -> None:
    fetch = FakeFetcher({"k1": "KEY1"})
    jwks = ThrottledJwks(fetch, min_refresh_seconds=60, clock=lambda: 1000.0)
    assert jwks.resolve(_token("k1")) == "KEY1"
    assert jwks.resolve(_token("k1")) == "KEY1"
    assert fetch.calls == 1


def test_unknown_kid_refetches_at_most_once_per_interval() -> None:
    now = [1000.0]
    fetch = FakeFetcher({"k1": "KEY1"})
    jwks = ThrottledJwks(fetch, min_refresh_seconds=60, clock=lambda: now[0])
    jwks.resolve(_token("k1"))
    for kid in ("forged-1", "forged-2", "forged-3"):
        with pytest.raises(AuthError):
            jwks.resolve(_token(kid))
    assert fetch.calls == 1  # all forged kids arrived within the throttle window

    now[0] += 61
    fetch.keys["k2"] = "KEY2"  # key rotation picked up after the window
    assert jwks.resolve(_token("k2")) == "KEY2"
    assert fetch.calls == 2


def test_token_without_kid_is_rejected() -> None:
    jwks = ThrottledJwks(FakeFetcher({}), min_refresh_seconds=60, clock=lambda: 0.0)
    key = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(AuthError):
        jwks.resolve(jwt.encode({"sub": "x"}, key, algorithm="ES256"))
