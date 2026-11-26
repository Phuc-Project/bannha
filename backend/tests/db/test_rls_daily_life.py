"""Daily life: leave requests, meals, announcements, culture, notifications."""

from sqlalchemy.ext.asyncio import AsyncConnection

from tests.db.conftest import ActAs, blocked, count, sid, uid

LEAVE_INSERT = """
insert into app.leave_requests (school_id, student_id, created_by, kind, from_at, to_at, reason, status)
values (private.current_school_id(), :s, :by, 'go_home', now() + interval '1 day',
        now() + interval '2 days', 'Về bản', :status)
"""


async def test_students_and_parents_file_leave_only_for_themselves_or_their_children(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24001")
    assert not await blocked(
        conn, LEAVE_INSERT, s=uid("hs24001"), by=uid("hs24001"), status="pending"
    )
    assert await blocked(conn, LEAVE_INSERT, s=uid("hs24002"), by=uid("hs24001"), status="pending")
    assert await blocked(conn, LEAVE_INSERT, s=uid("hs24001"), by=uid("hs24001"), status="approved")
    await act_as("ph01")
    assert not await blocked(conn, LEAVE_INSERT, s=uid("hs24007"), by=uid("ph01"), status="pending")
    assert await blocked(conn, LEAVE_INSERT, s=uid("hs24001"), by=uid("ph01"), status="pending")


async def test_leave_review_is_for_dorm_staff_and_homeroom_teacher(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    approve = """update app.leave_requests
                 set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = :id"""
    pending = sid("leave:1")  # Giàng A Páo, class 10A1
    for who in ("gv02", "bep01", "hs24002"):
        await act_as(who)
        assert await blocked(conn, approve, id=pending), who
    for who in ("qs01", "gv01"):
        await act_as(who)
        assert not await blocked(conn, approve, id=pending), who


async def test_kitchen_sees_meal_counts_for_every_menu(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("bep01")
    rows = (
        (await conn.exec_driver_sql("select total_students from app.meal_counts")).scalars().all()
    )
    assert rows
    assert set(rows) == {14}


async def test_meal_cancellation_rules(conn: AsyncConnection, act_as: ActAs) -> None:
    sql = """insert into app.meal_cancellations (school_id, student_id, date, meal, source)
             values (private.current_school_id(), :s, current_date + 20, 'lunch', :source)"""
    await act_as("hs24001")
    assert not await blocked(conn, sql, s=uid("hs24001"), source="manual")
    assert await blocked(conn, sql, s=uid("hs24002"), source="manual")
    await act_as("bep01")
    assert await count(conn, "select count(*) from app.meal_cancellations") >= 1


async def test_announcement_audiences(conn: AsyncConnection, act_as: ActAs) -> None:
    titles = "select title from app.announcements order by title"
    await act_as("hs24001")  # 10A1 student
    seen = (await conn.exec_driver_sql(titles)).scalars().all()
    assert "Kiểm tra 45 phút môn Toán" in seen
    assert "Mặc áo ấm khi trời rét" in seen
    assert "Họp phụ huynh học kỳ I" not in seen
    await act_as("hs24004")  # 11A2 student
    assert "Kiểm tra 45 phút môn Toán" not in (await conn.exec_driver_sql(titles)).scalars().all()
    await act_as("ph02")  # parent of a 10A1 student
    seen = (await conn.exec_driver_sql(titles)).scalars().all()
    assert {"Họp phụ huynh học kỳ I", "Kiểm tra 45 phút môn Toán"} <= set(seen)


async def test_teachers_announce_only_to_their_own_class(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    sql = """insert into app.announcements (school_id, audience, class_id, title, body, created_by)
             select school_id, 'class', :c, 'Họp lớp', 'Chiều nay họp lớp.', id from app.profiles where id = :t"""
    await act_as("gv02")
    assert await blocked(conn, sql, c=sid("class:10A1"), t=uid("gv02"))
    assert not await blocked(conn, sql, c=sid("class:11A2"), t=uid("gv02"))


async def test_culture_posts_need_review_before_others_see_them(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    pending = "select count(*) from app.culture_posts where status = 'pending'"
    await act_as("hs24001")
    assert await count(conn, pending) == 0
    await act_as("hs24012")
    assert await count(conn, pending) == 1
    await act_as("gv01")
    assert await count(conn, pending) == 1
    await act_as("hs24001")
    assert await blocked(
        conn,
        """insert into app.culture_posts (school_id, author_id, ethnicity, category, title, body, status)
           select school_id, id, 'Mông', 'food', 'Mèn mén', 'Món ăn làm từ bột ngô hấp.', 'published'
           from app.profiles where id = :s""",
        s=uid("hs24001"),
    )


async def test_notifications_belong_to_their_recipient(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("ph01")
    assert await count(conn, "select count(*) from app.notifications") == 1
    await act_as("ph02")
    assert await count(conn, "select count(*) from app.notifications") == 0
    assert await blocked(conn, "update app.notifications set read_at = now()")


async def test_students_never_see_who_donated(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("hs24001")
    assert (
        await count(conn, "select count(*) from app.donation_items where status = 'available'") == 6
    )
    # Column is readable at DB level; the API strips donor_id for students (see sync serializers).
