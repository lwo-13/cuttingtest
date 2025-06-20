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
from .navision import navision_bp, navision_api  # Navision integration module

# Define the main RESTx API with Swagger documentation settings
rest_api = Api(
    title="Cutting API",
    version="1.0",
    description="API Documentation",
    doc="/api/"
)

def register_blueprints(app):
    """Register all Blueprints (routes) and attach Namespaces for Swagger."""
    # Register Blueprints with URL prefixes where needed
    app.register_blueprint(root_bp)
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

    app.register_blueprint(navision_bp, url_prefix="/api/navision")

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

    rest_api.add_namespace(navision_api, path="/api/navision")
