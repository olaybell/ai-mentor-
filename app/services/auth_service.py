from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from app.models.entities import Booking, User
from app.utils.db import get_session


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "phone": user.phone,
        "businessName": user.business_name,
        "timezone": user.timezone,
        "role": user.role,
        "roleLabel": _role_label(user.role),
        "bookingRules": {
            "smartSlotSelection": bool(user.smart_slot_selection),
            "conflictResolution": bool(user.conflict_resolution),
        },
        "created_at": user.created_at.isoformat(),
    }


def register_user(
    email: str,
    password: str,
    role: str = "customer",
    full_name: str = "",
    phone: str = "",
    business_name: str = "",
) -> dict:
    session = get_session()
    existing = session.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("An account with this email already exists")

    user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        business_name=business_name if role in ("admin", "staff") else "",
        timezone="Africa/Lagos",
        smart_slot_selection=True,
        conflict_resolution=True,
        password_hash=generate_password_hash(password),
        role=role,
        created_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()

    return _serialize_user(user)


def authenticate_user(email: str, password: str) -> dict | None:
    session = get_session()
    user = session.query(User).filter(User.email == email).first()
    if user is None:
        return None

    if not check_password_hash(user.password_hash, password):
        return None

    return _serialize_user(user)


def get_user_by_id(user_id: int) -> dict | None:
    session = get_session()
    user = session.get(User, user_id)
    return _serialize_user(user) if user else None


def update_user_profile(user_id: int, payload: dict) -> dict | None:
    session = get_session()
    user = session.get(User, user_id)
    if user is None:
        return None

    next_email = str(payload.get("email", user.email)).strip().lower()
    if next_email != user.email:
        existing = session.query(User.id).filter(User.email == next_email, User.id != user_id).first()
        if existing:
            raise ValueError("An account with this email already exists")
        user.email = next_email

    if "fullName" in payload or "full_name" in payload:
        user.full_name = str(payload.get("fullName", payload.get("full_name", ""))).strip()
    if "phone" in payload:
        user.phone = str(payload.get("phone", "")).strip()
    if "businessName" in payload or "business_name" in payload:
        user.business_name = str(payload.get("businessName", payload.get("business_name", ""))).strip()
    if "timezone" in payload:
        user.timezone = str(payload.get("timezone", "")).strip()

    rules = payload.get("bookingRules") or {}
    if "smartSlotSelection" in rules:
        user.smart_slot_selection = bool(rules["smartSlotSelection"])
    if "conflictResolution" in rules:
        user.conflict_resolution = bool(rules["conflictResolution"])

    session.commit()
    session.refresh(user)
    return _serialize_user(user)


def update_user_password(user_id: int, current_password: str, new_password: str) -> None:
    session = get_session()
    user = session.get(User, user_id)
    if user is None:
        raise ValueError("User not found")

    if not check_password_hash(user.password_hash, current_password):
        raise ValueError("Current password is incorrect")

    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters")

    user.password_hash = generate_password_hash(new_password)
    session.commit()


def delete_user_account(user_id: int) -> bool:
    session = get_session()
    user = session.get(User, user_id)
    if user is None:
        return False

    session.query(Booking).filter(Booking.customer_id == user_id).delete(synchronize_session=False)
    session.delete(user)
    session.commit()
    return True


def _role_label(role: str) -> str:
    return {
        "admin": "Business owner",
        "staff": "Staff member",
        "customer": "Customer",
    }.get(role, role.title())
