from flask import Blueprint, request, jsonify
import traceback

# Create VPN blueprint
vpn_bp = Blueprint('vpn', __name__)

# EXPLICIT TEST ROUTE
@vpn_bp.route('/test', methods=['GET'])
def explicit_test():
    print("🔥 EXPLICIT TEST ROUTE CALLED!")
    return jsonify({"success": True, "message": "Explicit VPN test works!"})

# CATCH-ALL ROUTE - handles ANY path
@vpn_bp.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@vpn_bp.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    print(f"🔥 CATCH-ALL ROUTE CALLED: {request.method} /{path}")
    print(f"🔥 Full URL: {request.url}")
    print(f"🔥 Headers: {dict(request.headers)}")

    # Handle test routes
    if 'test' in path or request.path.endswith('/test'):
        return jsonify({"success": True, "message": f"VPN catch-all works! Path: {path}"})

    # Handle login routes
    if 'login' in path and request.method == 'POST':
        return handle_vpn_login()

    return jsonify({"success": False, "message": f"Unknown path: {path}"}), 404

def handle_vpn_login():
    print("🔥 VPN Login via catch-all!")
    try:
        req_data = request.get_json()
        print(f"🔥 Request data: {req_data}")

        if not req_data:
            return jsonify({"success": False, "msg": "No JSON data received"}), 400

        _username = req_data.get("username")
        _password = req_data.get("password")

        if not _username or not _password:
            return jsonify({"success": False, "msg": "Username and password required"}), 400

        from api.models import Users
        from datetime import datetime, timedelta
        import jwt
        from api.config import BaseConfig

        user_exists = Users.query.filter_by(username=_username).first()

        if not user_exists:
            return jsonify({"success": False, "msg": "This username does not exist."}), 400

        if not user_exists.check_password(_password):
            return jsonify({"success": False, "msg": "Wrong credentials."}), 400

        token = jwt.encode({'username': _username, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        result = {
            "success": True,
            "token": token,
            "user": user_exists.toJSON()
        }

        print(f"🔥 VPN Login successful!")
        return jsonify(result), 200

    except Exception as e:
        print(f"🔥 VPN Login Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "msg": str(e)}), 500


