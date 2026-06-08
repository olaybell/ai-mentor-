import secrets
from datetime import datetime, time, timedelta

from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from app.models.entities import Booking, Service, Specialist, TimeSlot, User
from app.utils.db import get_session
from app.utils.validation import ValidationError, parse_iso_datetime

BOOKING_ACTIVE_STATUSES = ("pending", "confirmed")
BOOKING_STATUSES = ("pending", "confirmed", "cancelled")
BUSINESS_OPEN_TIME = time(hour=8, minute=0)
BUSINESS_CLOSE_TIME = time(hour=18, minute=0)
SLOT_INTERVAL_MINUTES = 30


def _get_service(service_id: int) -> Service:
    session = get_session()
    row = session.get(Service, service_id)
    if row is None or not row.is_active:
        raise ValidationError("Selected service does not exist")
    return row


def _get_specialist(specialist_id: int) -> Specialist:
    session = get_session()
    row = session.get(Specialist, specialist_id)
    if row is None or not row.is_active:
        raise ValidationError("Selected specialist does not exist")
    return row


def _get_service_duration(service_id: int) -> int:
    return int(_get_service(service_id).duration_minutes)


def _validate_specialist_service(specialist: Specialist, service: Service) -> None:
    if service not in specialist.services:
        raise ValidationError("Selected specialist does not provide this service")


def _has_conflict(specialist_id: int, start_time: datetime, end_time: datetime, exclude_booking_id: int | None = None) -> bool:
    session = get_session()
    query = session.query(Booking.id).filter(
        Booking.specialist_id == specialist_id,
        Booking.status.in_(BOOKING_ACTIVE_STATUSES),
        Booking.start_time < end_time,
        Booking.end_time > start_time,
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)

    return bool(session.query(query.exists()).scalar())


def _get_or_create_time_slot(specialist_id: int, start_time: datetime, end_time: datetime) -> TimeSlot:
    session = get_session()
    slot = (
        session.query(TimeSlot)
        .filter(
            TimeSlot.specialist_id == specialist_id,
            TimeSlot.start_time == start_time,
            TimeSlot.end_time == end_time,
        )
        .first()
    )

    if slot is not None:
        return slot

    slot = TimeSlot(
        specialist_id=specialist_id,
        date=start_time.date().isoformat(),
        start_time=start_time,
        end_time=end_time,
        is_available=True,
        created_at=datetime.utcnow(),
    )
    session.add(slot)
    session.flush()
    return slot


def _normalise_customer_details(customer_details: dict | None) -> dict:
    details = customer_details or {}
    return {
        "full_name": str(details.get("fullName", details.get("full_name", ""))).strip(),
        "email": str(details.get("email", "")).strip().lower(),
        "phone": str(details.get("phone", "")).strip(),
    }


def _resolve_customer_id(authenticated_user_id: int | None, customer_details: dict | None) -> int:
    session = get_session()
    details = _normalise_customer_details(customer_details)

    if details["email"]:
        user = session.query(User).filter(User.email == details["email"]).first()
        if user is None:
            user = User(
                email=details["email"],
                full_name=details["full_name"],
                phone=details["phone"],
                business_name="",
                timezone="Africa/Lagos",
                smart_slot_selection=True,
                conflict_resolution=True,
                password_hash=generate_password_hash(secrets.token_urlsafe(24)),
                role="customer",
                created_at=datetime.utcnow(),
            )
            session.add(user)
            session.flush()
            return user.id

        if details["full_name"] and not user.full_name:
            user.full_name = details["full_name"]
        if details["phone"] and not user.phone:
            user.phone = details["phone"]
        session.flush()
        return user.id

    if authenticated_user_id is not None:
        user = session.get(User, authenticated_user_id)
        if user is None:
            raise ValidationError("Authenticated customer does not exist")
        return user.id

    raise ValidationError("Customer name, email and phone are required for public bookings")


def _validate_status(status: str) -> str:
    normalised = status.strip().lower()
    if normalised not in BOOKING_STATUSES:
        raise ValidationError("Booking status must be pending, confirmed or cancelled")
    return normalised


def _serialize_service(service: Service) -> dict:
    return {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "duration_minutes": service.duration_minutes,
        "durationMinutes": service.duration_minutes,
        "price": service.price,
        "category": service.category,
    }


def _serialize_specialist(specialist: Specialist) -> dict:
    return {
        "id": specialist.id,
        "name": specialist.name,
        "title": specialist.title,
        "specialisation": specialist.specialisation,
        "experience_years": specialist.experience_years,
        "experienceYears": specialist.experience_years,
        "rating": specialist.rating,
        "serviceIds": [service.id for service in specialist.services],
    }


