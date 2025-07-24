from flask_restx import Api
from flask import Blueprint
from flask_restx import Resource
from flask import request

# Import Blueprints and Namespaces from all modules
from .auth import auth_bp, auth_api
from ..models import OrderLinesView  # Import the OrderLinesView model
from .markers import markers_bp, markers_api
from .orders import orders_bp, orders_api
from .root import root_bp
from .mattress import mattress_bp, mattress_api
from .items import zalli_bp, zalli_api  # Existing module
from .padprint import padprint_bp, padprint_api
from .collaretto import collaretto_bp, collaretto_api
from .operators import operators_bp, operators_api  # Spreader operators module
from .cutter_operators import cutter_operators_bp, cutter_operators_api  # Cutter operators module
from .marker_calculator import marker_calculator_bp, marker_calculator_api  # Marker calculator module
from .width_change_requests import width_change_requests_bp, width_change_requests_api  # Width change requests module
from .marker_requests import marker_requests_bp, marker_requests_api  # Marker requests module
from .navision import navision_bp, navision_api  # Navision integration module
from .dashboard import dashboard_bp, dashboard_api  # Dashboard analytics module
# VPN uses existing Flask-RESTX endpoints, no separate blueprint needed

# Define the main RESTx API with Swagger documentation settings
# CRITICAL FIX: Changed doc path from "/api/" to "/docs/" to prevent conflicts
# The "/api/" path was intercepting all API requests and serving HTML documentation
# instead of JSON responses, causing VPN authentication failures
rest_api = Api(
    title="Cutting API",
    version="1.0",
    description="API Documentation",
    doc="/docs/"
)

def register_blueprints(app):
    """Register all Blueprints (routes) and attach Namespaces for Swagger."""
    # Register Blueprints with URL prefixes where needed
    app.register_blueprint(root_bp)

    # Register with /api prefix (for VM and local access)
    app.register_blueprint(auth_bp, url_prefix="/api/users")
    app.register_blueprint(markers_bp, url_prefix="/api/markers")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(mattress_bp, url_prefix="/api/mattress")
    app.register_blueprint(zalli_bp, url_prefix="/api/zalli")
    app.register_blueprint(padprint_bp, url_prefix="/api/padprint")
    app.register_blueprint(collaretto_bp, url_prefix="/api/collaretto")
    app.register_blueprint(operators_bp, url_prefix="/api/operators")
    app.register_blueprint(cutter_operators_bp, url_prefix="/api/cutter_operators")
    app.register_blueprint(marker_calculator_bp, url_prefix="/api/marker_calculator")
    app.register_blueprint(width_change_requests_bp, url_prefix="/api/width_change_requests")
    app.register_blueprint(marker_requests_bp, url_prefix="/api/marker_requests")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(navision_bp, url_prefix="/api/navision")

    # VPN uses the same /api/users endpoints as VM access (Flask-RESTX)
    print("=" * 50)
    print("✅ VPN WILL USE EXISTING /api/users ENDPOINTS")
    print("   - POST /api/users/login (Flask-RESTX)")
    print("=" * 50)

    # Attach Namespaces so they appear in the Swagger docs
    rest_api.add_namespace(auth_api, path="/api/users")
    rest_api.add_namespace(markers_api, path="/api/markers")
    rest_api.add_namespace(orders_api, path="/api/orders")
    rest_api.add_namespace(mattress_api, path="/api/mattress")
    rest_api.add_namespace(zalli_api, path="/api/zalli")
    rest_api.add_namespace(padprint_api, path="/api/padprint")
    rest_api.add_namespace(collaretto_api, path="/api/collaretto")
    rest_api.add_namespace(operators_api, path="/api/operators")
    rest_api.add_namespace(cutter_operators_api, path="/api/cutter_operators")
    rest_api.add_namespace(marker_calculator_api, path="/api/marker_calculator")
    rest_api.add_namespace(width_change_requests_api, path="/api/width_change_requests")
    rest_api.add_namespace(marker_requests_api, path="/api/marker_requests")
    rest_api.add_namespace(dashboard_api, path="/api/dashboard")

    rest_api.add_namespace(navision_api, path="/api/navision")
