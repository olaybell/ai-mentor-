from datetime import datetime
from random import randint

from flask import Blueprint, jsonify, request

from app.models.entities import BookingPage, BookingPageSlot, Service, Specialist
from app.utils.db import get_session
from app.utils.jwt_utils import require_auth
from app.utils.validation import ValidationError, require_fields

bp = Blueprint("public_pages", __name__, url_prefix="/api")


def _slugify(value: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "booking-page"


@bp.post("/public-pages/publish")
@require_auth(("admin", "staff"))
def publish_page():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(
            payload,
            [
                "title",
                "businessName",
                "serviceName",
                "serviceDescription",
                "serviceCategory",
                "serviceDurationMinutes",
                "servicePrice",
                "locationType",
                "locationDetails",
            ],
        )
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    session = get_session()
    slug_base = _slugify(payload["serviceName"] or payload["title"])
    slug = f"{slug_base}-{randint(1000, 9999)}"
    now = datetime.utcnow()
    public_url = f"/book/{slug}"
    service = _get_or_create_service(session, payload)

    page = BookingPage(
        service_id=service.id,
        title=payload["title"],
        business_name=payload["businessName"],
        service_name=payload["serviceName"],
        service_description=payload["serviceDescription"],
        service_category=payload["serviceCategory"],
        service_duration_minutes=int(payload["serviceDurationMinutes"]),
        service_price=float(payload["servicePrice"]),
        location_type=payload["locationType"],
        location_details=payload["locationDetails"],
        notes=payload.get("notes", ""),
        slug=slug,
        status="published",
        published_at=now,
        public_url=public_url,
        created_at=now,
    )
    session.add(page)

    for specialist_id in payload.get("specialistIds", []):
        try:
            specialist = session.get(Specialist, int(specialist_id))
        except (TypeError, ValueError):
            specialist = None
        if specialist and specialist not in page.specialists:
            page.specialists.append(specialist)
        if specialist and service not in specialist.services:
            specialist.services.append(service)

    for slot in payload.get("timeSlots", []):
        page.slots.append(
            BookingPageSlot(
                day=slot.get("day", "Monday"),
                time=slot["time"],
                is_available=bool(slot.get("isAvailable", True)),
                max_bookings_per_slot=int(slot.get("maxBookingsPerSlot", 1)),
            )
        )

    session.commit()

    return jsonify(
        {
            "success": True,
            "data": {
                "id": page.id,
                "serviceId": service.id,
                "slug": slug,
                "status": "published",
                "publishedAt": now.isoformat(),
                "publicUrl": public_url,
            },
            "message": "Public booking page published",
        }
    )


@bp.get("/public-pages")
def list_public_pages():
    session = get_session()
    pages = (
        session.query(BookingPage)
        .filter(BookingPage.status == "published")
        .order_by(BookingPage.published_at.desc(), BookingPage.created_at.desc())
        .all()
    )

    return jsonify(
        {
            "success": True,
            "data": [
                {
                    "id": page.id,
                    "serviceId": page.service_id,
                    "title": page.title,
                    "businessName": page.business_name,
                    "serviceName": page.service_name,
                    "serviceDescription": page.service_description,
                    "serviceCategory": page.service_category,
                    "serviceDurationMinutes": page.service_duration_minutes,
                    "servicePrice": page.service_price,
                    "locationType": page.location_type,
                    "locationDetails": page.location_details,
                    "notes": page.notes,
                    "slug": page.slug,
                    "status": page.status,
                    "publishedAt": page.published_at.isoformat() if page.published_at else "",
                    "publicUrl": page.public_url,
                    "selectedSpecialists": [
                        {
                            "id": specialist.id,
                            "name": specialist.name,
                            "title": specialist.title,
                            "role": specialist.title,
                            "specialisation": specialist.specialisation,
                            "experienceYears": specialist.experience_years,
                            "rating": specialist.rating,
                            "availabilityStatus": "Available",
                        }
                        for specialist in sorted(page.specialists, key=lambda item: item.name)
                    ],
                    "timeSlots": [
                        {
                            "id": slot.id,
                            "day": slot.day,
                            "time": slot.time,
                            "isAvailable": slot.is_available,
                            "maxBookingsPerSlot": slot.max_bookings_per_slot,
                        }
                        for slot in sorted(page.slots, key=lambda item: (item.day, item.time))
                    ],
                    "availableDays": sorted({slot.day for slot in page.slots}),
                }
                for page in pages
            ],
        }
    )


@bp.get("/public-pages/<slug>")
def get_public_page(slug: str):
    session = get_session()
    page = session.query(BookingPage).filter(BookingPage.slug == slug, BookingPage.status == "published").first()

    if page is None:
        return jsonify({"success": False, "error": "Public booking page not found"}), 404

    if page.service_id is None:
        service = _get_or_create_service(
            session,
            {
                "serviceName": page.service_name,
                "serviceDescription": page.service_description,
                "serviceDurationMinutes": page.service_duration_minutes,
                "servicePrice": page.service_price,
                "serviceCategory": page.service_category,
            },
        )
        page.service_id = service.id
        for specialist in page.specialists:
            if service not in specialist.services:
                specialist.services.append(service)
        session.commit()

    return jsonify(
        {
            "success": True,
            "data": {
                "id": page.id,
                "serviceId": page.service_id,
                "title": page.title,
                "businessName": page.business_name,
                "business_name": page.business_name,
                "serviceName": page.service_name,
                "service_name": page.service_name,
                "serviceDescription": page.service_description,
                "service_description": page.service_description,
                "serviceCategory": page.service_category,
                "service_category": page.service_category,
                "serviceDurationMinutes": page.service_duration_minutes,
                "service_duration_minutes": page.service_duration_minutes,
                "servicePrice": page.service_price,
                "service_price": page.service_price,
                "locationType": page.location_type,
                "location_type": page.location_type,
                "locationDetails": page.location_details,
                "location_details": page.location_details,
                "notes": page.notes,
                "slug": page.slug,
                "status": page.status,
                "published_at": page.published_at.isoformat() if page.published_at else None,
                "public_url": page.public_url,
                "availableDays": sorted({slot.day for slot in page.slots}),
                "selectedSpecialists": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "title": s.title,
                        "role": s.title,
                        "specialisation": s.specialisation,
                        "experience_years": s.experience_years,
                        "experienceYears": s.experience_years,
                        "rating": s.rating,
                        "availabilityStatus": "Available",
                    }
                    for s in sorted(page.specialists, key=lambda item: item.name)
                ],
                "timeSlots": [
                    {
                        "id": slot.id,
                        "day": slot.day,
                        "time": slot.time,
                        "isAvailable": slot.is_available,
                        "is_available": slot.is_available,
                        "maxBookingsPerSlot": slot.max_bookings_per_slot,
                        "max_bookings_per_slot": slot.max_bookings_per_slot,
                    }
                    for slot in sorted(page.slots, key=lambda item: (item.day, item.time))
                ],
            },
        }
    )


def _get_or_create_service(session, payload: dict) -> Service:
    service_name = payload["serviceName"].strip()
    service = session.query(Service).filter(Service.name == service_name).first()

    if service is None:
        service = Service(
            name=service_name,
            description=payload["serviceDescription"],
            duration_minutes=int(payload["serviceDurationMinutes"]),
            price=float(payload["servicePrice"]),
            category=payload["serviceCategory"],
            is_active=True,
        )
        session.add(service)
        session.flush()
        return service

    service.description = payload["serviceDescription"]
    service.duration_minutes = int(payload["serviceDurationMinutes"])
    service.price = float(payload["servicePrice"])
    service.category = payload["serviceCategory"]
    service.is_active = True
    session.flush()
    return service
