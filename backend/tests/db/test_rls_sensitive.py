"""Sensitive data: health, private needs, grades, tutor conversations."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from tests.db.conftest import ActAs, blocked, count, uid

HEALTH_OF_SON = "select count(*) from app.health_reports where student_id = :s"


@pytest.mark.parametrize(
    ("username", "visible"),
    [
        ("hs24010", 1),  # the student
        ("gv02", 1),  # homeroom teacher of 11A2
        ("yt01", 1),  # medical staff
        ("qs01", 1),  # dorm staff
        ("hs24001", 0),  # another student
        ("ph01", 0),  # parent of other children
        ("bep01", 0),  # kitchen
        ("admin01", 0),  # admin has no clinical reason to read it
    ],
)
async def test_health_reports_visibility(
    conn: AsyncConnection, act_as: ActAs, username: str, visible: int
) -> None:
    await act_as(username)
    assert await count(conn, HEALTH_OF_SON, s=uid("hs24010")) == visible


async def test_only_the_student_files_their_own_health_report(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    sql = """insert into app.health_reports (school_id, student_id, symptoms)
             values (private.current_school_id(), :s, '{fever}')"""
    await act_as("hs24001")
    assert not await blocked(conn, sql, s=uid("hs24001"))
    assert await blocked(conn, sql, s=uid("hs24002"))


@pytest.mark.parametrize(
    ("username", "visible"),
    [("hs24011", 1), ("qs01", 2), ("hs24002", 1), ("hs24001", 0), ("gv02", 0), ("yt01", 0)],
)
async def test_item_requests_are_private_to_requester_and_dorm_staff(
    conn: AsyncConnection, act_as: ActAs, username: str, visible: int
) -> None:
    await act_as(username)
    assert await count(conn, "select count(*) from app.item_requests") == visible


async def test_grades_follow_the_family_and_homeroom(conn: AsyncConnection, act_as: ActAs) -> None:
    per_student = 6 * 4
    await act_as("hs24001")
    assert await count(conn, "select count(*) from app.grades") == per_student
    await act_as("ph01")
    assert await count(conn, "select count(*) from app.grades") == 2 * per_student
    await act_as("gv02")  # homeroom of 11A2 (7 students), sees none of 10A1
    assert await count(conn, "select count(*) from app.grades") == 7 * per_student
    assert (
        await count(conn, "select count(*) from app.grades where student_id = :s", s=uid("hs24001"))
        == 0
    )


async def test_teachers_grade_only_their_homeroom(conn: AsyncConnection, act_as: ActAs) -> None:
    sql = """insert into app.grades (school_id, student_id, subject, term, school_year, kind, seq, score, recorded_by)
             select school_id, :s, 'Toán', 'HK1', '2026-2027', 'final', 1, 8.5, :t from app.profiles where id = :t"""
    await act_as("gv02")
    assert await blocked(conn, sql, s=uid("hs24001"), t=uid("gv02"))
    await act_as("gv01")
    assert not await blocked(conn, sql, s=uid("hs24001"), t=uid("gv01"))
    await act_as("hs24001")
    assert await blocked(conn, sql, s=uid("hs24001"), t=uid("hs24001"))


async def test_tutor_conversations_are_private_to_the_student(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24001")
    await conn.execute(
        text(
            """insert into app.tutor_sessions (school_id, student_id, subject)
               values (private.current_school_id(), :s, 'Toán')"""
        ),
        {"s": uid("hs24001")},
    )
    assert await count(conn, "select count(*) from app.tutor_sessions") == 1
    for other in ("gv01", "ph02", "qs01", "admin01"):
        await act_as(other)
        assert await count(conn, "select count(*) from app.tutor_sessions") == 0


async def test_students_cannot_touch_their_ai_usage_counter(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24001")
    assert await blocked(
        conn,
        """insert into app.tutor_usage (school_id, student_id, date, count)
           select school_id, id, current_date, 0 from app.profiles where id = :s""",
        s=uid("hs24001"),
    )
