"""Pure RIASEC career-interest scoring and suggestions tailored for boarding students."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from app.core.errors import AppError

RIASEC_ORDER: tuple[str, ...] = ("R", "I", "A", "S", "E", "C")

CAREER_INFO: dict[str, tuple[str, list[str]]] = {
    "R": (
        "Thực tế – Kỹ thuật",
        ["Kỹ thuật điện – cơ khí", "Nông – lâm nghiệp công nghệ cao", "Xây dựng dân dụng"],
    ),
    "I": (
        "Nghiên cứu – Khoa học",
        ["Y – Dược tuyến cơ sở", "Công nghệ thông tin", "Thú y & bảo vệ thực vật"],
    ),
    "A": (
        "Nghệ thuật – Sáng tạo",
        ["Thiết kế đồ họa – truyền thông", "Bảo tồn văn hóa – thổ cẩm", "Âm nhạc – mỹ thuật"],
    ),
    "S": (
        "Xã hội – Cộng đồng",
        ["Sư phạm vùng cao", "Điều dưỡng – y tế học đường", "Công tác xã hội"],
    ),
    "E": (
        "Quản lý – Khởi nghiệp",
        ["Du lịch cộng đồng (homestay)", "Hợp tác xã nông sản bản làng", "Quản trị kinh doanh"],
    ),
    "C": (
        "Nghiệp vụ – Tổ chức",
        ["Kế toán – tài chính xã", "Hành chính – văn thư", "Thống kê – kho vận"],
    ),
}

DISCLAIMER = (
    "Kết quả mang tính tham khảo để em hiểu thêm sở thích của mình. "
    "Em hãy trao đổi cùng thầy cô chủ nhiệm và gia đình trước khi chọn ngành nhé."
)


@dataclass(frozen=True, slots=True)
class CareerGroupOut:
    code: str
    name: str
    score: int
    suggested_majors: list[str]


@dataclass(frozen=True, slots=True)
class RiasecScoreResult:
    scores: dict[str, int]
    top_groups: list[str]
    groups: list[CareerGroupOut]
    disclaimer: str


def score_riasec(
    answers: Mapping[str, Any] | Sequence[Any],
) -> RiasecScoreResult:
    """Score RIASEC answers from a group map, question map (`q1`..`q30`), or item sequence."""
    totals: dict[str, int] = {code: 0 for code in RIASEC_ORDER}

    if isinstance(answers, Mapping):
        if not answers:
            raise AppError("INVALID_ANSWERS", "Bài trắc nghiệm chưa có câu trả lời.")
        upper_keys = {str(k).upper() for k in answers}
        if upper_keys <= set(RIASEC_ORDER):
            for k, v in answers.items():
                totals[str(k).upper()] += _as_score(v)
        else:
            for k, v in answers.items():
                digits = "".join(ch for ch in str(k) if ch.isdigit())
                if not digits:
                    raise AppError("INVALID_ANSWERS", "Mã câu hỏi không hợp lệ.")
                idx = max(0, int(digits) - 1) % 6
                totals[RIASEC_ORDER[idx]] += _as_score(v)
    elif isinstance(answers, Sequence) and not isinstance(answers, (str, bytes)):
        if len(answers) == 0:
            raise AppError("INVALID_ANSWERS", "Bài trắc nghiệm chưa có câu trả lời.")
        for idx, item in enumerate(answers):
            if isinstance(item, Mapping):
                grp = str(item.get("group", "")).upper()
                if grp not in totals:
                    raise AppError("INVALID_ANSWERS", "Nhóm RIASEC không hợp lệ.")
                raw_val = item.get("score", item.get("value", 0))
                totals[grp] += _as_score(raw_val)
            elif isinstance(item, str) and item.upper() in totals:
                totals[item.upper()] += 1
            else:
                totals[RIASEC_ORDER[idx % 6]] += _as_score(item)
    else:
        raise AppError("INVALID_ANSWERS", "Dữ liệu câu trả lời không đúng định dạng.")

    ranked = sorted(RIASEC_ORDER, key=lambda code: (-totals[code], RIASEC_ORDER.index(code)))
    top_three = list(ranked[:3])
    group_details = [
        CareerGroupOut(
            code=code,
            name=CAREER_INFO[code][0],
            score=totals[code],
            suggested_majors=list(CAREER_INFO[code][1]),
        )
        for code in top_three
    ]
    return RiasecScoreResult(
        scores=totals,
        top_groups=top_three,
        groups=group_details,
        disclaimer=DISCLAIMER,
    )


def _as_score(value: Any) -> int:
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, (int, float)):
        ival = int(value)
        if ival < 0 or ival > 100:
            raise AppError("INVALID_ANSWERS", "Điểm câu trả lời nằm ngoài phạm vi cho phép.")
        return ival
    raise AppError("INVALID_ANSWERS", "Giá trị câu trả lời không hợp lệ.")
