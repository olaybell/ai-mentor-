from flask import Blueprint, jsonify, request

from app.services.auth_service import (
    authenticate_user,
    delete_user_account,
    get_user_by_id,
    register_user,
    update_user_password,
    update_user_profile,
)
from app.utils.jwt_utils import generate_jwt, require_auth
from app.utils.validation import ValidationError, require_fields

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["email", "password"])
        role = payload.get("role", "customer")
        user = register_user(
            payload["email"].strip().lower(),
            payload["password"],
            role,
            full_name=payload.get("fullName", payload.get("full_name", "")).strip(),
            phone=payload.get("phone", "").strip(),
            business_name=payload.get("businessName", payload.get("business_name", "")).strip(),
        )
        token = generate_jwt(user["id"], user["role"])
        return jsonify({"success": True, "data": {"user": user, "token": token}, "message": "Registration successful"}), 201
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 409


@bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["email", "password"])
        user = authenticate_user(payload["email"].strip().lower(), payload["password"])
        if user is None:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401

        token = generate_jwt(user["id"], user["role"])
        return jsonify({"success": True, "data": {"user": user, "token": token}, "message": "Login successful"})
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.get("/me")
@require_auth()
def me():
    user = get_user_by_id(request.user["id"])
    if user is None:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({"success": True, "data": user})


@bp.patch("/me")
@require_auth(("admin", "staff", "customer"))
def update_me():
    payload = request.get_json(silent=True) or {}
    try:
        user = update_user_profile(request.user["id"], payload)
        if user is None:
            return jsonify({"success": False, "error": "User not found"}), 404
        return jsonify({"success": True, "data": user, "message": "Profile updated"})
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 409


@bp.patch("/password")
@require_auth(("admin", "staff", "customer"))
def update_password():
    payload = request.get_json(silent=True) or {}
    try:
        require_fields(payload, ["currentPassword", "newPassword"])
        update_user_password(
            request.user["id"],
            current_password=payload["currentPassword"],
            new_password=payload["newPassword"],
        )
        return jsonify({"success": True, "message": "Password updated"})
    except ValidationError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@bp.delete("/me")
@require_auth(("admin", "staff", "customer"))
def delete_me():
    deleted = delete_user_account(request.user["id"])
    if not deleted:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({"success": True, "message": "Account deleted"})
