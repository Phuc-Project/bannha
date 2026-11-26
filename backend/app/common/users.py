"""The signed-in user as the backend sees them (always loaded from app.profiles)."""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.core.errors import AppError, AuthError, ForbiddenError

ROLES = ("student", "teacher", "dorm_staff", "medical_staff", "kitchen_staff", "parent", "admin")
STAFF_ROLES = frozenset({"teacher", "dorm_staff", "medical_staff", "kitchen_staff", "admin"})


@dataclass(frozen=True, slots=True)
class CurrentUser:
    id: UUID
    school_id: UUID
    username: str
    full_name: str
    roles: tuple[str, ...]
    active_role: str
    must_change_password: bool

    def has(self, *roles: str) -> bool:
        return any(role in self.roles for role in roles)

    @property
    def is_staff(self) -> bool:
        return not STAFF_ROLES.isdisjoint(self.roles)


async def load_current_user(conn: AsyncConnection, requested_role: str | None) -> CurrentUser:
    row = (
        await conn.execute(
            text("""
                select id, school_id, username, full_name, roles, must_change_password, active,
                       deleted_at is not null as deleted
                from app.profiles where id = auth.uid()
            """)
        )
    ).one_or_none()
    if row is None or row.deleted:
        raise AuthError("NO_PROFILE", "Tài khoản chưa được nhà trường kích hoạt.")
    if not row.active:
        raise AppError(
            "ACCOUNT_LOCKED", "Tài khoản đang bị khóa. Hãy liên hệ thầy cô quản trị trường.", 403
        )

    roles = tuple(row.roles)
    if requested_role is None:
        active = roles[0]
    elif requested_role in roles:
        active = requested_role
    else:
        raise ForbiddenError("Tài khoản không có vai trò này.")

    return CurrentUser(
        id=row.id,
        school_id=row.school_id,
        username=row.username,
        full_name=row.full_name,
        roles=roles,
        active_role=active,
        must_change_password=row.must_change_password,
    )
