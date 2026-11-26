"""Pydantic schemas for school administration endpoints."""

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field

RoleName = Literal[
    "student",
    "teacher",
    "dorm_staff",
    "medical_staff",
    "kitchen_staff",
    "parent",
    "admin",
]


class AdminCreateUserIn(BaseModel):
    username: Annotated[str, Field(pattern=r"^[a-z]{2,6}[0-9]{2,6}$")]
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    temp_password: Annotated[str, Field(min_length=8, max_length=128)]
    roles: Annotated[list[RoleName], Field(min_length=1, max_length=5)]
    class_id: UUID | None = None
    room_id: UUID | None = None
    ethnicity: Annotated[str | None, Field(max_length=40)] = None
    phone: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None


class AdminUserOut(BaseModel):
    id: UUID
    username: str
    full_name: str
    roles: list[str]


class CsvImportIn(BaseModel):
    csv_text: Annotated[str, Field(min_length=5, max_length=500_000)]
    temp_password: Annotated[str | None, Field(min_length=8, max_length=128)] = None
    dry_run: bool = True


class CsvRowError(BaseModel):
    line: int
    username: str
    message: str


class CsvImportOut(BaseModel):
    dry_run: bool
    total_rows: int
    valid_rows: int
    created_count: int
    errors: list[CsvRowError]


class ResetPasswordIn(BaseModel):
    temp_password: Annotated[str, Field(min_length=8, max_length=128)]


class AdminPatchUserIn(BaseModel):
    full_name: Annotated[str | None, Field(min_length=2, max_length=120)] = None
    roles: Annotated[list[RoleName] | None, Field(min_length=1, max_length=5)] = None
    class_id: UUID | None = None
    room_id: UUID | None = None
    ethnicity: Annotated[str | None, Field(max_length=40)] = None
    phone: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None
    active: bool | None = None


class CreateClassIn(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=20)]
    grade: Annotated[int, Field(ge=6, le=12)]
    school_year: Annotated[str, Field(pattern=r"^[0-9]{4}-[0-9]{4}$")]
    homeroom_teacher_id: UUID | None = None


class CreateRoomIn(BaseModel):
    building: Annotated[str, Field(min_length=1, max_length=40)]
    name: Annotated[str, Field(min_length=1, max_length=40)]
    capacity: Annotated[int, Field(ge=1, le=40)] = 8


class CreateGuardianLinkIn(BaseModel):
    parent_id: UUID
    student_id: UUID
    relation: Literal["father", "mother", "grandparent", "sibling", "guardian"] = "guardian"


class QrCardItem(BaseModel):
    student_id: UUID
    username: str
    full_name: str
    class_name: str | None
    room_name: str | None
    avatar_path: str | None
    version: int
    qr_token: str


class PatchSchoolIn(BaseModel):
    name: Annotated[str | None, Field(min_length=2, max_length=200)] = None
    address: Annotated[str | None, Field(max_length=500)] = None
    dorm_hotline: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None
    medical_hotline: Annotated[str | None, Field(pattern=r"^[0-9+ ]{6,20}$")] = None
    meal_cancel_cutoff_hour: Annotated[int | None, Field(ge=0, le=23)] = None
