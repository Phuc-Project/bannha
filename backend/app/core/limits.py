"""Reject oversized request bodies before they are parsed (protects memory on small instances)."""

import json

from starlette.types import ASGIApp, Message, Receive, Scope, Send

MAX_BODY_BYTES = 1_000_000

_BODY = json.dumps(
    {
        "success": False,
        "data": None,
        "error": {
            "code": "PAYLOAD_TOO_LARGE",
            "message": "Dữ liệu gửi lên quá lớn. Hãy gửi ít mục hơn mỗi lần.",
            "details": None,
        },
        "meta": None,
    },
    ensure_ascii=False,
).encode()


class BodySizeLimit:
    def __init__(self, app: ASGIApp, max_bytes: int = MAX_BODY_BYTES) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        declared = dict(scope.get("headers", [])).get(b"content-length")
        if declared is not None and declared.isdigit() and int(declared) > self.max_bytes:
            await _reject(send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    raise _TooLargeError
            return message

        try:
            await self.app(scope, limited_receive, send)
        except _TooLargeError:
            await _reject(send)


class _TooLargeError(Exception):
    pass


async def _reject(send: Send) -> None:
    await send(
        {
            "type": "http.response.start",
            "status": 413,
            "headers": [(b"content-type", b"application/json; charset=utf-8")],
        }
    )
    await send({"type": "http.response.body", "body": _BODY})
