# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
from flask import Flask, request
import json as py_json
from flask_cors import CORS
from api.models import db
from api.routes import register_blueprints, rest_api

def create_app():
    """Flask application factory function"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object('api.config.BaseConfig')

    # Ensure proper UTF-8 encoding
    app.config['JSON_AS_ASCII'] = False

    # CRITICAL FIX: Configure Flask to handle VPN proxy headers properly
    # This prevents 302 redirects by ensuring Flask trusts the proxy
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Initialize database
    db.init_app(app)

    # Enable CORS - Updated to support VPN proxy access
    allowed_origins = [
        "http://localhost:3000",           # Local development
        "http://172.27.57.210:3000",       # Direct VM access
        "http://127.0.0.1:3000",           # Local development alternative
        "https://sslvpn1.calzedonia.com"   # VPN proxy access
    ]
    CORS(app, resources={
        r"/api/*": {"origins": allowed_origins},
        r"/users/*": {"origins": allowed_origins}  # Add VPN routes to CORS
    }, supports_credentials=True)

    # NUCLEAR DEBUG ROUTE - Direct Flask route (not blueprint)
    @app.route('/debug-test', methods=['GET'])
    def debug_test():
        print("🔥🔥🔥 DIRECT FLASK ROUTE CALLED!")
        print(f"🔥🔥🔥 Request URL: {request.url}")
        print(f"🔥🔥🔥 Request headers: {dict(request.headers)}")
        return {"success": True, "message": "Direct Flask route works!"}



    @app.route('/users/debug', methods=['GET'])
    def users_debug():
        print("🔥🔥🔥 DIRECT /users/debug ROUTE CALLED!")
        return {"success": True, "message": "Direct /users/debug route works!"}

    # Register Blueprints and add namespaces FIRST
    register_blueprints(app)

    # Initialize REST API AFTER namespaces are added
    rest_api.init_app(app)

    # Add global request logging AFTER everything
    @app.before_request
    def log_request_info():
        print(f"🔥🔥🔥 FLASK REQUEST: {request.method} {request.url}")
        print(f"🔥🔥🔥 FLASK HEADERS: {dict(request.headers)}")
        print(f"🔥🔥🔥 FLASK REMOTE_ADDR: {request.remote_addr}")
        print(f"🔥🔥🔥 FLASK SCHEME: {request.scheme}")
        print(f"🔥🔥🔥 FLASK HOST: {request.host}")
        print(f"🔥🔥🔥 FLASK PATH: {request.path}")
        print(f"🔥🔥🔥 FLASK FULL_PATH: {request.full_path}")
        # Log proxy headers specifically
        print(f"🔥🔥🔥 X-Forwarded-For: {request.headers.get('X-Forwarded-For')}")
        print(f"🔥🔥🔥 X-Forwarded-Proto: {request.headers.get('X-Forwarded-Proto')}")
        print(f"🔥🔥🔥 X-Forwarded-Host: {request.headers.get('X-Forwarded-Host')}")
        print(f"🔥🔥🔥 X-Real-IP: {request.headers.get('X-Real-IP')}")

    # Setup database
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print('> Error: DBMS Exception: ' + str(e))
            print('> Database initialization failed.')

    """
    Custom responses
    """
    @app.after_request
    def after_request(response):
        if response.content_type and 'application/json' not in response.content_type:
            return response  # Skip non-JSON responses like images

        if int(response.status_code) >= 400:
            try:
                response_data = py_json.loads(response.get_data())  # Use py_json instead of json
                if "errors" in response_data:
                    response_data = {
                        "success": False,
                        "msg": list(response_data["errors"].items())[0][1]
                    }
                    response.set_data(py_json.dumps(response_data))  # Use py_json.dumps()
            except Exception:
                response_data = {
                    "success": False,
                    "msg": "An unexpected error occurred. Invalid response format."
                }
                response.set_data(py_json.dumps(response_data))  # Use py_json.dumps()

            response.headers.add('Content-Type', 'application/json')
        return response

    return app
