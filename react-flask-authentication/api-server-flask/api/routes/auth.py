from datetime import datetime, timezone, timedelta
from functools import wraps

import jwt
import requests
from flask import Blueprint, request
from flask_restx import Namespace, Resource, fields

from api.models import db, Users, JWTTokenBlocklist
from api.config import BaseConfig

# Create Blueprint and API instance
auth_bp = Blueprint('auth', __name__)
auth_api = Namespace('users', description="User Authentication Endpoints")

# Request Models
signup_model = auth_api.model('SignUpModel', {
    "username": fields.String(required=True, min_length=2, max_length=32),
    "email": fields.String(required=True, min_length=4, max_length=64),
    "password": fields.String(required=True, min_length=4, max_length=16),
    "role": fields.String(required=False, min_length=4, max_length=32, default='Planner')
})

login_model = auth_api.model('LoginModel', {
    "username": fields.String(required=True, min_length=2, max_length=32),
    "password": fields.String(required=True, min_length=4, max_length=16)
})

user_edit_model = auth_api.model('UserEditModel', {
    "userID": fields.String(required=True, min_length=1, max_length=32),
    "username": fields.String(required=True, min_length=2, max_length=32),
    "email": fields.String(required=True, min_length=4, max_length=64)
})

# Token authentication middleware
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        token = token.replace("Bearer ", "").strip('"')

        # Check if token is revoked (ONLY IF NOT LOGGING OUT)
        if request.path != "/api/users/logout":
            if db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar():
                return {"success": False, "msg": "Token revoked."}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            current_user = Users.query.filter_by(username=data["username"]).first()

            if not isinstance(current_user, Users):  # ✅ Ensure it's a User object
                print(f"DEBUG: User lookup failed for token: {token}")
                return {"success": False, "msg": "User not found."}, 400

            return f(current_user, *args, **kwargs)

        except jwt.ExpiredSignatureError:
            return {"success": False, "msg": "Token expired"}, 400
        except jwt.InvalidTokenError:
            return {"success": False, "msg": "Token is invalid"}, 400

    return decorator



# User Registration
@auth_api.route('/register')
class Register(Resource):
    @auth_api.expect(signup_model, validate=True)
    def post(self):
        req_data = request.get_json()
        _username, _email, _password, _role = req_data["username"], req_data["email"], req_data["password"], req_data.get("role", "Planner")

        if Users.query.filter_by(username=_username).first():
            return {"success": False, "msg": "Username already taken"}, 400

        new_user = Users(username=_username, email=_email, role=_role)
        new_user.set_password(_password)
        new_user.save()

        return {"success": True, "userID": new_user.id, "msg": "User registered successfully"}, 200

# User Login
@auth_api.route('/login')
class Login(Resource):
    """
       Login user by taking 'login_model' input and return JWT token
    """

    @auth_api.expect(login_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _username = req_data.get("username")
        _password = req_data.get("password")

        user_exists = Users.query.filter_by(username=_username).first()

        if not user_exists:
            return {"success": False,
                    "msg": "This username does not exist."}, 400

        if not user_exists.check_password(_password):
            return {"success": False,
                    "msg": "Wrong credentials."}, 400

        # create access token uwing JWT
        token = jwt.encode({'username': _username, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True,
                "token": token,
                "user": user_exists.toJSON()}, 200

# User Edit
@auth_api.route('/edit')
class EditUser(Resource):
    @auth_api.expect(user_edit_model)
    @token_required
    def post(self, current_user):
        req_data = request.get_json()
        current_user.username = req_data.get("username", current_user.username)
        current_user.email = req_data.get("email", current_user.email)
        current_user.save()

        return {"success": True, "msg": "User details updated"}, 200

# User Logout
@auth_api.route('/logout')
class LogoutUser(Resource):
    """
       Logs out User using 'logout_model' input
    """

    @token_required
    def post(self, current_user):
        _jwt_token = request.headers.get("Authorization")
        
        if not _jwt_token:
            # Token missing, maybe session expired, consider this a successful logout
            return {"success": True, "message": "No token found, already logged out"}, 200

        # Block the token if present
        jwt_block = JWTTokenBlocklist(jwt_token=_jwt_token, created_at=datetime.now(timezone.utc))
        jwt_block.save()

        self.set_jwt_auth_active(False)
        self.save()

        return {"success": True}, 200


