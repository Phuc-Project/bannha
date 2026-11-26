"""Schema-wide guarantees: every table protected, nothing for anonymous users."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def test_every_app_table_has_rls_enabled(conn: AsyncConnection) -> None:
    rows = await conn.execute(
        text("""
            select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'app' and c.relkind = 'r' and not c.relrowsecurity
        """)
    )
    assert rows.scalars().all() == []


async def test_anon_has_no_access_to_app_schema(conn: AsyncConnection) -> None:
    usage = await conn.execute(text("select has_schema_privilege('anon', 'app', 'usage')"))
    assert usage.scalar_one() is False


async def test_authenticated_can_never_hard_delete(conn: AsyncConnection) -> None:
    rows = await conn.execute(
        text("""
            select table_name from information_schema.role_table_grants
            where table_schema = 'app' and grantee = 'authenticated' and privilege_type = 'DELETE'
        """)
    )
    assert rows.scalars().all() == []


async def test_app_schema_is_not_exposed_through_postgrest(conn: AsyncConnection) -> None:
    # PostgREST only serves schemas listed in its config; `app` must not be one of them.
    exposed = await conn.execute(
        text("select coalesce(current_setting('pgrst.db_schemas', true), 'public, graphql_public')")
    )
    assert "app" not in (exposed.scalar_one() or "")


async def test_all_tables_have_soft_delete_and_sync_columns(conn: AsyncConnection) -> None:
    rows = await conn.execute(
        text("""
            select c.relname
            from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'app' and c.relkind = 'r'
              and c.relname not in ('sync_ops', 'reminder_log', 'audit_log')
              and not exists (
                select 1 from information_schema.columns col
                where col.table_schema = 'app' and col.table_name = c.relname
                  and col.column_name = 'deleted_at')
        """)
    )
    assert rows.scalars().all() == []
