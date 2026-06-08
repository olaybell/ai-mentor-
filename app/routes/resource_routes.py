from flask import Blueprint, jsonify, request

from app.services.resource_service import (
    list_services,
    list_specialists,
    list_resources,
    create_resource,
    update_resource,
    delete_resource,
)
from app.utils.jwt_utils import require_auth

bp = Blueprint("resources", __name__, url_prefix="/api")


@bp.get("/resources/services")
def get_services():
    return jsonify({"success": True, "data": list_services()})


@bp.get("/resources/specialists")
def get_specialists():
    service_id = request.args.get("serviceId", type=int)
    return jsonify({"success": True, "data": list_specialists(service_id)})


@bp.get("/resources")
@require_auth(("admin", "staff"))
def get_resources():
    return jsonify({"success": True, "data": list_resources()})


@bp.post("/resources")
@require_auth(("admin", "staff"))
def post_resource():
    payload = request.get_json(silent=True) or {}
    resource = create_resource(payload)
    return jsonify({"success": True, "data": resource}), 201


@bp.patch("/resources/<int:resource_id>")
@require_auth(("admin", "staff"))
def patch_resource(resource_id: int):
    payload = request.get_json(silent=True) or {}
    resource = update_resource(resource_id, payload)
    if resource is None:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    return jsonify({"success": True, "data": resource, "message": "Resource updated"})


@bp.delete("/resources/<int:resource_id>")
@require_auth(("admin", "staff"))
def delete_resource_route(resource_id: int):
    deleted = delete_resource(resource_id)
    if not deleted:
        return jsonify({"success": False, "error": "Resource not found"}), 404
    return jsonify({"success": True, "message": "Resource deleted"})
