import json
import time
import urllib.error
import urllib.request
from datetime import datetime

from flask import current_app

from app.services.booking_service import check_conflict, list_availability
from app.utils.validation import ValidationError, parse_iso_datetime


def recommend_slots(
    specialist_id: int,
    service_duration_minutes: int,
    requested_start_iso: str,
    service_id: int | None = None,
    customer_context: dict | None = None,
) -> dict:
    started_at = time.perf_counter()
    requested_start = parse_iso_datetime(requested_start_iso, "requested_start")
    date_value = requested_start.date().isoformat()

    if service_id is None:
        candidates = _legacy_candidate_slots(specialist_id, service_duration_minutes, requested_start)
    else:
        candidates = list_availability(specialist_id, service_id, date_value)

    filtered_candidates = [
        slot
        for slot in candidates
        if slot["available"] and slot["conflictRisk"] != "High" and int(slot["serviceDuration"]) >= service_duration_minutes
    ]

    heuristic_ranked = _heuristic_rank(filtered_candidates, requested_start, customer_context or {})
    llm_ranked = _try_llm_rank(heuristic_ranked, customer_context or {})
    fallback_used = llm_ranked is None
    ranked = llm_ranked or heuristic_ranked
    recommendations = ranked[:3]
    latency_ms = int((time.perf_counter() - started_at) * 1000)

    return {
        "recommendations": recommendations,
        "alternatives": [item["startTime"] for item in recommendations],
        "fallbackUsed": fallback_used,
        "aiUnavailable": fallback_used,
        "engine": "heuristic" if fallback_used else "llm",
        "latencyMs": latency_ms,
    }


def evaluate_conflict(specialist_id: int, start_time_iso: str, end_time_iso: str) -> dict:
    try:
        has_conflict = check_conflict(specialist_id, start_time_iso, end_time_iso)
    except ValidationError as exc:
        raise ValidationError(str(exc)) from exc

    return {
        "hasConflict": has_conflict,
        "risk": "High" if has_conflict else "Low",
    }


def _legacy_candidate_slots(specialist_id: int, duration_minutes: int, requested_start: datetime) -> list[dict]:
    offsets = [-120, -60, 0, 60, 120, 180, -180]
    candidates: list[dict] = []

    for offset in offsets:
        candidate_start = requested_start.replace(second=0, microsecond=0)
        candidate_start = candidate_start.replace(minute=30 if candidate_start.minute >= 30 else 0)
        candidate_start = candidate_start + _minutes(offset)
        candidate_end = candidate_start + _minutes(duration_minutes)
        has_conflict = check_conflict(specialist_id, candidate_start.isoformat(), candidate_end.isoformat())
        candidates.append(
            {
                "id": f"candidate-{candidate_start.isoformat()}",
                "timeSlotId": None,
                "specialistId": specialist_id,
                "date": candidate_start.date().isoformat(),
                "time": candidate_start.strftime("%H:%M"),
                "startTime": candidate_start.isoformat(),
                "endTime": candidate_end.isoformat(),
                "available": not has_conflict,
                "conflictRisk": "High" if has_conflict else "Low",
                "specialistUtilisation": 0,
                "serviceDuration": duration_minutes,
                "timeOfDay": _time_bucket(candidate_start),
                "dayOfWeek": candidate_start.weekday(),
            }
        )

    return candidates


def _minutes(value: int):
    from datetime import timedelta

    return timedelta(minutes=value)


