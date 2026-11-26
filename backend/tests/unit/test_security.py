from uuid import uuid4

import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core.errors import AuthError
from app.core.security import JwtVerifier
from tests.conftest import TokenFactory


def test_valid_token_returns_user_id(verifier: JwtVerifier, make_token: TokenFactory) -> None:
    user_id = uuid4()
    claims = verifier.verify(make_token(sub=user_id, session_id="s-1"))
    assert claims.user_id == user_id
    assert claims.role == "authenticated"
    assert claims.session_id == "s-1"
    assert claims.raw["sub"] == str(user_id)


def test_expired_token_is_rejected_with_specific_code(
    verifier: JwtVerifier, make_token: TokenFactory
) -> None:
    with pytest.raises(AuthError) as err:
        verifier.verify(make_token(exp_in=-120))
    assert err.value.code == "TOKEN_EXPIRED"
    assert err.value.status_code == 401


def test_small_clock_skew_is_tolerated(verifier: JwtVerifier, make_token: TokenFactory) -> None:
    verifier.verify(make_token(exp_in=-10))


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "anon"},
        {"iss": "https://evil.example/auth/v1"},
        {"role": "service_role"},
        {"role": "anon"},
        {"sub": "not-a-uuid"},
    ],
)
def test_wrong_claims_are_rejected(
    verifier: JwtVerifier, make_token: TokenFactory, overrides: dict[str, str]
) -> None:
    with pytest.raises(AuthError) as err:
        verifier.verify(make_token(**overrides))
    assert err.value.code == "UNAUTHENTICATED"


def test_token_signed_by_another_key_is_rejected(
    verifier: JwtVerifier, make_token: TokenFactory
) -> None:
    other = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(AuthError):
        verifier.verify(make_token(key=other))


def test_garbage_and_alg_none_are_rejected(verifier: JwtVerifier) -> None:
    unsigned = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0."
    for token in ("not-a-jwt", unsigned):
        with pytest.raises(AuthError):
            verifier.verify(token)


def test_hs256_tokens_are_not_accepted_by_the_jwks_verifier(verifier: JwtVerifier) -> None:
    import jwt

    token = jwt.encode(
        {"sub": str(uuid4())}, "shared-secret-that-is-long-enough-for-hs256", algorithm="HS256"
    )
    with pytest.raises(AuthError):
        verifier.verify(token)
