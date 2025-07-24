from flask import Blueprint, jsonify, request

# Create a Blueprint for the root route
root_bp = Blueprint('root', __name__)

@root_bp.route('/', methods=['GET'])
def home():
    return jsonify({"success": True, "msg": "Welcome to the API"}), 200

# VPN TEST ENDPOINT - Simple GET request to test VPN connectivity
@root_bp.route('/vpn-test', methods=['GET'])
def vpn_test():
    print("🔥 VPN TEST ENDPOINT CALLED!")
    print(f"🔥 Request URL: {request.url}")
    print(f"🔥 Request headers: {dict(request.headers)}")
    print(f"🔥 Remote addr: {request.remote_addr}")
    return jsonify({
        "success": True,
        "msg": "VPN test endpoint works!",
        "url": request.url,
        "headers": dict(request.headers),
        "remote_addr": request.remote_addr
    }), 200