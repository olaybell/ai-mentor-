from flask import Blueprint, jsonify, request
import jwt

from app.services.auth_service import get_user_by_id
from app.services.ai_service import evaluate_conflict, recommend_slots
from app.services.booking_service import (
    cancel_booking,
    create_booking,
    get_booking_by_id,
    list_availability,
    list_bookings,
    update_booking,
)
from app.utils.jwt_utils import decode_jwt, generate_jwt, require_auth
from app.utils.validation import ValidationError, require_fields

bp = Blueprint("bookings", __name__, url_prefix="/api")


@bp.get("/bookings")
@require_auth()
def get_bookings():
    bookings = list_bookings(request.user["id"], request.user["role"])
    return jsonify({"success": True, "data": bookings})


@bp.post("/bookings")
def create_booking_route():
    payload = request.get_json(silent=True) or {}
    user, auth_error = _optional_auth_user()
    if auth_error:
        return auth_error

    try:
        require_fields(payload, ["specialistId", "serviceId", "startTime"])
        booking = create_booking(
            customer_id=user["id"] if user else None,
            specialist_id=int(payload["specialistId"]),
            service_id=int(payload["serviceId"]),
            start_time_iso=payload["startTime"],
            note=payload.get("note", ""),
            status=payload.get("status", "confirmed"),
            customer_details=payload.get("clientDetails") or payload.get("customerDetails"),
        )
        data = dict(booking)
        if user is None:
            customer = get_user_by_id(int(booking["customerId"]))
            if customer is not None:
                data["customerSession"] = {
                    "user": customer,
                    "token": generate_jwt(customer["id"], customer["role"]),
                }
        return jsonify({"success": True, "data": data, "message": "Booking created successfully"}), 201
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.get("/bookings/<int:booking_id>")
@require_auth()
def get_booking(booking_id: int):
    booking = get_booking_by_id(booking_id)
    if booking is None:
        return jsonify({"success": False, "error": "Booking not found"}), 404
    if not _can_manage_booking(booking):
        return jsonify({"success": False, "error": "You do not have permission for this booking"}), 403
    return jsonify({"success": True, "data": booking})


@bp.patch("/bookings/<int:booking_id>")
@require_auth(("customer", "admin", "staff"))
def patch_booking(booking_id: int):
    payload = request.get_json(silent=True) or {}
    try:
        existing = get_booking_by_id(booking_id)
        if existing is None:
            return jsonify({"success": False, "error": "Booking not found"}), 404
        if not _can_manage_booking(existing):
            return jsonify({"success": False, "error": "You do not have permission for this booking"}), 403
        booking = update_booking(
            booking_id=booking_id,
            specialist_id=int(payload["specialistId"]) if payload.get("specialistId") else None,
            service_id=int(payload["serviceId"]) if payload.get("serviceId") else None,
            start_time_iso=payload.get("startTime"),
            note=payload.get("note"),
            status=payload.get("status"),
            customer_details=payload.get("clientDetails") or payload.get("customerDetails"),
        )
        if booking is None:
            return jsonify({"success": False, "error": "Booking not found"}), 404
        return jsonify({"success": True, "data": booking, "message": "Booking updated successfully"})
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.delete("/bookings/<int:booking_id>")
@require_auth(("customer", "admin", "staff"))
def delete_booking(booking_id: int):
    existing = get_booking_by_id(booking_id)
    if existing is None:
        return jsonify({"success": False, "error": "Booking not found"}), 404
    if not _can_manage_booking(existing):
        return jsonify({"success": False, "error": "You do not have permission for this booking"}), 403
    deleted = cancel_booking(booking_id)
    if not deleted:
        return jsonify({"success": False, "error": "Booking not found"}), 404
    return jsonify({"success": True, "message": "Booking cancelled successfully"})


@bp.get("/availability")
def get_availability():
    try:
        specialist_id = request.args.get("specialistId", type=int)
        service_id = request.args.get("serviceId", type=int)
        date_value = request.args.get("date", "")
        if specialist_id is None or service_id is None or not date_value:
            raise ValidationError("specialistId, serviceId and date are required")
        slots = list_availability(specialist_id=specialist_id, service_id=service_id, date_value=date_value)
        return jsonify({"success": True, "data": slots})
    except (ValidationError, ValueError) as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.post("/ai/recommend-slot")
def recommend_slot():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["specialistId", "requestedStartTime"])
        if not payload.get("serviceDurationMinutes") and not payload.get("serviceId"):
            raise ValidationError("serviceDurationMinutes or serviceId is required")
        rec = recommend_slots(
            specialist_id=int(payload["specialistId"]),
            service_duration_minutes=int(payload.get("serviceDurationMinutes") or 0),
            requested_start_iso=payload["requestedStartTime"],
            service_id=int(payload["serviceId"]) if payload.get("serviceId") else None,
            customer_context=payload.get("customerContext") or {},
        )
        return jsonify({"success": True, "data": rec})
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.post("/ai/check-conflict")
@require_auth(("customer", "admin", "staff"))
def check_conflict_route():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["specialistId", "startTime", "endTime"])
        data = evaluate_conflict(
            specialist_id=int(payload["specialistId"]),
            start_time_iso=payload["startTime"],
            end_time_iso=payload["endTime"],
        )
        return jsonify({"success": True, "data": data})
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


def _optional_auth_user():
    auth = request.headers.get("Authorization", "")
    if not auth:
        return None, None

    if not auth.startswith("Bearer "):
        return None, (jsonify({"success": False, "error": "Missing or invalid authorization token"}), 401)

    token = auth.split(" ", 1)[1].strip()
    try:
        payload = decode_jwt(token)
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"success": False, "error": "Session expired. Please log in again."}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"success": False, "error": "Invalid authentication token"}), 401)

    return {"id": int(payload["sub"]), "role": payload["role"]}, None


def _can_manage_booking(booking: dict) -> bool:
    if request.user["role"] in ("admin", "staff"):
        return True
    return int(booking["customerId"]) == int(request.user["id"])
