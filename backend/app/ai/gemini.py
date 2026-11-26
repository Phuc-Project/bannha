"""Gemini REST API client for the evening Socratic AI tutor.

Privacy & safety invariants:
- Never sends student PII (no name, username, class, room, ethnicity, or school).
- Never logs student prompts, images, model responses, or the API key.
"""

import base64
import json
import logging
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import Settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

_UNAVAILABLE = AppError("AI_UNAVAILABLE", "Gia sư đang bận, em thử lại sau ít phút nhé.", 503)

TUTOR_SYSTEM_PROMPT = (
    "Bạn là gia sư buổi tối thân thiện cho học sinh phổ thông dân tộc nội trú (chương trình "
    "GDPT 2018). Dùng tiếng Việt giản dị, gần gũi với đời sống vùng cao. "
    "QUY TẮC BẮT BUỘC:\n"
    "1. Khi action là 'ask' hoặc 'hint': KHÔNG đưa đáp án cuối cùng; chỉ giải thích khái niệm, "
    "đặt câu hỏi gợi mở từng bước để em tự nghĩ.\n"
    "2. Khi action là 'solution': trình bày lời giải từng bước dễ hiểu và kiểm tra lại đáp số.\n"
    "3. Nếu em có dấu hiệu buồn bã nặng, bị bắt nạt, bị bạo hành, tự làm hại bản thân hoặc gặp "
    "nguy hiểm: đặt distress=true và trả lời ân cần, khuyên em gặp ngay thầy cô quản sinh/y tế.\n"
    "4. Chỉ trả về JSON đúng cấu trúc: "
    '{"reply": "...", "step": "hint|question|solution|care", '
    '"topic_tag": "chủ đề ngắn dưới 60 ký tự", "distress": false}.'
)

PRACTICE_SYSTEM_PROMPT = (
    "Bạn là giáo viên biên soạn 5 câu hỏi trắc nghiệm ôn tập buổi tối theo chương trình GDPT 2018. "
    "Ngôn ngữ tiếng Việt trong sáng, gần gũi. Trả về JSON đúng cấu trúc:\n"
    '{"questions": [{"prompt": "...", "choices": ["A...", "B...", "C...", "D..."], '
    '"answer_index": 0, "explanation": "..."}]} với đúng 5 câu, mỗi câu 4 lựa chọn, '
    "answer_index từ 0 đến 3."
)


class TutorReply(BaseModel):
    reply: str = Field(min_length=1, max_length=7500)
    step: str = "hint"
    topic_tag: str | None = Field(default=None, max_length=80)
    distress: bool = False


class PracticeItem(BaseModel):
    prompt: str = Field(min_length=2, max_length=1000)
    choices: list[str] = Field(min_length=2, max_length=6)
    answer_index: int = Field(ge=0, le=5)
    explanation: str = Field(min_length=2, max_length=1500)


class _PracticeEnvelope(BaseModel):
    questions: list[PracticeItem] = Field(min_length=1, max_length=5)


def _strip_json_fence(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 3:
            cleaned = "\n".join(lines[1:-1]).strip()
    return cleaned


async def _call_gemini_json(
    http: httpx.AsyncClient,
    settings: Settings,
    *,
    system_instruction: str,
    contents: list[dict[str, Any]],
) -> dict[str, Any]:
    if settings.gemini_api_key is None:
        raise AppError("AI_NOT_CONFIGURED", "Trường chưa bật chức năng gia sư AI.", 503)

    api_key = settings.gemini_api_key.get_secret_value()
    url = f"{GEMINI_API_BASE}/{settings.gemini_model}:generateContent"
    payload: dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3,
        },
    }

    last_status = 0
    for attempt in range(2):
        try:
            res = await http.post(url, params={"key": api_key}, json=payload, timeout=25.0)
        except httpx.HTTPError as exc:
            logger.warning("Gemini network failure (attempt %s)", attempt + 1)
            if attempt == 0:
                continue
            raise _UNAVAILABLE from exc

        last_status = res.status_code
        if res.status_code == 200:
            break
        if res.status_code in (429, 500, 502, 503, 504) and attempt == 0:
            continue
        logger.warning("Gemini HTTP status %s", res.status_code)
        raise _UNAVAILABLE
    else:
        logger.warning("Gemini retries exhausted (%s)", last_status)
        raise _UNAVAILABLE

    try:
        body = res.json()
        text_part = str(body["candidates"][0]["content"]["parts"][0]["text"])
        parsed: dict[str, Any] = json.loads(_strip_json_fence(text_part))
        return parsed
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("Gemini returned malformed payload")
        raise _UNAVAILABLE from exc


async def ask_tutor(
    http: httpx.AsyncClient,
    settings: Settings,
    *,
    subject: str,
    topic_title: str | None,
    action: str,
    history: list[tuple[str, str]],
    user_text: str | None,
    image: tuple[bytes, str] | None = None,
) -> TutorReply:
    """Send anonymized turn history + current prompt to Gemini and validate TutorReply."""
    contents: list[dict[str, Any]] = []
    for role, content in history[-10:]:
        gemini_role = "user" if role == "user" else "model"
        contents.append({"role": gemini_role, "parts": [{"text": content}]})

    context_header = (
        f"[Môn: {subject}"
        + (f" | Chủ đề: {topic_title}" if topic_title else "")
        + f" | Yêu cầu: {action}]\n"
    )
    parts: list[dict[str, Any]] = [
        {"text": context_header + (user_text or "Em gửi ảnh đề bài, nhờ thầy cô hướng dẫn.")}
    ]
    if image is not None:
        raw_bytes, mime_type = image
        parts.append(
            {
                "inlineData": {
                    "mimeType": mime_type,
                    "data": base64.b64encode(raw_bytes).decode("ascii"),
                }
            }
        )
    contents.append({"role": "user", "parts": parts})

    data = await _call_gemini_json(
        http, settings, system_instruction=TUTOR_SYSTEM_PROMPT, contents=contents
    )
    try:
        return TutorReply.model_validate(data)
    except ValidationError as exc:
        raise _UNAVAILABLE from exc


async def generate_practice(
    http: httpx.AsyncClient,
    settings: Settings,
    *,
    subject: str,
    title: str,
    summary: str | None,
) -> list[PracticeItem]:
    """Generate up to 5 multiple-choice practice questions for a weekly lesson topic."""
    prompt = f"Môn: {subject}\nChủ đề tuần: {title}\nTóm tắt: {summary or 'Theo SGK GDPT 2018'}"
    data = await _call_gemini_json(
        http,
        settings,
        system_instruction=PRACTICE_SYSTEM_PROMPT,
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
    )
    try:
        envelope = _PracticeEnvelope.model_validate(data)
    except ValidationError as exc:
        raise _UNAVAILABLE from exc
    for q in envelope.questions:
        if q.answer_index >= len(q.choices):
            raise _UNAVAILABLE
    return envelope.questions
