from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.models.schema import init_db
from app.routes.analytics_routes import bp as analytics_bp
from app.routes.auth_routes import bp as auth_bp
from app.routes.booking_routes import bp as booking_bp
from app.routes.public_routes import bp as public_bp
from app.routes.resource_routes import bp as resource_bp
from app.routes.staff_routes import bp as staff_bp
from app.utils.db import close_db


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    if test_config:
        app.config.update(test_config)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        return response

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"success": True, "message": "API is healthy"})

    app.teardown_appcontext(close_db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(resource_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(public_bp)

    with app.app_context():
        init_db()
    return app
