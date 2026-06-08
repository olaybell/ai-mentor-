from flask import Blueprint, jsonify, request

from app.services.staff_service import (
    create_staff_member,
    delete_staff_member,
    list_staff,
    update_staff_member,
)
from app.utils.jwt_utils import require_auth

bp = Blueprint("staff", __name__, url_prefix="/api")


@bp.get("/staff")
@require_auth(("admin", "staff"))
def get_staff():
    return jsonify({"success": True, "data": list_staff()})


@bp.post("/staff")
@require_auth(("admin", "staff"))
def post_staff():
    payload = request.get_json(silent=True) or {}
    try:
        staff = create_staff_member(payload)
        return jsonify({"success": True, "data": staff, "message": "Staff member created"}), 201
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.patch("/staff/<int:staff_id>")
@require_auth(("admin", "staff"))
def patch_staff(staff_id: int):
    payload = request.get_json(silent=True) or {}
    try:
        staff = update_staff_member(staff_id, payload)
        if staff is None:
            return jsonify({"success": False, "error": "Staff member not found"}), 404
        return jsonify({"success": True, "data": staff, "message": "Staff member updated"})
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.delete("/staff/<int:staff_id>")
@require_auth(("admin", "staff"))
def delete_staff(staff_id: int):
    deleted = delete_staff_member(staff_id)
    if not deleted:
        return jsonify({"success": False, "error": "Staff member not found"}), 404
    return jsonify({"success": True, "message": "Staff member deleted"})
