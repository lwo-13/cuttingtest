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
    """Flask application factory function - SINGLE PORT SOLUTION"""
    # Configure Flask to serve React build files (Docker container paths)
    app = Flask(__name__,
                static_folder='../react-ui/build/static',
                template_folder='../react-ui/build')

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

    # SINGLE PORT SOLUTION: Register React routes BEFORE Flask-RESTX
    # This ensures our React routes take precedence over Flask-RESTX routes

    # Register React serving routes FIRST
    @app.route('/')
    def serve_react_app():
        """Serve the main React application"""
        try:
            print("🔥🔥🔥 SERVING REACT APP FROM ROOT")
            from flask import send_from_directory
            import os

            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'
            print(f"🔥🔥🔥 USING ABSOLUTE DOCKER PATH: {build_dir}")

            index_path = os.path.join(build_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(build_dir, 'index.html')
            else:
                return {"error": "React build not found", "build_dir": build_dir}, 500

        except Exception as e:
            print(f"🔥🔥🔥 ERROR SERVING REACT APP: {e}")
            return {"error": "React app serving error", "details": str(e)}, 500

    # ENHANCED VPN PROXY ROUTE: Handle VPN proxy path with better debugging
    @app.route('/web_forward_CuttingApplicationAPI/')
    @app.route('/web_forward_CuttingApplicationAPI/<path:path>')
    def serve_react_app_vpn(path=''):
        """Serve React app for VPN proxy access with enhanced debugging"""
        try:
            print("🔥🔥🔥 VPN PROXY REQUEST RECEIVED")
            print(f"🔥🔥🔥 Request path: {path}")
            print(f"🔥🔥🔥 Request method: {request.method}")
            print(f"🔥🔥🔥 Request headers: {dict(request.headers)}")
            print(f"🔥🔥🔥 Request remote addr: {request.remote_addr}")
            print(f"🔥🔥🔥 Request user agent: {request.headers.get('User-Agent', 'Unknown')}")

            from flask import send_from_directory
            import os

            # If it's an API request, let Flask handle it normally
            if path.startswith('api/'):
                print(f"🔥🔥🔥 API REQUEST DETECTED: {path}")
                # This will be handled by Flask-RESTX routes
                return {"error": "API endpoint not found", "path": path}, 404

            # For all other requests, serve React app
            print("🔥🔥🔥 SERVING REACT APP FROM VPN PROXY PATH")

            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'
            print(f"🔥🔥🔥 VPN PROXY - USING ABSOLUTE DOCKER PATH: {build_dir}")

            index_path = os.path.join(build_dir, 'index.html')
            if os.path.exists(index_path):
                print("🔥🔥🔥 INDEX.HTML FOUND - SERVING REACT APP")
                return send_from_directory(build_dir, 'index.html')
            else:
                print(f"🔥🔥🔥 INDEX.HTML NOT FOUND AT: {index_path}")
                return {"error": "React build not found", "build_dir": build_dir, "index_path": index_path}, 500

        except Exception as e:
            print(f"🔥🔥🔥 ERROR SERVING VPN REACT APP: {e}")
            import traceback
            print(f"🔥🔥🔥 TRACEBACK: {traceback.format_exc()}")
            return {"error": "VPN React app serving error", "details": str(e)}, 500

    # NETWORK CONNECTIVITY TEST ENDPOINT
    @app.route('/network-test')
    @app.route('/web_forward_CuttingApplicationAPI/network-test')
    def network_test():
        """Test endpoint for network connectivity debugging"""
        import datetime
        import socket

        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
        except:
            hostname = "unknown"
            local_ip = "unknown"

        return {
            "status": "success",
            "message": "Network connectivity test successful",
            "timestamp": datetime.datetime.now().isoformat(),
            "server_info": {
                "hostname": hostname,
                "local_ip": local_ip,
                "flask_env": os.environ.get('FLASK_ENV', 'unknown')
            },
            "request_info": {
                "remote_addr": request.remote_addr,
                "user_agent": request.headers.get('User-Agent', 'Unknown'),
                "method": request.method,
                "path": request.path,
                "headers": dict(request.headers)
            }
        }

    # HEALTH CHECK ENDPOINT
    @app.route('/health')
    @app.route('/web_forward_CuttingApplicationAPI/health')
    def health_check():
        """Health check endpoint for monitoring and load balancers"""
        import datetime

        # Test database connection
        db_status = "unknown"
        try:
            db.session.execute('SELECT 1')
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        # Check React build files
        react_status = "unknown"
        try:
            import os
            build_dir = '/app/react-ui/build'
            index_path = os.path.join(build_dir, 'index.html')
            if os.path.exists(index_path):
                react_status = "available"
            else:
                react_status = "missing"
        except Exception as e:
            react_status = f"error: {str(e)}"

        overall_status = "healthy" if db_status == "connected" and react_status == "available" else "unhealthy"

        return {
            "status": overall_status,
            "timestamp": datetime.datetime.now().isoformat(),
            "components": {
                "database": db_status,
                "react_build": react_status,
                "flask": "running"
            },
            "version": "single-port-enhanced"
        }

    # Now register Flask-RESTX (it won't override our root route)
    register_blueprints(app)
    try:
        rest_api.init_app(app)
        print("✅ Flask-RESTX initialized successfully (after React routes)")
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

    # DUPLICATE REMOVED - React route is now registered before Flask-RESTX above

    @app.route('/<path:path>')
    def serve_react_routes(path):
        """Handle React client-side routing and static files"""
        print(f"🔥🔥🔥 SERVING PATH: {path}")

        # If it's an API route, let Flask handle it normally (will return 404 if not found)
        if path.startswith('api/') or path.startswith('users/'):
            print(f"🔥🔥🔥 API ROUTE NOT FOUND: {path}")
            return {"error": "API endpoint not found", "path": path}, 404

        # If it's a static file request, try to serve it from the build directory
        if '.' in path and not path.endswith('.html'):
            try:
                print(f"🔥🔥🔥 SERVING STATIC FILE: {path}")
                from flask import send_from_directory
                import os

                # Docker container path: /app/react-ui/build
                build_dir = '/app/react-ui/build'

                # For static files, they're usually in build/static/ subdirectory
                if path.startswith('static/'):
                    file_path = os.path.join(build_dir, path)
                    if os.path.exists(file_path):
                        return send_from_directory(build_dir, path)

                # Try serving from root build directory
                file_path = os.path.join(build_dir, path)
                if os.path.exists(file_path):
                    return send_from_directory(build_dir, path)

                print(f"🔥🔥🔥 STATIC FILE NOT FOUND: {path}")
                return {"error": "Static file not found", "path": path}, 404

            except Exception as e:
                print(f"🔥🔥🔥 ERROR SERVING STATIC FILE: {e}")
                return {"error": "Static file error", "path": path, "details": str(e)}, 404

        # For all other routes (React client-side routing), serve the React app
        try:
            print(f"🔥🔥🔥 SERVING REACT ROUTE: {path}")
            from flask import send_from_directory
            import os

            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'

            return send_from_directory(build_dir, 'index.html')

        except Exception as e:
            print(f"🔥🔥🔥 ERROR SERVING REACT ROUTE: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": "React route serving error",
                "message": "Error serving React route",
                "path": path,
                "details": str(e)
            }, 500

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
