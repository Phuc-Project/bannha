"""Calls to Supabase Auth and Storage that need the service key. Never exposed to clients."""

import logging
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from app.core.config import Settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

_UNAVAILABLE = AppError(
    "AUTH_SERVICE_UNAVAILABLE", "Máy chủ đăng nhập đang bận. Thử lại sau ít phút.", 503
)


class SupabaseAdmin:
    def __init__(self, http: httpx.AsyncClient, settings: Settings) -> None:
        key = settings.supabase_service_role_key.get_secret_value()
        self._http = http
        self._base = settings.supabase_base
        self._headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        self._email_domain = settings.account_email_domain

    def email_for(self, username: str) -> str:
        return f"{username}@{self._email_domain}"

    async def password_is_correct(self, username: str, password: str) -> bool:
        """Checks the password, then immediately revokes the session the check created."""
        try:
            res = await self._http.post(
                f"{self._base}/auth/v1/token",
                params={"grant_type": "password"},
                headers={"apikey": self._headers["apikey"]},
                json={"email": self.email_for(username), "password": password},
            )
        except httpx.HTTPError as exc:
            logger.warning("Auth service unreachable: %s", exc)
            raise _UNAVAILABLE from exc
        if res.status_code == 200:
            await self.logout(str(res.json().get("access_token", "")), scope="local")
            return True
        if res.status_code in (400, 401):
            return False
        logger.warning("Unexpected auth status %s", res.status_code)
        raise _UNAVAILABLE

    async def logout(self, access_token: str, scope: str) -> None:
        """scope: "local" (this session) or "others" (every other session of the user)."""
        if not access_token:
            return
        try:
            await self._http.post(
                f"{self._base}/auth/v1/logout",
                params={"scope": scope},
                headers={
                    "apikey": self._headers["apikey"],
                    "Authorization": f"Bearer {access_token}",
                },
            )
        except httpx.HTTPError as exc:  # best effort: the password is already verified/changed
            logger.warning("Logout (%s) failed: %s", scope, exc)

    async def set_password(self, user_id: UUID, password: str) -> None:
        await self._call("PUT", f"/auth/v1/admin/users/{user_id}", {"password": password})

    async def delete_user(self, user_id: UUID) -> None:
        """Remove an Auth account (used to roll back a registration that failed half-way)."""
        try:
            await self._http.delete(
                f"{self._base}/auth/v1/admin/users/{user_id}", headers=self._headers
            )
        except httpx.HTTPError as exc:
            logger.warning("Supabase delete_user failed: %s", exc)

    async def create_user(self, username: str, password: str) -> UUID:
        """Create a confirmed Supabase Auth account and return its user UUID."""
        try:
            res = await self._http.post(
                f"{self._base}/auth/v1/admin/users",
                headers=self._headers,
                json={
                    "email": self.email_for(username),
                    "password": password,
                    "email_confirm": True,
                },
            )
        except httpx.HTTPError as exc:
            logger.warning("Supabase create_user failed: %s", exc)
            raise _UNAVAILABLE from exc
        if res.status_code in (400, 409, 422):
            raise AppError("USERNAME_TAKEN", "Mã đăng nhập này đã tồn tại.", 409)
        if res.status_code >= 400:
            logger.warning("Supabase admin create_user -> %s", res.status_code)
            raise _UNAVAILABLE
        data: dict[str, Any] = res.json()
        return UUID(str(data["id"]))

    async def download_object(self, bucket: str, path: str) -> tuple[bytes, str]:
        """Download a private Storage object using the service role key."""
        try:
            res = await self._http.get(
                f"{self._base}/storage/v1/object/{bucket}/{quote(path)}",
                headers=self._headers,
            )
        except httpx.HTTPError as exc:
            logger.warning("Storage download failed: %s", exc)
            raise _UNAVAILABLE from exc
        if res.status_code in (400, 404):
            raise AppError("IMAGE_NOT_FOUND", "Không tìm thấy ảnh đính kèm.", 404)
        if res.status_code >= 400:
            raise _UNAVAILABLE
        media_type = res.headers.get("content-type", "image/webp").split(";")[0].strip()
        return res.content, media_type

    async def create_signed_upload(self, bucket: str, path: str) -> dict[str, Any]:
        """Returns {"url": ..., "token": ...}; the client PUTs the file to that URL."""
        data = await self._call(
            "POST", f"/storage/v1/object/upload/sign/{bucket}/{quote(path)}", {}
        )
        signed = str(data.get("url", ""))
        return {"url": f"{self._base}/storage/v1{signed}", "token": data.get("token")}

    async def _call(self, method: str, path: str, body: dict[str, Any]) -> dict[str, Any]:
        try:
            res = await self._http.request(
                method, f"{self._base}{path}", headers=self._headers, json=body
            )
        except httpx.HTTPError as exc:
            logger.warning("Supabase admin call failed: %s", exc)
            raise _UNAVAILABLE from exc
        if res.status_code >= 400:
            logger.warning("Supabase admin %s %s -> %s", method, path, res.status_code)
            raise _UNAVAILABLE
        payload: dict[str, Any] = res.json() if res.content else {}
        return payload
