"""REST endpoints for school user management (create, CSV import, password reset, update)."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.common.deps import AppSettings, Engine, Http, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.supabase_admin import SupabaseAdmin
from app.common.users import CurrentUser
from app.core.db import service_transaction
from app.core.errors import AppError
from app.modules.admin.csv_import import import_users_csv
from app.modules.admin.schemas import (
    AdminCreateUserIn,
    AdminPatchUserIn,
    AdminUserOut,
    CsvImportIn,
    CsvImportOut,
    ResetPasswordIn,
)
from app.modules.admin.school_router import IdOut
from app.modules.admin.school_router import router as school_router
from app.modules.auth.router import password_problem

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
router.include_router(school_router)

AdminUser = Annotated[CurrentUser, Depends(require_roles("admin"))]


@router.post("/users")
async def create_user(
    body: AdminCreateUserIn,
    user: AdminUser,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[AdminUserOut]:
    pw_err = password_problem(body.temp_password, body.username)
    if pw_err:
        raise AppError("WEAK_PASSWORD", pw_err, 422)

    async with service_transaction(engine) as conn:
        exists = (
            await conn.execute(
                text("select 1 from app.profiles where username = :u"), {"u": body.username}
            )
        ).first()
        if exists is not None:
            raise AppError("USERNAME_TAKEN", "Mã đăng nhập này đã tồn tại.", 409)

    uid = await SupabaseAdmin(http, settings).create_user(body.username, body.temp_password)
    async with service_transaction(engine) as conn:
        await conn.execute(
            text("""
                insert into app.profiles
                    (id, school_id, username, full_name, roles, class_id, room_id,
                     ethnicity, phone, must_change_password, active)
                values (:id, :s, :u, :fn, :roles, :cid, :rid, :eth, :ph, true, true)
            """),
            {
                "id": uid,
                "s": user.school_id,
                "u": body.username,
                "fn": body.full_name,
                "roles": list(dict.fromkeys(body.roles)),
                "cid": body.class_id,
                "rid": body.room_id,
                "eth": body.ethnicity,
                "ph": body.phone,
            },
        )
        await conn.execute(
            text("""
                insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                values (:s, :a, 'admin.user_created', 'profile', :id)
            """),
            {"s": user.school_id, "a": user.id, "id": uid},
        )
    return ok(
        AdminUserOut(
            id=uid, username=body.username, full_name=body.full_name, roles=list(body.roles)
        )
    )


@router.post("/users/import")
async def import_users(
    body: CsvImportIn,
    user: AdminUser,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[CsvImportOut]:
    report = await import_users_csv(
        body,
        school_id=user.school_id,
        actor_id=user.id,
        engine=engine,
        admin_api=SupabaseAdmin(http, settings),
    )
    return ok(report)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: UUID,
    body: ResetPasswordIn,
    user: AdminUser,
    engine: Engine,
    http: Http,
    settings: AppSettings,
) -> ApiResponse[IdOut]:
    async with service_transaction(engine) as conn:
        target_username = (
            await conn.execute(
                text("""
                    select username from app.profiles
                    where id = :id and school_id = :s and deleted_at is null
                """),
                {"id": user_id, "s": user.school_id},
            )
        ).scalar_one_or_none()
    if target_username is None:
        raise AppError("NOT_FOUND", "Không tìm thấy tài khoản này trong trường.", 404)

    pw_err = password_problem(body.temp_password, str(target_username))
    if pw_err:
        raise AppError("WEAK_PASSWORD", pw_err, 422)

    await SupabaseAdmin(http, settings).set_password(user_id, body.temp_password)
    async with service_transaction(engine) as conn:
        await conn.execute(
            text("update app.profiles set must_change_password = true where id = :id"),
            {"id": user_id},
        )
        await conn.execute(
            text("""
                insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                values (:s, :a, 'admin.password_reset', 'profile', :id)
            """),
            {"s": user.school_id, "a": user.id, "id": user_id},
        )
    return ok(IdOut(id=user_id))


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    body: AdminPatchUserIn,
    user: AdminUser,
    engine: Engine,
) -> ApiResponse[IdOut]:
    updates: dict[str, Any] = body.model_dump(exclude_unset=True)
    if not updates:
        raise AppError("EMPTY_UPDATE", "Chưa có thông tin nào để cập nhật.", 400)
    if "roles" in updates and updates["roles"] is not None:
        updates["roles"] = list(dict.fromkeys(updates["roles"]))

    async with service_transaction(engine) as conn:
        target = (
            await conn.execute(
                text("""
                    select roles, active from app.profiles
                    where id = :id and school_id = :s and deleted_at is null
                """),
                {"id": user_id, "s": user.school_id},
            )
        ).one_or_none()
        if target is None:
            raise AppError("NOT_FOUND", "Không tìm thấy tài khoản này trong trường.", 404)

        removing_admin = (
            "admin" in target.roles
            and target.active
            and (
                ("roles" in updates and "admin" not in (updates["roles"] or []))
                or updates.get("active") is False
            )
        )
        if removing_admin:
            other_admins = int(
                (
                    await conn.execute(
                        text("""
                            select count(*) from app.profiles
                            where school_id = :s and id <> :id
                              and 'admin' = any(roles) and active and deleted_at is null
                        """),
                        {"s": user.school_id, "id": user_id},
                    )
                ).scalar_one()
            )
            if other_admins == 0:
                raise AppError(
                    "LAST_ADMIN",
                    "Không thể xóa quyền hoặc khóa quản trị viên cuối cùng của trường.",
                    409,
                )

        allowed = {"full_name", "roles", "class_id", "room_id", "ethnicity", "phone", "active"}
        sets = ", ".join(f"{col} = :{col}" for col in updates if col in allowed)
        await conn.execute(
            text(f"update app.profiles set {sets} where id = :_id and school_id = :_s"),  # noqa: S608
            {**updates, "_id": user_id, "_s": user.school_id},
        )
        await conn.execute(
            text("""
                insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                values (:s, :a, 'admin.user_updated', 'profile', :id)
            """),
            {"s": user.school_id, "a": user.id, "id": user_id},
        )
    return ok(IdOut(id=user_id))
