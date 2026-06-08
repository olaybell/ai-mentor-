from flask import Blueprint, jsonify

from app.services.analytics_service import get_overview
from app.utils.jwt_utils import require_auth

bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@bp.get("/overview")
@require_auth(("admin", "staff"))
def overview():
    return jsonify({"success": True, "data": get_overview()})