def _serialize_booking(booking: Booking) -> dict:
    customer_name = booking.customer.full_name or booking.customer.email
    date = booking.start_time.date().isoformat()
    time_value = booking.start_time.strftime("%H:%M")

    return {
        "id": booking.id,
        "customer_id": booking.customer_id,
        "customerId": booking.customer_id,
        "specialist_id": booking.specialist_id,
        "specialistId": booking.specialist_id,
        "service_id": booking.service_id,
        "serviceId": booking.service_id,
        "time_slot_id": booking.time_slot_id,
        "timeSlotId": booking.time_slot_id,
        "start_time": booking.start_time.isoformat(),
        "startTime": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "endTime": booking.end_time.isoformat(),
        "date": date,
        "time": time_value,
        "status": booking.status,
        "note": booking.note,
        "created_at": booking.created_at.isoformat(),
        "createdAt": booking.created_at.isoformat(),
        "updated_at": booking.updated_at.isoformat(),
        "updatedAt": booking.updated_at.isoformat(),
        "customer_email": booking.customer.email,
        "customerEmail": booking.customer.email,
        "customer_name": customer_name,
        "customerName": customer_name,
        "customer_phone": booking.customer.phone,
        "customerPhone": booking.customer.phone,
        "specialist_name": booking.specialist.name,
        "specialistName": booking.specialist.name,
        "service_name": booking.service.name,
        "serviceName": booking.service.name,
        "service": _serialize_service(booking.service),
        "specialist": _serialize_specialist(booking.specialist),
        "clientName": customer_name,
    }


def _slot_utilisation(specialist_id: int, reference_date: str) -> float:
    session = get_session()
    reference_start = datetime.fromisoformat(f"{reference_date}T00:00:00")
    window_start = reference_start - timedelta(days=30)
    window_end = reference_start
    booked = (
        session.query(Booking.id)
        .filter(
            Booking.specialist_id == specialist_id,
            Booking.status.in_(BOOKING_ACTIVE_STATUSES),
            Booking.start_time >= window_start,
            Booking.start_time < window_end,
        )
        .count()
    )
    daily_slots = int(
        (
            datetime.combine(reference_start.date(), BUSINESS_CLOSE_TIME)
            - datetime.combine(reference_start.date(), BUSINESS_OPEN_TIME)
        ).total_seconds()
        // 60
        // SLOT_INTERVAL_MINUTES
    )
    capacity = max(daily_slots * 30, 1)
    return round(min(booked / capacity, 1), 2)


def _iter_candidate_intervals(date_value: str, duration_minutes: int):
    day = datetime.fromisoformat(f"{date_value}T00:00:00").date()
    start = datetime.combine(day, BUSINESS_OPEN_TIME)
    close = datetime.combine(day, BUSINESS_CLOSE_TIME)
    latest_start = close - timedelta(minutes=duration_minutes)

    while start <= latest_start:
        yield start, start + timedelta(minutes=duration_minutes)
        start += timedelta(minutes=SLOT_INTERVAL_MINUTES)


def check_conflict(specialist_id: int, start_time_iso: str, end_time_iso: str, exclude_booking_id: int | None = None) -> bool:
    start_time = parse_iso_datetime(start_time_iso, "start_time")
    end_time = parse_iso_datetime(end_time_iso, "end_time")
    if end_time <= start_time:
        raise ValidationError("end_time must be after start_time")
    return _has_conflict(specialist_id, start_time, end_time, exclude_booking_id)


def list_availability(specialist_id: int, service_id: int, date_value: str) -> list[dict]:
    specialist = _get_specialist(specialist_id)
    service = _get_service(service_id)
    _validate_specialist_service(specialist, service)

    # Validate date format and keep it date-only for deterministic API responses.
    parsed_date = datetime.fromisoformat(f"{date_value}T00:00:00").date().isoformat()
    utilisation = _slot_utilisation(specialist_id, parsed_date)
    slots: list[dict] = []

    for start_time, end_time in _iter_candidate_intervals(parsed_date, int(service.duration_minutes)):
        slot = _get_or_create_time_slot(specialist_id, start_time, end_time)
        has_conflict = _has_conflict(specialist_id, start_time, end_time)
        available = bool(slot.is_available and not has_conflict)
        slots.append(
            {
                "id": slot.id,
                "timeSlotId": slot.id,
                "specialistId": specialist_id,
                "serviceId": service_id,
                "date": parsed_date,
                "time": start_time.strftime("%H:%M"),
                "startTime": start_time.isoformat(),
                "endTime": end_time.isoformat(),
                "available": available,
                "conflictRisk": "High" if has_conflict else "Low",
                "specialistUtilisation": utilisation,
                "serviceDuration": int(service.duration_minutes),
                "timeOfDay": _time_bucket(start_time),
                "dayOfWeek": start_time.weekday(),
            }
        )

    get_session().commit()
    return slots


