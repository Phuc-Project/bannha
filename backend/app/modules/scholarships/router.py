"""REST endpoints for admin scholarship/article management and student RIASEC career results."""

import json
from datetime import date
from typing import Annotated, Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.common.deps import UserConn, require_roles
from app.common.schemas import ApiResponse, ok
from app.common.users import CurrentUser
from app.core.errors import AppError
from app.modules.scholarships.career import score_riasec

router = APIRouter(prefix="/api/v1", tags=["scholarships"])

ArticleCategory = Literal["admission_policy", "career", "guide"]


class ScholarshipIn(BaseModel):
    title: Annotated[str, Field(min_length=2, max_length=200)]
    provider: Annotated[str, Field(min_length=2, max_length=200)]
    amount_text: Annotated[str | None, Field(max_length=120)] = None
    eligibility: Annotated[str, Field(min_length=2, max_length=3000)]
    for_ethnic_minority: bool = False
    grades: list[Annotated[int, Field(ge=6, le=12)]] = Field(default_factory=list)
    deadline: date | None = None
    apply_link: Annotated[str | None, Field(pattern=r"^https://")] = None


class ScholarshipPatchIn(BaseModel):
    title: Annotated[str | None, Field(min_length=2, max_length=200)] = None
    provider: Annotated[str | None, Field(min_length=2, max_length=200)] = None
    amount_text: Annotated[str | None, Field(max_length=120)] = None
    eligibility: Annotated[str | None, Field(min_length=2, max_length=3000)] = None
    for_ethnic_minority: bool | None = None
    grades: list[Annotated[int, Field(ge=6, le=12)]] | None = None
    deadline: date | None = None
    apply_link: Annotated[str | None, Field(pattern=r"^https://")] = None


class IdOut(BaseModel):
    id: UUID


class ArticleIn(BaseModel):
    category: ArticleCategory
    title: Annotated[str, Field(min_length=2, max_length=200)]
    body_md: Annotated[str, Field(min_length=1, max_length=50000)]
    published: bool = False


class ArticlePatchIn(BaseModel):
    category: ArticleCategory | None = None
    title: Annotated[str | None, Field(min_length=2, max_length=200)] = None
    body_md: Annotated[str | None, Field(min_length=1, max_length=50000)] = None
    published: bool | None = None


class CareerResultsIn(BaseModel):
    answers: dict[str, Any] | list[Any]


class CareerGroupItem(BaseModel):
    code: str
    name: str
    score: int
    suggested_majors: list[str]


class CareerResultsOut(BaseModel):
    id: UUID
    scores: dict[str, int]
    top_groups: list[str]
    groups: list[CareerGroupItem]
    disclaimer: str


@router.post("/scholarships")
async def create_scholarship(
    body: ScholarshipIn,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    conn: UserConn,
) -> ApiResponse[IdOut]:
    sid = uuid4()
    await conn.execute(
        text("""
            insert into app.scholarships
                (id, school_id, title, provider, amount_text, eligibility,
                 for_ethnic_minority, grades, deadline, apply_link, created_by)
            values (:id, :s, :t, :p, :amt, :el, :eth, :gr, :dl, :lnk, :u)
        """),
        {
            "id": sid,
            "s": user.school_id,
            "t": body.title,
            "p": body.provider,
            "amt": body.amount_text,
            "el": body.eligibility,
            "eth": body.for_ethnic_minority,
            "gr": body.grades,
            "dl": body.deadline,
            "lnk": body.apply_link,
            "u": user.id,
        },
    )
    return ok(IdOut(id=sid))


@router.patch("/scholarships/{scholarship_id}")
async def update_scholarship(
    scholarship_id: UUID,
    body: ScholarshipPatchIn,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    conn: UserConn,
) -> ApiResponse[IdOut]:
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise AppError("EMPTY_UPDATE", "Chưa có thông tin nào để cập nhật.", 400)

    allowed_cols = {
        "title",
        "provider",
        "amount_text",
        "eligibility",
        "for_ethnic_minority",
        "grades",
        "deadline",
        "apply_link",
    }
    sets = ", ".join(f"{col} = :{col}" for col in updates if col in allowed_cols)
    res = await conn.execute(
        text(
            f"update app.scholarships set {sets} "  # noqa: S608
            "where id = :_id and school_id = :_s and deleted_at is null"
        ),
        {**updates, "_id": scholarship_id, "_s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy học bổng này.", 404)
    return ok(IdOut(id=scholarship_id))


@router.delete("/scholarships/{scholarship_id}")
async def delete_scholarship(
    scholarship_id: UUID,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    conn: UserConn,
) -> ApiResponse[IdOut]:
    res = await conn.execute(
        text("""
            update app.scholarships set deleted_at = now()
            where id = :id and school_id = :s and deleted_at is null
        """),
        {"id": scholarship_id, "s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy học bổng này.", 404)
    return ok(IdOut(id=scholarship_id))


@router.post("/articles")
async def create_article(
    body: ArticleIn,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    conn: UserConn,
) -> ApiResponse[IdOut]:
    aid = uuid4()
    await conn.execute(
        text("""
            insert into app.articles
                (id, school_id, category, title, body_md, published, created_by)
            values (:id, :s, :cat, :t, :b, :pub, :u)
        """),
        {
            "id": aid,
            "s": user.school_id,
            "cat": body.category,
            "t": body.title,
            "b": body.body_md,
            "pub": body.published,
            "u": user.id,
        },
    )
    return ok(IdOut(id=aid))


@router.patch("/articles/{article_id}")
async def update_article(
    article_id: UUID,
    body: ArticlePatchIn,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    conn: UserConn,
) -> ApiResponse[IdOut]:
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise AppError("EMPTY_UPDATE", "Chưa có thông tin nào để cập nhật.", 400)

    allowed_cols = {"category", "title", "body_md", "published"}
    sets = ", ".join(f"{col} = :{col}" for col in updates if col in allowed_cols)
    res = await conn.execute(
        text(
            f"update app.articles set {sets} "  # noqa: S608
            "where id = :_id and school_id = :_s and deleted_at is null"
        ),
        {**updates, "_id": article_id, "_s": user.school_id},
    )
    if res.rowcount == 0:
        raise AppError("NOT_FOUND", "Không tìm thấy bài viết này.", 404)
    return ok(IdOut(id=article_id))


@router.post("/career/results")
async def submit_career_results(
    body: CareerResultsIn,
    user: Annotated[CurrentUser, Depends(require_roles("student"))],
    conn: UserConn,
) -> ApiResponse[CareerResultsOut]:
    scored = score_riasec(body.answers)
    rid = uuid4()
    await conn.execute(
        text("""
            insert into app.career_results (id, school_id, student_id, answers, top_groups)
            values (:id, :s, :u, cast(:ans as jsonb), :top)
        """),
        {
            "id": rid,
            "s": user.school_id,
            "u": user.id,
            "ans": json.dumps(body.answers, ensure_ascii=False),
            "top": scored.top_groups,
        },
    )
    return ok(
        CareerResultsOut(
            id=rid,
            scores=scored.scores,
            top_groups=scored.top_groups,
            groups=[CareerGroupItem.model_validate(g, from_attributes=True) for g in scored.groups],
            disclaimer=scored.disclaimer,
        )
    )
