"""Registry of offline commands accepted by POST /api/v1/sync/push.

A command = a Pydantic payload model + an async handler. Feature modules register their
commands here (e.g. "leave_request.create"); unknown commands are rejected.
"""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser

Result = dict[str, Any]
Handler = Callable[[AsyncConnection, CurrentUser, Any], Awaitable[Result]]


@dataclass(frozen=True, slots=True)
class Command:
    name: str
    payload: type[BaseModel]
    handler: Handler
    roles: frozenset[str]  # empty = any signed-in user


_COMMANDS: dict[str, Command] = {}


def command(
    name: str, payload: type[BaseModel], *, roles: tuple[str, ...] = ()
) -> Callable[[Handler], Handler]:
    def register(handler: Handler) -> Handler:
        if name in _COMMANDS:
            raise RuntimeError(f"command registered twice: {name}")
        _COMMANDS[name] = Command(name, payload, handler, frozenset(roles))
        return handler

    return register


def get_command(name: str) -> Command | None:
    return _COMMANDS.get(name)


def registered_names() -> list[str]:
    return sorted(_COMMANDS)
