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
        "http://localhost:3000",                                    # Local development
        "http://172.27.57.210:3000",                               # Direct VM access (IP)
        "http://gab-navint01p.csg1.sys.calzedonia.com:3000",       # Direct VM access (DNS)
        "http://127.0.0.1:3000",                                   # Local development alternative
        "https://sslvpn1.calzedonia.com"                           # VPN proxy access
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

    # TEST ROUTE: Direct Flask route with /api prefix to test if the issue is with Flask-RESTX
    @app.route('/api/test', methods=['GET'])
    def api_test():
        print("🔥🔥🔥 DIRECT /api/test ROUTE CALLED!")
        return {"success": True, "message": "Direct /api/test route works!"}

    # DATABASE TEST ROUTE: Test database connectivity
    @app.route('/api/db-test', methods=['GET'])
    def db_test():
        print("🔥🔥🔥 DATABASE TEST ROUTE CALLED!")
        try:
            from flask import jsonify
            from api.models import Users

            # Try to query the database
            user_count = Users.query.count()
            print(f"🔥🔥🔥 USER COUNT: {user_count}")

            return jsonify({
                "success": True,
                "message": "Database connection works!",
                "user_count": user_count
            })
        except Exception as e:
            print(f"🔥🔥🔥 DATABASE TEST ERROR: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    # REAL AUTHENTICATION ROUTE: Implement actual login logic
    @app.route('/api/users/login', methods=['POST'])
    def real_login():
        print("🔥🔥🔥 REAL LOGIN ROUTE CALLED!")
        try:
            from flask import request, jsonify
            from datetime import datetime, timezone, timedelta
            import jwt
            from api.models import Users
            from api.config import BaseConfig

            # Check if request has JSON data
            if not request.is_json:
                print("🔥🔥🔥 REQUEST IS NOT JSON!")
                return jsonify({"success": False, "msg": "Request must be JSON"}), 400

            data = request.get_json()
            print(f"🔥🔥🔥 LOGIN DATA: {data}")

            # Check if required fields are present
            if not data or 'username' not in data or 'password' not in data:
                print("🔥🔥🔥 MISSING USERNAME OR PASSWORD!")
                return jsonify({"success": False, "msg": "Username and password required"}), 400

            _username = data.get("username")
            _password = data.get("password")

            print(f"🔥🔥🔥 ATTEMPTING LOGIN FOR USER: {_username}")

            # Query user from database
            try:
                user_exists = Users.query.filter_by(username=_username).first()
                print(f"🔥🔥🔥 USER QUERY RESULT: {user_exists}")
            except Exception as db_error:
                print(f"🔥🔥🔥 DATABASE QUERY ERROR: {db_error}")
                import traceback
                traceback.print_exc()
                return jsonify({"success": False, "msg": "Database connection error"}), 500

            # Check if user exists
            if not user_exists:
                print("🔥🔥🔥 USER DOES NOT EXIST!")
                return jsonify({"success": False, "msg": "This username does not exist."}), 400

            # Check password
            try:
                password_valid = user_exists.check_password(_password)
                print(f"🔥🔥🔥 PASSWORD VALIDATION RESULT: {password_valid}")
            except Exception as pwd_error:
                print(f"🔥🔥🔥 PASSWORD CHECK ERROR: {pwd_error}")
                import traceback
                traceback.print_exc()
                return jsonify({"success": False, "msg": "Password validation error"}), 500

            if not password_valid:
                print("🔥🔥🔥 INVALID PASSWORD!")
                return jsonify({"success": False, "msg": "Wrong credentials."}), 400

            # Generate JWT token
            try:
                # Use timezone-aware datetime to avoid deprecation warnings
                token_payload = {
                    'username': _username,
                    'exp': datetime.now(timezone.utc) + timedelta(minutes=30)
                }
                token = jwt.encode(token_payload, BaseConfig.SECRET_KEY, algorithm='HS256')
                print(f"🔥🔥🔥 JWT TOKEN GENERATED: {token[:20]}...")
            except Exception as jwt_error:
                print(f"🔥🔥🔥 JWT TOKEN GENERATION ERROR: {jwt_error}")
                import traceback
                traceback.print_exc()
                return jsonify({"success": False, "msg": "Token generation error"}), 500

            # Update user JWT status
            try:
                user_exists.set_jwt_auth_active(True)
                user_exists.save()
                print("🔥🔥🔥 USER JWT STATUS UPDATED")
            except Exception as save_error:
                print(f"🔥🔥🔥 USER SAVE ERROR: {save_error}")
                import traceback
                traceback.print_exc()
                # Don't fail login if we can't update status, just log it

            # Prepare response
            try:
                user_data = user_exists.toJSON()
                print(f"🔥🔥🔥 USER DATA: {user_data}")

                response = {
                    "success": True,
                    "token": token,
                    "user": user_data
                }
                print(f"🔥🔥🔥 LOGIN SUCCESSFUL FOR USER: {_username}")
                return jsonify(response), 200

            except Exception as response_error:
                print(f"🔥🔥🔥 RESPONSE PREPARATION ERROR: {response_error}")
                import traceback
                traceback.print_exc()
                return jsonify({"success": False, "msg": "Response preparation error"}), 500

        except Exception as e:
            print(f"🔥🔥🔥 GENERAL LOGIN ERROR: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"success": False, "msg": f"Login error: {str(e)}"}), 500

    # Register Blueprints and add namespaces FIRST
    register_blueprints(app)

    # Initialize REST API AFTER namespaces are added
    try:
        rest_api.init_app(app)
        print("✅ Flask-RESTX initialized successfully")
    except Exception as e:
        print(f"❌ Flask-RESTX initialization failed: {e}")
        print("🔧 Continuing without Flask-RESTX...")

    # CRITICAL FIX: Add custom error handlers to return JSON instead of HTML
    @app.errorhandler(404)
    def not_found(error):
        return {"success": False, "message": "The requested URL was not found."}, 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {"success": False, "message": "The method is not allowed for the requested URL."}, 405

    @app.errorhandler(500)
    def internal_error(error):
        return {"success": False, "message": "Internal server error occurred."}, 500

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