def create_booking(
    customer_id: int | None,
    specialist_id: int,
    service_id: int,
    start_time_iso: str,
    note: str = "",
    status: str = "confirmed",
    customer_details: dict | None = None,
) -> dict:
    session = get_session()
    specialist = _get_specialist(specialist_id)
    service = _get_service(service_id)
    _validate_specialist_service(specialist, service)

    start_time = parse_iso_datetime(start_time_iso, "start_time")
    duration = int(service.duration_minutes)
    end_time = start_time + timedelta(minutes=duration)
    resolved_customer_id = _resolve_customer_id(customer_id, customer_details)
    resolved_status = _validate_status(status)
    slot = _get_or_create_time_slot(specialist_id, start_time, end_time)

    if not slot.is_available:
        raise ValidationError("This time slot is not available for the selected specialist")

    if _has_conflict(specialist_id, start_time, end_time):
        raise ValidationError("This time slot is already booked for the selected specialist")

    now = datetime.utcnow()
    booking = Booking(
        customer_id=resolved_customer_id,
        specialist_id=specialist_id,
        service_id=service_id,
        time_slot_id=slot.id,
        start_time=start_time,
        end_time=end_time,
        status=resolved_status,
        note=note,
        created_at=now,
        updated_at=now,
    )
    session.add(booking)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ValidationError("This time slot is already booked for the selected specialist") from exc

    session.refresh(booking)
    return get_booking_by_id(booking.id)


def list_bookings(user_id: int | None = None, role: str | None = None) -> list[dict]:
    session = get_session()
    query = session.query(Booking)
    if role == "customer" and user_id is not None:
        query = query.filter(Booking.customer_id == user_id)

    rows = query.order_by(Booking.start_time).all()
    return [_serialize_booking(row) for row in rows]


def get_booking_by_id(booking_id: int) -> dict | None:
    session = get_session()
    row = session.get(Booking, booking_id)
    return _serialize_booking(row) if row else None


def update_booking(
    booking_id: int,
    specialist_id: int | None = None,
    service_id: int | None = None,
    start_time_iso: str | None = None,
    note: str | None = None,
    status: str | None = None,
    customer_details: dict | None = None,
) -> dict | None:
    session = get_session()
    booking = session.get(Booking, booking_id)
    if booking is None:
        return None

    next_specialist_id = specialist_id or booking.specialist_id
    next_service_id = service_id or booking.service_id
    specialist = _get_specialist(next_specialist_id)
    service = _get_service(next_service_id)
    _validate_specialist_service(specialist, service)

    start_time = parse_iso_datetime(start_time_iso, "start_time") if start_time_iso else booking.start_time
    end_time = start_time + timedelta(minutes=int(service.duration_minutes))
    slot = _get_or_create_time_slot(next_specialist_id, start_time, end_time)

    if _has_conflict(next_specialist_id, start_time, end_time, exclude_booking_id=booking_id):
        raise ValidationError("This updated slot conflicts with another booking")

    if customer_details:
        booking.customer_id = _resolve_customer_id(None, customer_details)

    booking.specialist_id = next_specialist_id
    booking.service_id = next_service_id
    booking.time_slot_id = slot.id
    booking.start_time = start_time
    booking.end_time = end_time
    if note is not None:
        booking.note = note
    if status is not None:
        booking.status = _validate_status(status)
    booking.updated_at = datetime.utcnow()

    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise ValidationError("This updated slot conflicts with another booking") from exc

    return get_booking_by_id(booking_id)


def cancel_booking(booking_id: int) -> bool:
    session = get_session()
    booking = session.get(Booking, booking_id)
    if booking is None:
        return False

    booking.status = "cancelled"
    booking.updated_at = datetime.utcnow()
    session.commit()
    return True


def _time_bucket(value: datetime) -> str:
    hour = value.hour
    if hour < 12:
        return "morning"
    if hour < 14:
        return "midday"
    if hour < 17:
        return "afternoon"
    return "evening"
