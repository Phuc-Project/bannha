"""Pure greedy 1-to-1 matching algorithm for the second-hand item bank.

Scoring rules:
- Different category -> disqualified.
- Base score: +50 (same category).
- +25 if matching grade (books) or matching size (clothes).
- +15 if `winter_clothes` and Vietnam month in `{10, 11, 12, 1, 2}`.
- `+min(10, wait_days)` by request waiting days.
- +10 if request pinned `item_id == item.id`.
- Tie-breakers: condition (`like_new > good > used`), then earlier `created_at`, then UUID.
- Greedy 1-to-1 assignment (each item & each open request matched at most once).
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.core.timezone import to_vn, vn_now

WINTER_MONTHS: frozenset[int] = frozenset({10, 11, 12, 1, 2})
CONDITION_RANK: dict[str, int] = {"like_new": 3, "good": 2, "used": 1}


@dataclass(frozen=True, slots=True)
class MatchableItem:
    id: UUID
    category: str
    title: str
    grade: int | None
    size: str | None
    condition: str


@dataclass(frozen=True, slots=True)
class MatchableRequest:
    id: UUID
    requester_id: UUID
    category: str
    item_id: UUID | None
    grade: int | None
    size: str | None
    created_at: datetime
    requester_name: str = ""


@dataclass(frozen=True, slots=True)
class MatchSuggestion:
    item_id: UUID
    request_id: UUID
    requester_id: UUID
    score: int
    item_title: str
    condition: str
    requester_name: str


def score_pair(item: MatchableItem, req: MatchableRequest, now: datetime) -> int | None:
    """Compute compatibility score between an available item and an open request."""
    if item.category != req.category:
        return None

    ref_now = to_vn(now)
    score = 50

    grade_match = item.grade is not None and req.grade is not None and item.grade == req.grade
    size_match = item.size is not None and req.size is not None and item.size == req.size
    if grade_match or size_match:
        score += 25

    if item.category == "winter_clothes" and ref_now.month in WINTER_MONTHS:
        score += 15

    wait_seconds = (ref_now - to_vn(req.created_at)).total_seconds()
    wait_days = max(0, int(wait_seconds // 86_400))
    score += min(10, wait_days)

    if req.item_id is not None and req.item_id == item.id:
        score += 10

    return score


def suggest_matches(
    items: Sequence[MatchableItem],
    requests: Sequence[MatchableRequest],
    now: datetime | None = None,
) -> list[MatchSuggestion]:
    """Return greedy 1-to-1 match suggestions ordered from highest to lowest score."""
    ref_now = now if now is not None else vn_now()
    candidates: list[tuple[int, int, float, str, str, MatchableItem, MatchableRequest]] = []

    for item in items:
        cond_rank = CONDITION_RANK.get(item.condition, 0)
        for req in requests:
            sc = score_pair(item, req, ref_now)
            if sc is not None:
                req_ts = to_vn(req.created_at).timestamp()
                candidates.append((-sc, -cond_rank, req_ts, str(item.id), str(req.id), item, req))

    candidates.sort()
    used_items: set[UUID] = set()
    used_requests: set[UUID] = set()
    chosen: list[MatchSuggestion] = []

    for neg_score, _neg_cond, _req_ts, _iid, _rid, item, req in candidates:
        if item.id in used_items or req.id in used_requests:
            continue
        used_items.add(item.id)
        used_requests.add(req.id)
        chosen.append(
            MatchSuggestion(
                item_id=item.id,
                request_id=req.id,
                requester_id=req.requester_id,
                score=-neg_score,
                item_title=item.title,
                condition=item.condition,
                requester_name=req.requester_name,
            )
        )
    return chosen
