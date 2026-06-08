from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, jsonify, request


def generate_jwt(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=current_app.config["JWT_EXPIRATION_HOURS"])).timestamp()),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_jwt(token: str) -> dict:
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])


def require_auth(roles: tuple[str, ...] | None = None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify({"success": False, "error": "Missing or invalid authorization token"}), 401

            token = auth.split(" ", 1)[1].strip()
            try:
                payload = decode_jwt(token)
            except jwt.ExpiredSignatureError:
                return jsonify({"success": False, "error": "Session expired. Please log in again."}), 401
            except jwt.InvalidTokenError:
                return jsonify({"success": False, "error": "Invalid authentication token"}), 401

            request.user = {
                "id": int(payload["sub"]),
                "role": payload["role"],
            }

            if roles and request.user["role"] not in roles:
                return jsonify({"success": False, "error": "You do not have permission for this action"}), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator
