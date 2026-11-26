"""Who sees whom: profiles, guardians, cross-school isolation, profile guards."""

from collections.abc import Awaitable, Callable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from tests.db.conftest import ActAs, blocked, count, sid, uid

PROFILES = "select count(*) from app.profiles"


async def test_student_sees_self_and_own_parent_only(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("hs24001")
    rows = await conn.execute(text("select username from app.profiles order by username"))
    assert rows.scalars().all() == ["hs24001", "ph02"]


async def test_parent_sees_own_children_only(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("ph01")
    rows = await conn.execute(text("select username from app.profiles order by username"))
    assert rows.scalars().all() == ["hs24007", "hs24011", "ph01"]


async def test_staff_see_the_whole_school(conn: AsyncConnection, act_as: ActAs) -> None:
    await act_as("gv02")
    assert await count(conn, PROFILES) == 22


async def test_directory_gives_names_without_contact_fields(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24001")
    assert await count(conn, "select count(*) from app.directory") == 22
    cols = await conn.execute(
        text(
            "select column_name from information_schema.columns where table_schema='app' and table_name='directory'"
        )
    )
    assert {"phone", "ethnicity", "room_id"}.isdisjoint(set(cols.scalars().all()))


async def test_student_can_edit_phone_but_not_roles_or_class(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24001")
    me = uid("hs24001")
    assert not await blocked(
        conn, "update app.profiles set phone = '0912345678' where id = :id", id=me
    )
    assert await blocked(conn, "update app.profiles set roles = '{admin}' where id = :id", id=me)
    assert await blocked(
        conn, "update app.profiles set must_change_password = false where id = :id", id=me
    )
    assert await blocked(
        conn, "update app.profiles set phone = '0900000000' where id = :id", id=uid("hs24002")
    )


async def test_guardian_links_visible_to_family_and_staff_only(
    conn: AsyncConnection, act_as: ActAs
) -> None:
    await act_as("hs24002")
    assert await count(conn, "select count(*) from app.guardian_links") == 0
    await act_as("ph01")
    assert await count(conn, "select count(*) from app.guardian_links") == 2
    await act_as("qs01")
    assert await count(conn, "select count(*) from app.guardian_links") == 3


async def test_schools_are_isolated(
    conn: AsyncConnection, act_as: ActAs, act_as_system: Callable[[], Awaitable[None]]
) -> None:
    await act_as_system()
    other_school = sid("other-school")
    other_admin = sid("other-admin")
    await conn.execute(
        text("insert into app.schools (id, name, code) values (:id, 'Trường khác', 'truong-khac')"),
        {"id": other_school},
    )
    await conn.execute(
        text(
            "insert into auth.users (id, aud, role, email) values (:id, 'authenticated', 'authenticated', 'ad99@x.internal')"
        ),
        {"id": other_admin},
    )
    await conn.execute(
        text("""insert into app.profiles (id, school_id, username, full_name, roles)
                values (:id, :s, 'ad99', 'Quản trị khác', '{admin}')"""),
        {"id": other_admin, "s": other_school},
    )
    await conn.execute(
        text(
            "insert into app.menus (school_id, date, meal, dishes) values (:s, current_date, 'lunch', '{Cơm}')"
        ),
        {"s": other_school},
    )

    await act_as("gv02")  # staff of school 1 see nothing of school 2
    assert (
        await count(conn, "select count(*) from app.profiles where school_id = :s", s=other_school)
        == 0
    )
    assert (
        await count(conn, "select count(*) from app.menus where school_id = :s", s=other_school)
        == 0
    )

    # The other school's admin cannot read school 1 or write into it.
    await conn.exec_driver_sql("reset role")
    await conn.execute(
        text("select set_config('request.jwt.claims', :c, true)"),
        {"c": f'{{"sub": "{other_admin}", "role": "authenticated"}}'},
    )
    await conn.exec_driver_sql("set local role authenticated")
    assert await count(conn, PROFILES) == 1
    assert await count(conn, "select count(*) from app.menus") == 1
    assert await blocked(
        conn,
        "insert into app.menus (school_id, date, meal) values (:s, current_date + 30, 'dinner')",
        s=sid("school"),
    )
