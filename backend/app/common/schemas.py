"""Shared response envelope: { success, data, error, meta }."""

from typing import Any

from pydantic import BaseModel


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class Meta(BaseModel):
    next_cursor: str | None = None
    total: int | None = None


class ApiResponse[T](BaseModel):
    success: bool
    data: T | None = None
    error: ApiError | None = None
    meta: Meta | None = None


def ok[T](data: T, meta: Meta | None = None) -> ApiResponse[T]:
    return ApiResponse[T](success=True, data=data, meta=meta)
