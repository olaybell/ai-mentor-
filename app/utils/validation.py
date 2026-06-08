from datetime import datetime


class ValidationError(Exception):
    pass


def require_fields(payload: dict, fields: list[str]) -> None:
    missing = [field for field in fields if payload.get(field) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required fields: {', '.join(missing)}")


def parse_iso_datetime(value: str, field_name: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError(f"Invalid datetime format for {field_name}. Use ISO-8601.") from exc
