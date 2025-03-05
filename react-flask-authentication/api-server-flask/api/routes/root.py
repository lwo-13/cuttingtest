from flask import Blueprint, jsonify

# Create a Blueprint for the root route
root_bp = Blueprint('root', __name__)

@root_bp.route('/', methods=['GET'])
def home():
    return jsonify({"success": True, "msg": "Welcome to the API"}), 200