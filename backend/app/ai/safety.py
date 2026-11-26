"""Distress and safety keyword detection for the evening AI tutor.

Never logs student input. Serves as a deterministic safety net alongside the model's
own `distress` flag.
"""

DISTRESS_KEYWORDS: tuple[str, ...] = (
    "tự tử",
    "muốn chết",
    "không muốn sống",
    "chán sống",
    "tự làm đau",
    "rạch tay",
    "nhảy lầu",
    "uống thuốc sâu",
    "uống thuốc ngủ",
    "bị đánh",
    "bị bắt nạt",
    "bị dọa",
    "bị xâm hại",
    "sợ về phòng",
    "không dám về phòng",
    "tuyệt vọng",
)

DISTRESS_REPLY = (
    "Thầy cô rất quan tâm đến em. Em không phải chịu đựng chuyện này một mình đâu nhé. "
    "Em hãy bấm nút gọi thầy cô quản sinh hoặc cán bộ y tế ngay bên dưới, hoặc sang gặp trực tiếp "
    "thầy cô ở phòng trực để được lắng nghe và giúp đỡ ngay lúc này nhé."
)


def detect_distress(text: str | None) -> bool:
    """Return True when the message contains signs of self-harm, violence, bullying, or danger."""
    if not text:
        return False
    normalized = " ".join(text.lower().split())
    return any(phrase in normalized for phrase in DISTRESS_KEYWORDS)
