"""Tables a client may pull, and how rows are trimmed before leaving the server.

RLS already limits rows to what the user may see; this module limits *tables* (no internal
bookkeeping) and *columns* that must stay hidden even from users who can see the row.
"""

from collections.abc import Callable, Mapping
from typing import Any

from app.common.users import CurrentUser

Row = dict[str, Any]
RowFilter = Callable[[Row, CurrentUser], Row]

PULLABLE: frozenset[str] = frozenset(
    {
        "schools",
        "classes",
        "dorm_rooms",
        "profiles",
        "directory",
        "guardian_links",
        "notifications",
        "announcements",
        "announcement_reads",
        "attendance_sessions",
        "attendance_records",
        "leave_requests",
        "room_issues",
        "menus",
        "meal_cancellations",
        "dish_suggestions",
        "dish_votes",
        "grades",
        "lesson_topics",
        "tutor_sessions",
        "tutor_messages",
        "tutor_usage",
        "health_reports",
        "health_checks",
        "medical_reminders",
        "sos_alerts",
        "donation_items",
        "item_requests",
        "item_matches",
        "scholarships",
        "scholarship_bookmarks",
        "articles",
        "career_results",
        "culture_posts",
        "culture_likes",
    }
)
# Deliberately not pullable: sync_ops, audit_log, reminder_log, qr_signing_keys,
# tutor_practice_sets (contains answer keys; served by the tutor API instead).

# `schools` has no school_id column; everything else is filtered by RLS on school_id.


def _hide_donor(row: Row, user: CurrentUser) -> Row:
    if user.has("dorm_staff", "admin") or row.get("donor_id") == user.id:
        return row
    return {k: v for k, v in row.items() if k != "donor_id"}


ROW_FILTERS: Mapping[str, RowFilter] = {"donation_items": _hide_donor}


def present(table: str, row: Row, user: CurrentUser) -> Row:
    flt = ROW_FILTERS.get(table)
    return flt(row, user) if flt else row
