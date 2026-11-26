"""Application settings, read from environment variables / backend/.env."""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Safe default: a missing APP_ENV must not expose /docs or debug logging.
    app_env: Literal["development", "test", "production"] = "production"
    # Comma-separated in the environment: "https://a.example,https://b.example"
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    supabase_url: AnyHttpUrl
    supabase_jwks_url: AnyHttpUrl | None = None
    # Only for local stacks that still sign with the legacy shared secret (HS256).
    supabase_jwt_secret: SecretStr | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_service_role_key: SecretStr

    database_url: SecretStr
    db_pool_size: int = Field(default=5, ge=1, le=50)

    account_email_domain: str = "bannha.internal"
    max_upload_mb: int = Field(default=5, ge=1, le=20)
    timezone: str = "Asia/Ho_Chi_Minh"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value

    @property
    def supabase_base(self) -> str:
        return str(self.supabase_url).rstrip("/")

    @property
    def jwt_issuer(self) -> str:
        return f"{self.supabase_base}/auth/v1"

    @property
    def jwks_url(self) -> str:
        if self.supabase_jwks_url is not None:
            return str(self.supabase_jwks_url)
        return f"{self.jwt_issuer}/.well-known/jwks.json"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
