"""Exploits found in the B1 security review; each must be blocked."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from tests.db.conftest import ActAs, blocked, count, sid, uid

NEW_LEAVE = """
insert into app.leave_requests (id, school_id, student_id, created_by, kind, from_at, to_at, reason)
values (:id, private.current_school_id(), :s, :s, 'go_home', now() + interval '1 day',
        now() + interval '2 days', 'Về bản')
"""


async def test_h1_pending_leave_cannot_be_moved_to_another_student(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    me, leave = uid("hs24001"), sid("test-leave")
    await act_as("hs24001")
    await conn.execute(text(NEW_LEAVE), {"id": leave, "s": me})
    assert await blocked(
        conn,
        "update app.leave_requests set student_id = :o where id = :id",
        o=uid("hs24007"),
        id=leave,
    )
    assert await blocked(
        conn, "update app.leave_requests set reviewed_by = :me where id = :id", me=me, id=leave
    )
    assert await blocked(
        conn, "update app.leave_requests set status = 'approved' where id = :id", id=leave
    )
    assert not await blocked(
        conn, "update app.leave_requests set status = 'cancelled' where id = :id", id=leave
    )


async def test_h2_file_paths_must_belong_to_the_writer(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    me, other = uid("hs24003"), uid("hs24002")
    school = sid("school")
    mine = f"{school}/{me}/0b0c8f4e-8c1a-4b7a-9d1e-1f2a3b4c5d6e.webp"
    theirs = f"{school}/{other}/0b0c8f4e-8c1a-4b7a-9d1e-1f2a3b4c5d6e.webp"
    sql = """insert into app.room_issues (school_id, room_id, reported_by, category, description, photo_path)
             values (private.current_school_id(), :r, :me, 'bed', 'Giường gãy chân', :p)"""
    await act_as("hs24003")
    assert await blocked(conn, sql, r=sid("room:A101"), me=me, p=theirs)
    assert not await blocked(conn, sql, r=sid("room:A101"), me=me, p=mine)
    post = """insert into app.culture_posts (school_id, author_id, ethnicity, category, title, body, photo_paths)
              values (private.current_school_id(), :me, 'Dao', 'food', 'Thịt treo gác bếp', 'Món ăn mùa đông của bản em.', :p)"""
    assert await blocked(conn, post, me=me, p=[mine, theirs])
    assert not await blocked(conn, post, me=me, p=[mine])
    assert await blocked(
        conn, "update app.profiles set avatar_path = :p where id = :me", p=theirs, me=me
    )


async def test_h3_announcement_audience_cannot_be_widened(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    gv02, ann = uid("gv02"), sid("test-ann")
    await act_as("gv02")
    await conn.execute(
        text("""insert into app.announcements (id, school_id, audience, class_id, title, body, created_by)
                values (:id, private.current_school_id(), 'class', :c, 'Họp lớp', 'Chiều nay họp.', :t)"""),
        {"id": ann, "c": sid("class:11A2"), "t": gv02},
    )
    assert await blocked(
        conn,
        "update app.announcements set audience = 'parents', class_id = null where id = :id",
        id=ann,
    )
    assert await blocked(
        conn,
        "update app.announcements set class_id = :c where id = :id",
        c=sid("class:10A1"),
        id=ann,
    )
    assert not await blocked(
        conn, "update app.announcements set title = 'Họp lớp 11A2' where id = :id", id=ann
    )


async def test_m1_users_cannot_rename_themselves(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("hs24001")
    assert await blocked(
        conn,
        "update app.profiles set full_name = 'Hoàng Thị Thu' where id = :id",
        id=uid("hs24001"),
    )


async def test_m2_private_announcements_hidden_from_unrelated_staff(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    class_ann = "select count(*) from app.announcements where audience = 'class'"
    for who in ("bep01", "yt01", "gv02"):
        await act_as(who)
        assert await count(conn, class_ann) == 0, who
    for who in ("gv01", "qs01", "admin01"):
        await act_as(who)
        assert await count(conn, class_ann) == 1, who


async def test_m3_author_and_reviewer_fields_cannot_be_forged(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("gv01")
    assert await blocked(
        conn,
        "update app.grades set recorded_by = :x where student_id = :s",
        x=uid("gv02"),
        s=uid("hs24001"),
    )
    await act_as("hs24012")
    assert await blocked(
        conn,
        "update app.culture_posts set reviewed_by = :me where author_id = :me",
        me=uid("hs24012"),
    )


async def test_m4_owners_cannot_change_status_fields(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("hs24011")
    assert await blocked(
        conn,
        "update app.item_requests set status = 'fulfilled' where requester_id = :me",
        me=uid("hs24011"),
    )
    assert not await blocked(
        conn,
        "update app.item_requests set status = 'cancelled' where requester_id = :me",
        me=uid("hs24011"),
    )
    await act_as("hs24001")
    session = sid("test-tutor-session")
    await conn.execute(
        text("""insert into app.tutor_sessions (id, school_id, student_id, subject)
                values (:id, private.current_school_id(), auth.uid(), 'Toán')"""),
        {"id": session},
    )
    msg = """insert into app.tutor_messages (school_id, session_id, student_id, role, content)
             values (private.current_school_id(), :s, auth.uid(), :role, 'Đáp án là 42')"""
    assert await blocked(conn, msg, s=session, role="assistant")
    assert not await blocked(conn, msg, s=session, role="user")
    assert await blocked(
        conn,
        """insert into app.tutor_practice_sets (school_id, student_id, lesson_topic_id, questions, score)
           values (private.current_school_id(), :me, :t, '[]', 5)""",
        me=uid("hs24001"),
        t=sid("missing"),
    )


async def test_l1_kitchen_cannot_read_student_profiles_but_still_counts_meals(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("bep01")
    assert await count(conn, "select count(*) from app.profiles where 'student' = any(roles)") == 0
    rows = (
        (await conn.exec_driver_sql("select distinct total_students from app.meal_counts"))
        .scalars()
        .all()
    )
    assert rows == [14]


async def test_l4_sync_ops_are_per_user(conn: AsyncConnection, act_as: ActAs) -> None:
    op = sid("shared-op")
    sql = """insert into app.sync_ops (op_id, school_id, user_id, command, status)
             values (:op, private.current_school_id(), auth.uid(), 'x.y', 'applied')"""
    await act_as("hs24001")
    await conn.execute(text(sql), {"op": op})
    await act_as("hs24002")
    assert not await blocked(conn, sql, op=op)
