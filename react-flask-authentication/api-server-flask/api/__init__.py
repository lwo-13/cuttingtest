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



    # TEST ROUTE: Direct Flask route with /api prefix to test if the issue is with Flask-RESTX
    @app.route('/api/test', methods=['GET'])
    def api_test():
        return {"success": True, "message": "API test route works!"}

    # DATABASE TEST ROUTE: Test database connectivity
    @app.route('/api/db-test', methods=['GET'])
    def db_test():
        try:
            from flask import jsonify
            from api.models import Users

            # Try to query the database
            user_count = Users.query.count()

            return jsonify({
                "success": True,
                "message": "Database connection works!",
                "user_count": user_count
            })
        except Exception as e:
            return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    # AUTHENTICATION ROUTE: Implement actual login logic
    @app.route('/api/users/login', methods=['POST'])
    def real_login():
        try:
            from flask import request, jsonify
            from datetime import datetime, timezone, timedelta
            import jwt
            from api.models import Users
            from api.config import BaseConfig

            # Check if request has JSON data
            if not request.is_json:
                return jsonify({"success": False, "msg": "Request must be JSON"}), 400

            data = request.get_json()

            # Check if required fields are present
            if not data or 'username' not in data or 'password' not in data:
                return jsonify({"success": False, "msg": "Username and password required"}), 400

            _username = data.get("username")
            _password = data.get("password")

            # Query user from database
            try:
                user_exists = Users.query.filter_by(username=_username).first()
            except Exception as db_error:
                return jsonify({"success": False, "msg": "Database connection error"}), 500

            # Check if user exists
            if not user_exists:
                return jsonify({"success": False, "msg": "This username does not exist."}), 400

            # Check password
            try:
                password_valid = user_exists.check_password(_password)
            except Exception as pwd_error:
                return jsonify({"success": False, "msg": "Password validation error"}), 500

            if not password_valid:
                return jsonify({"success": False, "msg": "Wrong credentials."}), 400

            # Generate JWT token
            try:
                # Use timezone-aware datetime to avoid deprecation warnings
                token_payload = {
                    'username': _username,
                    'exp': datetime.now(timezone.utc) + timedelta(minutes=30)
                }
                token = jwt.encode(token_payload, BaseConfig.SECRET_KEY, algorithm='HS256')
            except Exception as jwt_error:
                return jsonify({"success": False, "msg": "Token generation error"}), 500

            # Update user JWT status
            try:
                user_exists.set_jwt_auth_active(True)
                user_exists.save()
            except Exception as save_error:
                # Don't fail login if we can't update status, just log it
                pass

            # Prepare response
            try:
                user_data = user_exists.toJSON()

                response = {
                    "success": True,
                    "token": token,
                    "user": user_data
                }
                return jsonify(response), 200

            except Exception as response_error:
                return jsonify({"success": False, "msg": "Response preparation error"}), 500

        except Exception as e:
            return jsonify({"success": False, "msg": f"Login error: {str(e)}"}), 500

    # SINGLE PORT SOLUTION: Register React routes BEFORE Flask-RESTX
    # This ensures our React routes take precedence over Flask-RESTX routes

    # Register React serving routes FIRST
    @app.route('/')
    def serve_react_app():
        """Serve the main React application"""
        try:
            from flask import send_from_directory
            import os

            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'

            index_path = os.path.join(build_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(build_dir, 'index.html')
            else:
                return {"error": "React build not found", "build_dir": build_dir}, 500

        except Exception as e:
            return {"error": "React app serving error", "details": str(e)}, 500

    # ENHANCED VPN PROXY ROUTE: Handle VPN proxy path with better debugging
    @app.route('/web_forward_CuttingApplicationAPI/')
    @app.route('/web_forward_CuttingApplicationAPI/<path:path>')
    def serve_react_app_vpn(path=''):
        """Serve React app for VPN proxy access"""
        try:

            from flask import send_from_directory
            import os

            # CRITICAL FIX: Proxy API requests to regular API routes
            if path.startswith('api/'):
                # Remove the VPN prefix and forward to regular API
                api_path = '/' + path  # Convert 'api/count' to '/api/count'

                # Import Flask's test client to make internal request
                from flask import current_app
                with current_app.test_client() as client:
                    # Forward the request with all headers and data
                    if request.method == 'GET':
                        response = client.get(api_path,
                                            headers=dict(request.headers),
                                            query_string=request.query_string)
                    elif request.method == 'POST':
                        response = client.post(api_path,
                                             headers=dict(request.headers),
                                             data=request.get_data(),
                                             query_string=request.query_string)
                    elif request.method == 'PUT':
                        response = client.put(api_path,
                                            headers=dict(request.headers),
                                            data=request.get_data(),
                                            query_string=request.query_string)
                    elif request.method == 'DELETE':
                        response = client.delete(api_path,
                                               headers=dict(request.headers),
                                               query_string=request.query_string)
                    else:
                        return {"error": "Method not allowed"}, 405



                    # Return the response from the internal API call
                    from flask import Response
                    return Response(
                        response.get_data(),
                        status=response.status_code,
                        headers=dict(response.headers),
                        mimetype=response.mimetype
                    )

            # CRITICAL FIX: Handle static assets (JS, CSS, images)
            if path.startswith('static/'):

                build_dir = '/app/react-ui/build'
                asset_path = os.path.join(build_dir, path)
                if os.path.exists(asset_path):

                    from flask import make_response
                    response = make_response(send_from_directory(build_dir, path))
                    # Add cache control headers to prevent 304 issues
                    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                    response.headers['Pragma'] = 'no-cache'
                    response.headers['Expires'] = '0'
                    return response
                else:

                    return {"error": "Static asset not found", "path": path}, 404

            # Handle manifest.json and other root files
            if path in ['manifest.json', 'favicon.ico', 'robots.txt', 'asset-manifest.json']:
                build_dir = '/app/react-ui/build'
                asset_path = os.path.join(build_dir, path)
                if os.path.exists(asset_path):
                    from flask import make_response
                    response = make_response(send_from_directory(build_dir, path))
                    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                    response.headers['Pragma'] = 'no-cache'
                    response.headers['Expires'] = '0'
                    return response

            # For all other requests (React routes), serve React app
            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'

            index_path = os.path.join(build_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(build_dir, 'index.html')
            else:
                return {"error": "React build not found", "build_dir": build_dir, "index_path": index_path}, 500

        except Exception as e:
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

    # SIMPLE TEST ROUTE - Add this before Flask-RESTX to test if routes work
    @app.route('/simple-test')
    @app.route('/web_forward_CuttingApplicationAPI/simple-test')
    def simple_test():
        import datetime
        return {"status": "success", "message": "Simple test route works!", "timestamp": str(datetime.datetime.now())}

    # Now register Flask-RESTX (it won't override our root route)
    register_blueprints(app)

    try:
        rest_api.init_app(app)
    except Exception as e:
        # Continue without Flask-RESTX if it fails
        pass



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

        # If it's an API route, let Flask handle it normally (will return 404 if not found)
        if path.startswith('api/') or path.startswith('users/'):
            return {"error": "API endpoint not found", "path": path}, 404

        # Handle static assets for non-VPN paths
        if path.startswith('static/'):
            build_dir = '/app/react-ui/build'
            asset_path = os.path.join(build_dir, path)
            if os.path.exists(asset_path):
                return send_from_directory(build_dir, path)
            else:
                return {"error": "Static asset not found", "path": path}, 404

        # If it's a static file request, try to serve it from the build directory
        if '.' in path and not path.endswith('.html'):
            try:

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


                return {"error": "Static file not found", "path": path}, 404

            except Exception as e:
                return {"error": "Static file error", "path": path, "details": str(e)}, 404

        # For all other routes (React client-side routing), serve the React app
        try:

            from flask import send_from_directory
            import os

            # Docker container path: /app/react-ui/build
            build_dir = '/app/react-ui/build'

            return send_from_directory(build_dir, 'index.html')

        except Exception as e:
            return {
                "error": "React route serving error",
                "message": "Error serving React route",
                "path": path,
                "details": str(e)
            }, 500



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
