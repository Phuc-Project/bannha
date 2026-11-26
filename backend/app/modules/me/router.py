"""GET /api/v1/me — who am I, which school, my children/classes, school hotlines."""

from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import UserAnyState, UserConn
from app.common.schemas import ApiResponse, ok

router = APIRouter(prefix="/api/v1", tags=["me"])


class SchoolInfo(BaseModel):
    id: UUID
    name: str
    dorm_hotline: str | None
    medical_hotline: str | None
    meal_cancel_cutoff_hour: int


class ClassRef(BaseModel):
    id: UUID
    name: str
    grade: int


class ChildInfo(BaseModel):
    id: UUID
    full_name: str
    class_name: str | None
    room_name: str | None


class MeOut(BaseModel):
    id: UUID
    username: str
    full_name: str
    roles: list[str]
    active_role: str
    must_change_password: bool
    ethnicity: str | None
    phone: str | None
    class_info: ClassRef | None
    room_name: str | None
    school: SchoolInfo
    children: list[ChildInfo]
    homeroom_classes: list[ClassRef]


_PROFILE = text("""
    select p.ethnicity, p.phone, r.name as room_name,
           c.id as class_id, c.name as class_name, c.grade as class_grade
    from app.profiles p
    left join app.dorm_rooms r on r.id = p.room_id
    left join app.classes c on c.id = p.class_id
    where p.id = auth.uid()
""")
_SCHOOL = text("""
    select id, name, dorm_hotline, medical_hotline, meal_cancel_cutoff_hour
    from app.schools where id = private.current_school_id()
""")
_CHILDREN = text("""
    select s.id, s.full_name, c.name as class_name, r.name as room_name
    from app.guardian_links g
    join app.profiles s on s.id = g.student_id
    left join app.classes c on c.id = s.class_id
    left join app.dorm_rooms r on r.id = s.room_id
    where g.parent_id = auth.uid() and g.deleted_at is null
    order by s.full_name
""")
_HOMEROOM = text("""
    select id, name, grade from app.classes
    where homeroom_teacher_id = auth.uid() and deleted_at is null order by name
""")


@router.get("/me")
async def me(user: UserAnyState, conn: UserConn) -> ApiResponse[MeOut]:
    profile = (await conn.execute(_PROFILE)).one()
    school = (await conn.execute(_SCHOOL)).one()
    children = (await conn.execute(_CHILDREN)).all() if user.has("parent") else []
    homeroom = (await conn.execute(_HOMEROOM)).all() if user.has("teacher") else []

    class_info = (
        ClassRef(id=profile.class_id, name=profile.class_name, grade=profile.class_grade)
        if profile.class_id
        else None
    )
    return ok(
        MeOut(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            roles=list(user.roles),
            active_role=user.active_role,
            must_change_password=user.must_change_password,
            ethnicity=profile.ethnicity,
            phone=profile.phone,
            class_info=class_info,
            room_name=profile.room_name,
            school=SchoolInfo.model_validate(school, from_attributes=True),
            children=[ChildInfo.model_validate(c, from_attributes=True) for c in children],
            homeroom_classes=[ClassRef.model_validate(c, from_attributes=True) for c in homeroom],
        )
    )
