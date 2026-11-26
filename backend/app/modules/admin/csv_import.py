"""CSV user import parser, validator, and batch creator for school admins."""

import csv
import io
import re
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.common.supabase_admin import SupabaseAdmin
from app.common.users import ROLES
from app.core.db import service_transaction
from app.core.errors import AppError
from app.modules.admin.schemas import CsvImportIn, CsvImportOut, CsvRowError
from app.modules.auth.router import password_problem

_USERNAME_RE = re.compile(r"^[a-z]{2,6}[0-9]{2,6}$")
_PHONE_RE = re.compile(r"^[0-9+ ]{6,20}$")
MAX_IMPORT_ROWS = 500


@dataclass(frozen=True, slots=True)
class _ParsedUserRow:
    line: int
    username: str
    full_name: str
    roles: list[str]
    password: str
    ethnicity: str | None
    phone: str | None
    class_id: UUID | None
    room_id: UUID | None


def _parse_roles(raw: str) -> list[str]:
    parts = [p.strip() for p in re.split(r"[;|,]", raw) if p.strip()]
    return list(dict.fromkeys(parts))


async def import_users_csv(
    body: CsvImportIn,
    *,
    school_id: UUID,
    actor_id: UUID,
    engine: AsyncEngine,
    admin_api: SupabaseAdmin,
) -> CsvImportOut:
    cleaned = body.csv_text.lstrip("\ufeff").strip()
    reader = csv.DictReader(io.StringIO(cleaned))
    required = {"username", "full_name", "roles"}
    fieldnames = {f.strip() for f in (reader.fieldnames or []) if f}
    if not required.issubset(fieldnames):
        missing = sorted(required - fieldnames)
        raise AppError(
            "INVALID_CSV_HEADER",
            f"File CSV thiếu cột bắt buộc: {', '.join(missing)}.",
            422,
        )

    raw_rows = list(reader)
    if len(raw_rows) > MAX_IMPORT_ROWS:
        raise AppError("CSV_TOO_MANY_ROWS", f"Mỗi lần chỉ nhập tối đa {MAX_IMPORT_ROWS} dòng.", 422)

    async with service_transaction(engine) as conn:
        existing_usernames = set(
            (await conn.execute(text("select username from app.profiles"))).scalars().all()
        )
        classes_by_name = {
            str(r.name): r.id
            for r in (
                await conn.execute(
                    text(
                        "select id, name from app.classes "
                        "where school_id = :s and deleted_at is null"
                    ),
                    {"s": school_id},
                )
            ).all()
        }
        rooms_by_name = {
            str(r.name): r.id
            for r in (
                await conn.execute(
                    text(
                        "select id, name from app.dorm_rooms "
                        "where school_id = :s and deleted_at is null"
                    ),
                    {"s": school_id},
                )
            ).all()
        }

    errors: list[CsvRowError] = []
    parsed: list[_ParsedUserRow] = []
    seen_in_file: set[str] = set()

    for idx, raw in enumerate(raw_rows, start=2):
        row = {(k or "").strip(): (v or "").strip() for k, v in raw.items()}
        uname = row.get("username", "").lower()
        fname = row.get("full_name", "")
        roles = _parse_roles(row.get("roles", ""))
        pw = row.get("password") or body.temp_password or ""
        ethnicity = row.get("ethnicity") or None
        phone = row.get("phone") or None
        cname = row.get("class_name") or row.get("class") or ""
        rname = row.get("room_name") or row.get("room") or ""

        msg = _validate_row(
            uname=uname,
            fname=fname,
            roles=roles,
            pw=pw,
            phone=phone,
            ethnicity=ethnicity,
            cname=cname,
            rname=rname,
            seen_in_file=seen_in_file,
            existing_usernames=existing_usernames,
            classes_by_name=classes_by_name,
            rooms_by_name=rooms_by_name,
        )
        if msg is not None:
            errors.append(CsvRowError(line=idx, username=uname or f"dòng {idx}", message=msg))
            continue

        seen_in_file.add(uname)
        parsed.append(
            _ParsedUserRow(
                line=idx,
                username=uname,
                full_name=fname,
                roles=roles,
                password=pw,
                ethnicity=ethnicity,
                phone=phone,
                class_id=classes_by_name.get(cname) if cname else None,
                room_id=rooms_by_name.get(rname) if rname else None,
            )
        )

    created = 0
    if not body.dry_run and not errors:
        for item in parsed:
            uid = await admin_api.create_user(item.username, item.password)
            async with service_transaction(engine) as conn:
                await conn.execute(
                    text("""
                        insert into app.profiles
                            (id, school_id, username, full_name, roles, ethnicity, phone,
                             class_id, room_id, must_change_password, active)
                        values (:id, :s, :u, :fn, :roles, :eth, :ph, :cid, :rid, true, true)
                    """),
                    {
                        "id": uid,
                        "s": school_id,
                        "u": item.username,
                        "fn": item.full_name,
                        "roles": item.roles,
                        "eth": item.ethnicity,
                        "ph": item.phone,
                        "cid": item.class_id,
                        "rid": item.room_id,
                    },
                )
            created += 1
        async with service_transaction(engine) as conn:
            await conn.execute(
                text("""
                    insert into app.audit_log (school_id, actor_id, action, entity)
                    values (:s, :a, 'admin.users_imported', 'profile')
                """),
                {"s": school_id, "a": actor_id},
            )

    return CsvImportOut(
        dry_run=body.dry_run,
        total_rows=len(raw_rows),
        valid_rows=len(parsed),
        created_count=created,
        errors=errors,
    )


def _validate_row(
    *,
    uname: str,
    fname: str,
    roles: list[str],
    pw: str,
    phone: str | None,
    ethnicity: str | None,
    cname: str,
    rname: str,
    seen_in_file: set[str],
    existing_usernames: set[str],
    classes_by_name: dict[str, UUID],
    rooms_by_name: dict[str, UUID],
) -> str | None:
    if not _USERNAME_RE.match(uname):
        return "Mã đăng nhập không hợp lệ (2–6 chữ thường kèm 2–6 chữ số)."
    if uname in seen_in_file:
        return "Mã đăng nhập bị trùng trong file CSV."
    if uname in existing_usernames:
        return "Mã đăng nhập đã tồn tại trên hệ thống."
    if not (2 <= len(fname) <= 120):
        return "Họ tên cần từ 2 đến 120 ký tự."
    if not roles or any(r not in ROLES for r in roles):
        return "Vai trò không hợp lệ."
    pw_err = password_problem(pw, uname)
    if pw_err:
        return pw_err
    if phone and not _PHONE_RE.match(phone):
        return "Số điện thoại không đúng định dạng."
    if ethnicity and len(ethnicity) > 40:
        return "Tên dân tộc tối đa 40 ký tự."
    if cname and cname not in classes_by_name:
        return f"Lớp '{cname}' chưa có trong trường."
    if rname and rname not in rooms_by_name:
        return f"Phòng '{rname}' chưa có trong trường."
    return None
