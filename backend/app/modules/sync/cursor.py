"""Pull cursors: "<updated_at ISO>|<id>".

While a table still has more pages, the cursor is the exact last row (stable paging).
Once caught up, the cursor is moved back by LAG so the next pull re-reads the last few
minutes: a transaction that committed late with an older `updated_at` is never skipped.
Re-reading is harmless because the client upserts by id.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

LAG = timedelta(minutes=2)
ZERO_ID = UUID(int=0)
EPOCH = datetime(1970, 1, 1, tzinfo=UTC)


class CursorError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class Cursor:
    updated_at: datetime
    id: UUID

    def encode(self) -> str:
        return f"{self.updated_at.isoformat()}|{self.id}"


START = Cursor(EPOCH, ZERO_ID)


def decode(raw: str | None) -> Cursor:
    if not raw:
        return START
    try:
        ts_part, id_part = raw.split("|", 1)
        ts = datetime.fromisoformat(ts_part)
        if ts.tzinfo is None:
            raise CursorError("cursor timestamp needs a timezone")
        return Cursor(ts, UUID(id_part))
    except (ValueError, TypeError) as exc:
        raise CursorError(str(exc)) from exc


def next_cursor(previous: Cursor, last_row: Cursor | None, has_more: bool) -> Cursor:
    """Cursor to hand back after a page."""
    if last_row is None:
        return previous
    if has_more:
        return last_row
    lagged = Cursor(last_row.updated_at - LAG, ZERO_ID)
    # Never move backwards past where the client already was.
    return lagged if lagged.updated_at > previous.updated_at else previous
