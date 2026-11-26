"""Domain errors and the handlers that turn every failure into the standard JSON envelope."""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.common.schemas import ApiError, ApiResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """A failure the user can understand. `message` is shown in the app (Vietnamese)."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class AuthError(AppError):
    def __init__(self, code: str = "UNAUTHENTICATED", message: str | None = None) -> None:
        super().__init__(
            code,
            message or "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.",
            status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenError(AppError):
    def __init__(self, message: str = "Tài khoản của bạn không có quyền làm việc này.") -> None:
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


_HTTP_MESSAGES: dict[int, tuple[str, str]] = {
    404: ("NOT_FOUND", "Không tìm thấy nội dung này."),
    405: ("METHOD_NOT_ALLOWED", "Thao tác này không được hỗ trợ."),
    429: ("RATE_LIMITED", "Bạn thao tác quá nhanh. Đợi một chút rồi thử lại."),
}


def _envelope(status_code: int, error: ApiError) -> JSONResponse:
    body = ApiResponse[None](success=False, data=None, error=error)
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


async def _app_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppError):  # registered for AppError only
        raise exc
    return _envelope(
        exc.status_code, ApiError(code=exc.code, message=exc.message, details=exc.details)
    )


async def _validation_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise exc
    fields = [
        {
            "field": ".".join(str(p) for p in err.get("loc", ()) if p != "body"),
            "reason": err.get("msg"),
        }
        for err in exc.errors()
    ]
    return _envelope(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        ApiError(
            code="VALIDATION_ERROR",
            message="Dữ liệu gửi lên chưa đúng. Kiểm tra lại các ô được đánh dấu.",
            details={"fields": fields},
        ),
    )


async def _http_error(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, StarletteHTTPException):
        raise exc
    code, message = _HTTP_MESSAGES.get(exc.status_code, ("HTTP_ERROR", "Yêu cầu không hợp lệ."))
    return _envelope(exc.status_code, ApiError(code=code, message=message))


async def _unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    # Never leak internals (SQL, stack traces) to clients.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return _envelope(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        ApiError(code="INTERNAL_ERROR", message="Máy chủ đang gặp lỗi. Thử lại sau ít phút."),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    app.add_exception_handler(Exception, _unexpected_error)
