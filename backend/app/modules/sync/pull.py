"""Read changed rows per table, as the user (RLS applies)."""

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.common.users import CurrentUser
from app.modules.sync.cursor import Cursor, decode, next_cursor
from app.modules.sync.tables import PULLABLE, present


async def pull_table(
    conn: AsyncConnection, user: CurrentUser, table: str, raw_cursor: str | None, limit: int
) -> dict[str, Any]:
    if table not in PULLABLE:  # defence in depth; the router validates first
        raise ValueError(f"table not pullable: {table}")
    cursor = decode(raw_cursor)
    # Table name comes from the PULLABLE allow-list above, never from raw input.
    sql = text(
        f"select * from app.{table} "  # noqa: S608
        "where (updated_at, id) > (:ts, :id) order by updated_at, id limit :lim"
    )
    rows = (
        (await conn.execute(sql, {"ts": cursor.updated_at, "id": cursor.id, "lim": limit + 1}))
        .mappings()
        .all()
    )
    has_more = len(rows) > limit
    page = rows[:limit]
    last = Cursor(page[-1]["updated_at"], page[-1]["id"]) if page else None
    return {
        "rows": [present(table, dict(r), user) for r in page],
        "next_cursor": next_cursor(cursor, last, has_more).encode(),
        "has_more": has_more,
    }
