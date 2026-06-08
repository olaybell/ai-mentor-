from datetime import datetime

from app.models.entities import StaffMember
from app.utils.db import get_session


STAFF_FIELDS = ["name", "email", "phone", "role", "services", "next_slot", "status"]


def list_staff() -> list[dict]:
    session = get_session()
    rows = session.query(StaffMember).order_by(StaffMember.name).all()
    return [_serialize_staff_member(row) for row in rows]


def create_staff_member(payload: dict) -> dict:
    session = get_session()
    _ensure_required_fields(payload)
    _ensure_email_is_unique(session, payload["email"])

    staff = StaffMember(
        name=payload["name"].strip(),
        email=payload["email"].strip().lower(),
        phone=payload["phone"].strip(),
        role=payload["role"].strip(),
        services=payload["services"].strip(),
        next_slot=payload["next_slot"].strip(),
        status=payload["status"].strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(staff)
    session.commit()
    session.refresh(staff)
    return _serialize_staff_member(staff)


def update_staff_member(staff_id: int, payload: dict) -> dict | None:
    session = get_session()
    staff = session.get(StaffMember, staff_id)
    if staff is None:
        return None

    if "email" in payload and payload["email"].strip().lower() != staff.email:
        _ensure_email_is_unique(session, payload["email"])

    for field in STAFF_FIELDS:
        if field in payload and payload[field] is not None:
            value = payload[field].strip() if isinstance(payload[field], str) else payload[field]
            if field == "email":
                setattr(staff, field, str(value).strip().lower())
            else:
                setattr(staff, field, value)

    staff.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(staff)
    return _serialize_staff_member(staff)


def delete_staff_member(staff_id: int) -> bool:
    session = get_session()
    staff = session.get(StaffMember, staff_id)
    if staff is None:
        return False

    session.delete(staff)
    session.commit()
    return True


def _serialize_staff_member(staff: StaffMember) -> dict:
    return {
        "id": staff.id,
        "name": staff.name,
        "email": staff.email,
        "phone": staff.phone,
        "role": staff.role,
        "services": staff.services,
        "nextSlot": staff.next_slot,
        "status": staff.status,
    }


def _ensure_required_fields(payload: dict) -> None:
    required_fields = ["name", "email", "phone", "role", "services", "next_slot", "status"]
    missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]
    if missing:
        raise ValueError(f"Missing required staff fields: {', '.join(missing)}")


def _ensure_email_is_unique(session, email: str) -> None:
    existing = session.query(StaffMember).filter(StaffMember.email == email.strip().lower()).first()
    if existing is not None:
        raise ValueError("A staff member with this email already exists")