def _heuristic_rank(candidates: list[dict], requested_start: datetime, customer_context: dict) -> list[dict]:
    preferred_bucket = str(customer_context.get("preferredTimeOfDay", "")).strip().lower()
    ranked: list[dict] = []

    for candidate in candidates:
        candidate_start = parse_iso_datetime(candidate["startTime"], "candidate_start")
        utilisation = float(candidate.get("specialistUtilisation", 0))
        distance_minutes = abs((candidate_start - requested_start).total_seconds()) / 60
        time_bucket = candidate.get("timeOfDay") or _time_bucket(candidate_start)
        score = 0.78
        score -= min(distance_minutes / 600, 0.2)
        score -= min(utilisation * 0.28, 0.28)

        if time_bucket == "morning":
            score += 0.08
        elif time_bucket == "midday":
            score += 0.04
        elif time_bucket == "evening":
            score -= 0.03

        if preferred_bucket and preferred_bucket == time_bucket:
            score += 0.12

        confidence = max(50, min(96, round(score * 100)))
        ranked.append(
            {
                "slotId": str(candidate["id"]),
                "timeSlotId": candidate.get("timeSlotId"),
                "rank": 0,
                "date": candidate["date"],
                "time": candidate["time"],
                "startTime": candidate["startTime"],
                "endTime": candidate["endTime"],
                "confidence": confidence,
                "score": round(score, 3),
                "rationale": _heuristic_rationale(candidate, time_bucket, utilisation, preferred_bucket),
                "features": {
                    "time_of_day": time_bucket,
                    "day_of_week": candidate["dayOfWeek"],
                    "specialist_utilisation": utilisation,
                    "conflict_risk": 1 if candidate["conflictRisk"] == "High" else 0,
                    "service_duration": candidate["serviceDuration"],
                },
            }
        )

    ranked.sort(key=lambda item: (-item["score"], item["startTime"]))
    for index, item in enumerate(ranked, start=1):
        item["rank"] = index
    return ranked


def _heuristic_rationale(candidate: dict, time_bucket: str, utilisation: float, preferred_bucket: str) -> str:
    if preferred_bucket and preferred_bucket == time_bucket:
        return f"{candidate['time']} matches the customer's usual {time_bucket} preference and has no active conflict."

    if utilisation >= 0.7:
        return f"{candidate['time']} is open, but the specialist has relatively high recent utilisation."

    if time_bucket == "morning":
        return f"{candidate['time']} is a low-conflict morning option with balanced specialist utilisation."

    return f"{candidate['time']} is available and passes the overlap and operating-hours checks."


def _try_llm_rank(ranked_candidates: list[dict], customer_context: dict) -> list[dict] | None:
    api_url = current_app.config.get("LLM_API_URL", "")
    api_key = current_app.config.get("LLM_API_KEY", "")
    model = current_app.config.get("LLM_MODEL", "")

    if not api_url or not api_key or not ranked_candidates:
        return None

    prompt = {
        "task": "Rank appointment slots by predicted booking-acceptance probability.",
        "business_rules": [
            "Only rank supplied slots; they already passed hard conflict and operating-hours checks.",
            "Prefer explainable customer-friendly recommendations.",
            "Return JSON only with recommendations containing slotId, rank, and rationale.",
        ],
        "customer_context": customer_context,
        "candidate_slots": [
            {
                "slotId": item["slotId"],
                "time": item["time"],
                "startTime": item["startTime"],
                "features": item["features"],
                "heuristicConfidence": item["confidence"],
            }
            for item in ranked_candidates[:8]
        ],
    }

    request_payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a scheduling assistant. Respond with strict JSON only.",
            },
            {
                "role": "user",
                "content": json.dumps(prompt),
            },
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    request = urllib.request.Request(
        api_url,
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=current_app.config.get("LLM_TIMEOUT_SECONDS", 8)) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return None

    llm_items = parsed.get("recommendations")
    if not isinstance(llm_items, list):
        return None

    by_slot_id = {item["slotId"]: item for item in ranked_candidates}
    output: list[dict] = []
    seen: set[str] = set()

    for llm_item in llm_items:
        slot_id = str(llm_item.get("slotId", ""))
        if slot_id not in by_slot_id or slot_id in seen:
            continue
        candidate = dict(by_slot_id[slot_id])
        candidate["rank"] = len(output) + 1
        candidate["rationale"] = str(llm_item.get("rationale") or candidate["rationale"])
        output.append(candidate)
        seen.add(slot_id)
        if len(output) == 3:
            break

    if not output:
        return None

    for candidate in ranked_candidates:
        if len(output) == 3:
            break
        if candidate["slotId"] not in seen:
            next_candidate = dict(candidate)
            next_candidate["rank"] = len(output) + 1
            output.append(next_candidate)

    return output


def _time_bucket(value: datetime) -> str:
    if value.hour < 12:
        return "morning"
    if value.hour < 14:
        return "midday"
    if value.hour < 17:
        return "afternoon"
    return "evening"
