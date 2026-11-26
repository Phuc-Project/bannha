from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.modules.sync.cursor import LAG, START, ZERO_ID, Cursor, CursorError, decode, next_cursor

T0 = datetime(2026, 11, 26, 19, 0, tzinfo=UTC)


def test_missing_cursor_starts_from_the_beginning() -> None:
    assert decode(None) == START
    assert decode("") == START


def test_round_trip() -> None:
    c = Cursor(T0, uuid4())
    assert decode(c.encode()) == c


@pytest.mark.parametrize(
    "raw", ["garbage", "2026-11-26T19:00:00|not-a-uuid", "2026-11-26T19:00:00|" + str(ZERO_ID)]
)
def test_bad_cursors_are_rejected(raw: str) -> None:
    with pytest.raises(CursorError):
        decode(raw)


def test_paging_uses_the_exact_last_row() -> None:
    last = Cursor(T0, uuid4())
    assert next_cursor(START, last, has_more=True) == last


def test_caught_up_cursor_is_lagged_to_catch_late_commits() -> None:
    last = Cursor(T0, uuid4())
    assert next_cursor(START, last, has_more=False) == Cursor(T0 - LAG, ZERO_ID)


def test_lag_never_moves_the_cursor_backwards() -> None:
    previous = Cursor(T0, ZERO_ID)
    last = Cursor(T0 + timedelta(seconds=30), uuid4())
    assert next_cursor(previous, last, has_more=False) == previous


def test_empty_page_keeps_the_cursor() -> None:
    previous = Cursor(T0, uuid4())
    assert next_cursor(previous, None, has_more=False) == previous
