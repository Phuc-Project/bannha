"""REST endpoint counting real ethnicities represented in the school."""

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.common.deps import Engine, User
from app.common.schemas import ApiResponse, ok
from app.core.db import service_transaction

router = APIRouter(prefix="/api/v1/culture", tags=["culture"])


class EthnicityItem(BaseModel):
    ethnicity: str
    student_count: int


class EthnicitiesOut(BaseModel):
    total_ethnicities: int
    ethnicities: list[EthnicityItem]


@router.get("/ethnicities")
async def school_ethnicities(user: User, engine: Engine) -> ApiResponse[EthnicitiesOut]:
    async with service_transaction(engine) as conn:
        rows = (
            await conn.execute(
                text("""
                    select ethnicity, count(*)::int as student_count
                    from app.profiles
                    where school_id = :s and 'student' = any(roles)
                      and ethnicity is not null and btrim(ethnicity) <> ''
                      and active and deleted_at is null
                    group by ethnicity
                    order by student_count desc, ethnicity asc
                """),
                {"s": user.school_id},
            )
        ).all()
    items = [EthnicityItem.model_validate(r, from_attributes=True) for r in rows]
    return ok(EthnicitiesOut(total_ethnicities=len(items), ethnicities=items))
