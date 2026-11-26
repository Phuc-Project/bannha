-- BẢN NHÀ · rules applied to EVERY table in schema app:
--   · row level security on (no table may be left open)
--   · updated_at trigger, school guard, (school_id, updated_at, id) index for sync pulls
--   · grants: authenticated may select/insert/update (policies decide rows); never delete
--     (deletes are soft, via deleted_at, so they can be synced); anon gets nothing.

do $$
declare
  t record;
  has_updated boolean;
  has_school boolean;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'app' and c.relkind = 'r'
  loop
    execute format('alter table app.%I enable row level security', t.relname);

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'app' and table_name = t.relname and column_name = 'updated_at'
    ) into has_updated;
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'app' and table_name = t.relname and column_name = 'school_id'
    ) into has_school;

    if has_updated then
      execute format(
        'create trigger %I before update on app.%I for each row execute function private.touch_updated_at()',
        t.relname || '_touch', t.relname
      );
    end if;

    if has_school then
      execute format(
        'create trigger %I before insert or update on app.%I for each row execute function private.guard_school_id()',
        t.relname || '_school_guard', t.relname
      );
    end if;

    if has_updated and has_school then
      execute format(
        'create index if not exists %I on app.%I (school_id, updated_at, id)',
        t.relname || '_sync_idx', t.relname
      );
    end if;
  end loop;
end;
$$;

-- schools has no school_id column; index for sync on its own id.
create index if not exists schools_sync_idx on app.schools (updated_at, id);

revoke all on schema app from public, anon;
grant usage on schema app to authenticated, service_role;

revoke all on all tables in schema app from public, anon, authenticated;
grant select, insert, update on all tables in schema app to authenticated;
grant all on all tables in schema app to service_role;

-- Bookkeeping tables are written only by the backend's service role.
revoke insert, update on app.reminder_log, app.audit_log, app.qr_signing_keys, app.tutor_usage
  from authenticated;
