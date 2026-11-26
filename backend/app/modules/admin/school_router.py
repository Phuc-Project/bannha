"""School-level admin endpoints: classes, dorm rooms, guardian links, QR cards, and settings."""

from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import AppSettings, Engine, UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.core.db import service_transaction
from app.core.errors import AppError
from app.modules.admin.schemas import (
    CreateClassIn,
    CreateGuardianLinkIn,
    CreateRoomIn,
    PatchSchoolIn,
    QrCardItem,
)
from app.modules.dorm.qr import sign_student_qr

router = APIRouter()

AdminUser = Annotated[CurrentUser, Depends(require_roles("admin"))]


class IdOut(BaseModel):
    id: UUID


@router.post("/classes")
async def create_class(body: CreateClassIn, user: AdminUser, conn: UserConn) -> ApiResponse[IdOut]:
    cid = uuid4()
    await conn.execute(
        text("""
            insert into app.classes (id, school_id, name, grade, school_year, homeroom_teacher_id)
            values (:id, :s, :n, :g, :sy, :t)
        """),
        {
            "id": cid,
            "s": user.school_id,
            "n": body.name,
            "g": body.grade,
            "sy": body.school_year,
            "t": body.homeroom_teacher_id,
        },
    )
    return ok(IdOut(id=cid))


@router.post("/rooms")
async def create_room(body: CreateRoomIn, user: AdminUser, conn: UserConn) -> ApiResponse[IdOut]:
    rid = uuid4()
    await conn.execute(
        text("""
            insert into app.dorm_rooms (id, school_id, building, name, capacity)
            values (:id, :s, :b, :n, :cap)
        """),
        {"id": rid, "s": user.school_id, "b": body.building, "n": body.name, "cap": body.capacity},
    )
    return ok(IdOut(id=rid))


@router.post("/guardian-links")
async def create_guardian_link(
    body: CreateGuardianLinkIn, user: AdminUser, conn: UserConn
) -> ApiResponse[IdOut]:
    lid = uuid4()
    row_id = (
        await conn.execute(
            text("""
                insert into app.guardian_links (id, school_id, parent_id, student_id, relation)
                values (:id, :s, :p, :st, :rel)
                on conflict (parent_id, student_id)
                do update set relation = excluded.relation, deleted_at = null
                returning id
            """),
            {
                "id": lid,
                "s": user.school_id,
                "p": body.parent_id,
                "st": body.student_id,
                "rel": body.relation,
            },
        )
    ).scalar_one()
    return ok(IdOut(id=row_id))


@router.get("/qr-cards")
async def qr_cards(
    user: AdminUser,
    conn: UserConn,
    settings: AppSettings,
    class_id: Annotated[UUID | None, Query()] = None,
) -> ApiResponse[list[QrCardItem]]:
    if settings.qr_signing_private_key is None:
        raise AppError("QR_KEY_NOT_CONFIGURED", "Trường chưa cấu hình khóa ký thẻ QR.", 503)

    priv = settings.qr_signing_private_key.get_secret_value()
    rows = (
        await conn.execute(
            text("""
                select p.id, p.username, p.full_name, p.avatar_path,
                       c.name as class_name, r.name as room_name
                from app.profiles p
                left join app.classes c on c.id = p.class_id
                left join app.dorm_rooms r on r.id = p.room_id
                where p.school_id = :s and 'student' = any(p.roles)
                  and p.active and p.deleted_at is null
                  and (:cid is null or p.class_id = :cid)
                order by c.name nulls last, p.full_name
            """),
            {"s": user.school_id, "cid": class_id},
        )
    ).all()
    cards = [
        QrCardItem(
            student_id=r.id,
            username=r.username,
            full_name=r.full_name,
            class_name=r.class_name,
            room_name=r.room_name,
            avatar_path=r.avatar_path,
            version=settings.qr_key_version,
            qr_token=sign_student_qr(r.id, settings.qr_key_version, priv),
        )
        for r in rows
    ]
    return ok(cards)


@router.patch("/school")
async def update_school(body: PatchSchoolIn, user: AdminUser, engine: Engine) -> ApiResponse[IdOut]:
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise AppError("EMPTY_UPDATE", "Chưa có thông tin nào để cập nhật.", 400)

    allowed = {
        "name",
        "address",
        "dorm_hotline",
        "medical_hotline",
        "meal_cancel_cutoff_hour",
    }
    sets = ", ".join(f"{col} = :{col}" for col in updates if col in allowed)
    async with service_transaction(engine) as conn:
        await conn.execute(
            text(f"update app.schools set {sets} where id = :_s"),  # noqa: S608
            {**updates, "_s": user.school_id},
        )
        await conn.execute(
            text("""
                insert into app.audit_log (school_id, actor_id, action, entity, entity_id)
                values (:s, :a, 'admin.school_updated', 'school', :s)
            """),
            {"s": user.school_id, "a": user.id},
        )
    return ok(IdOut(id=user.school_id))
