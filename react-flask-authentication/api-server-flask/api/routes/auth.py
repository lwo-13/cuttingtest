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
    "email": fields.String(required=True, min_length=4, max_length=64),
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
        token = request.headers.get("authorization")

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            current_user = Users.get_by_email(data["email"])

            if not current_user:
                return {"success": False, "msg": "Invalid token, user does not exist."}, 400

            if db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar():
                return {"success": False, "msg": "Token revoked."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "msg": "Token expired."}, 400

        except jwt.ExpiredSignatureError:
            return {"success": False, "msg": "Token expired"}, 400
        except jwt.InvalidTokenError:
            return {"success": False, "msg": "Token is invalid"}, 400

        return f(current_user, *args, **kwargs)

    return decorator

# User Registration
@auth_api.route('/register')
class Register(Resource):
    @auth_api.expect(signup_model, validate=True)
    def post(self):
        req_data = request.get_json()
        _username, _email, _password, _role = req_data["username"], req_data["email"], req_data["password"], req_data.get("role", "Planner")

        if Users.get_by_email(_email):
            return {"success": False, "msg": "Email already taken"}, 400

        new_user = Users(username=_username, email=_email, role=_role)
        new_user.set_password(_password)
        new_user.save()

        return {"success": True, "userID": new_user.id, "msg": "User registered successfully"}, 200

# User Login
@auth_api.route('/login')
class Login(Resource):
    @auth_api.expect(login_model, validate=True)
    def post(self):
        req_data = request.get_json()
        _email, _password = req_data["email"], req_data["password"]

        user_exists = Users.get_by_email(_email)
        if not user_exists or not user_exists.check_password(_password):
            return {"success": False, "msg": "Invalid email or password"}, 400

        token = jwt.encode({'email': _email, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)
        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True, "token": token, "user": user_exists.toJSON()}, 200

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
    @token_required
    def post(self, current_user):
        _jwt_token = request.headers["authorization"]
        JWTTokenBlocklist(jwt_token=_jwt_token, created_at=datetime.now(timezone.utc)).save()

        current_user.set_jwt_auth_active(False)
        current_user.save()

        return {"success": True, "msg": "User logged out"}, 200

# GitHub OAuth
@auth_api.route('/oauth/github')
class GitHubLogin(Resource):
    def get(self):
        code = request.args.get('code')
        client_id, client_secret = BaseConfig.GITHUB_CLIENT_ID, BaseConfig.GITHUB_CLIENT_SECRET
        root_url = 'https://github.com/login/oauth/access_token'

        params = {'client_id': client_id, 'client_secret': client_secret, 'code': code}
        data = requests.post(root_url, params=params, headers={'Content-Type': 'application/x-www-form-urlencoded'}).text
        access_token = data.split('&')[0].split('=')[1]

        user_data = requests.get('https://api.github.com/user', headers={"Authorization": "Bearer " + access_token}).json()
        
        user = Users.get_by_username(user_data['login']) or Users(username=user_data['login'], email=user_data.get('email'))
        user.save()

        token = jwt.encode({"username": user.username, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)
        user.set_jwt_auth_active(True)
        user.save()

        return {"success": True, "user": {"_id": user.id, "email": user.email, "username": user.username, "token": token}}, 200
