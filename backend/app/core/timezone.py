"""Vietnam timezone helpers for meal cutoffs, leave ranges, and daily limits."""

from datetime import date, datetime, time, timedelta, timezone, tzinfo
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def _load_vn_tz() -> tzinfo:
    try:
        return ZoneInfo("Asia/Ho_Chi_Minh")
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=7), name="Asia/Ho_Chi_Minh")


VN_TZ: tzinfo = _load_vn_tz()

MEAL_SLOTS: tuple[tuple[str, time], ...] = (
    ("breakfast", time(6, 30)),
    ("lunch", time(11, 30)),
    ("dinner", time(17, 30)),
)


def to_vn(dt: datetime) -> datetime:
    """Convert any datetime to Asia/Ho_Chi_Minh (naive values are treated as VN local time)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=VN_TZ)
    return dt.astimezone(VN_TZ)


def vn_now() -> datetime:
    """Current timestamp in Vietnam timezone."""
    return datetime.now(VN_TZ)


def vn_today(now: datetime | None = None) -> date:
    """Current calendar date in Vietnam timezone."""
    return (to_vn(now) if now is not None else vn_now()).date()


def is_before_meal_cutoff(meal_date: date, cutoff_hour: int, now: datetime | None = None) -> bool:
    """True when `now` is strictly before `cutoff_hour:00` on `meal_date - 1 day` in VN time."""
    current = to_vn(now) if now is not None else vn_now()
    cutoff_day = meal_date - timedelta(days=1)
    deadline = datetime.combine(cutoff_day, time(cutoff_hour, 0), tzinfo=VN_TZ)
    return current < deadline


def meals_in_leave_range(from_at: datetime, to_at: datetime) -> list[tuple[date, str]]:
    """List `(date, meal)` slots falling within `[from_at, to_at]` in VN time."""
    start = to_vn(from_at)
    end = to_vn(to_at)
    if end <= start:
        return []
    results: list[tuple[date, str]] = []
    day = start.date()
    last_day = end.date()
    while day <= last_day:
        for meal_name, meal_time in MEAL_SLOTS:
            slot = datetime.combine(day, meal_time, tzinfo=VN_TZ)
            if start <= slot <= end:
                results.append((day, meal_name))
        day += timedelta(days=1)
    return results
