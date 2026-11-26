"""Pydantic request and response models for the AI tutor module."""

from datetime import date, datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

TutorAction = Literal["ask", "hint", "solution"]


class UsageTodayOut(BaseModel):
    date: date
    used: int
    limit: int
    remaining: int


class CreateSessionIn(BaseModel):
    id: UUID | None = None
    subject: Annotated[str, Field(min_length=2, max_length=60)]
    lesson_topic_id: UUID | None = None


class SessionOut(BaseModel):
    id: UUID
    subject: str
    lesson_topic_id: UUID | None
    created_at: datetime


class SendMessageIn(BaseModel):
    text: Annotated[str | None, Field(max_length=4000)] = None
    image_path: str | None = None
    action: TutorAction = "ask"

    @model_validator(mode="after")
    def _non_empty(self) -> "SendMessageIn":
        if not (self.text and self.text.strip()) and not self.image_path:
            raise ValueError("Em hãy nhập câu hỏi hoặc đính kèm ảnh đề bài.")
        return self


class TutorMessageOut(BaseModel):
    user_message_id: UUID
    assistant_message_id: UUID
    reply: str
    step: str
    topic_tag: str | None
    distress: bool
    remaining_today: int


class PracticeCreateIn(BaseModel):
    lesson_topic_id: UUID


class PracticeQuestionPublic(BaseModel):
    index: int
    prompt: str
    choices: list[str]


class PracticeSetOut(BaseModel):
    id: UUID
    lesson_topic_id: UUID
    questions: list[PracticeQuestionPublic]


class PracticeAnswersIn(BaseModel):
    answers: Annotated[list[int], Field(min_length=1, max_length=5)]


class GradedQuestionOut(BaseModel):
    index: int
    selected: int
    correct_index: int
    is_correct: bool
    explanation: str


class PracticeGradeOut(BaseModel):
    id: UUID
    score: int
    total: int
    items: list[GradedQuestionOut]


class TopicStatItem(BaseModel):
    topic_tag: str
    question_count: int


class ClassTopicStatsOut(BaseModel):
    class_id: UUID
    topics: list[TopicStatItem]


class QuickHistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, Field(min_length=1, max_length=2000)]


class QuickAskIn(BaseModel):
    subject: Annotated[str, Field(min_length=2, max_length=60)]
    topic: Annotated[str | None, Field(max_length=120)] = None
    action: TutorAction = "ask"
    question: Annotated[str, Field(min_length=1, max_length=4000)]
    attempt_count: Annotated[int, Field(ge=0, le=50)] = 0
    history: Annotated[list[QuickHistoryTurn], Field(max_length=10)] = Field(default_factory=list)


class QuickAskOut(BaseModel):
    reply: str
    step: str
    distress: bool
    remaining_today: int
