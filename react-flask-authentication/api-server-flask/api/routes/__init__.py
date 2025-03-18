from flask_restx import Api
from flask import Blueprint

# Import all route blueprints and namespaces
from .auth import auth_bp, auth_api
from .markers import markers_bp, markers_api
from .orders import orders_bp, orders_api
from .root import root_bp
from .mattress import mattress_bp, mattress_api
from .items import zalli_bp, zalli_api  # Import the new module
from .uploads import uploads_bp, uploads_api  # Import both the blueprint and namespace

# ✅ Define the main RESTx API (explicitly setting the Swagger doc URL)
rest_api = Api(title="Cutting API", version="1.0", description="API Documentation", doc="/api/")

def register_blueprints(app):
    """Register all Blueprints (routes) to the Flask app"""
    app.register_blueprint(root_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/users")
    app.register_blueprint(markers_bp, url_prefix="/api/markers")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(mattress_bp) 
    app.register_blueprint(zalli_bp)
    app.register_blueprint(uploads_bp, url_prefix="/api/image-upload")
    
    
    # Attach Namespaces (ensures endpoints show in Swagger)
    rest_api.add_namespace(auth_api, path="/api/users")
    rest_api.add_namespace(markers_api, path="/api/markers")
    rest_api.add_namespace(orders_api, path="/api/orders")
    rest_api.add_namespace(mattress_api, path="/api/mattress")
    rest_api.add_namespace(zalli_api, path="/api/zalli")
    rest_api.add_namespace(uploads_api, path="/api/image-upload")  # Add this line

