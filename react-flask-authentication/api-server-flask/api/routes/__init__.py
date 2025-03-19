from flask_restx import Api
from flask import Blueprint

# Import Blueprints and Namespaces from all modules
from .auth import auth_bp, auth_api
from .markers import markers_bp, markers_api
from .orders import orders_bp, orders_api
from .root import root_bp
from .mattress import mattress_bp, mattress_api
from .items import zalli_bp, zalli_api  # Existing module
from .padprint import padprint_bp, padprint_api  # New module for padprint

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
    
    # Attach Namespaces so they appear in the Swagger docs
    rest_api.add_namespace(auth_api, path="/api/users")
    rest_api.add_namespace(markers_api, path="/api/markers")
    rest_api.add_namespace(orders_api, path="/api/orders")
    rest_api.add_namespace(mattress_api, path="/api/mattress")
    rest_api.add_namespace(zalli_api, path="/api/zalli")
    rest_api.add_namespace(padprint_api, path="/api/padprint")
