# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from datetime import datetime, timezone, timedelta

from functools import wraps

from flask import request
from flask_restx import Api, Resource, fields

import jwt

from .models import db, Users, JWTTokenBlocklist, MarkerHeader, MarkerLine, OrderLinesView
from .config import BaseConfig
import requests
import xml.etree.ElementTree as ET
import os

import json

rest_api = Api(version="1.0", title="Users API")


"""
    Flask-Restx models for api request and response data
"""

signup_model = rest_api.model('SignUpModel', {"username": fields.String(required=True, min_length=2, max_length=32),
                                              "email": fields.String(required=True, min_length=4, max_length=64),
                                              "password": fields.String(required=True, min_length=4, max_length=16),
                                              "role": fields.String(required=False, min_length=4, max_length=32, default='Planner')
                                              })

login_model = rest_api.model('LoginModel', {"email": fields.String(required=True, min_length=4, max_length=64),
                                            "password": fields.String(required=True, min_length=4, max_length=16)
                                            })

user_edit_model = rest_api.model('UserEditModel', {"userID": fields.String(required=True, min_length=1, max_length=32),
                                                   "username": fields.String(required=True, min_length=2, max_length=32),
                                                   "email": fields.String(required=True, min_length=4, max_length=64)
                                                   })


"""
   Helper function for JWT token required
"""

def token_required(f):

    @wraps(f)
    def decorator(*args, **kwargs):

        token = None

        if "authorization" in request.headers:
            token = request.headers["authorization"]

        if not token:
            return {"success": False, "msg": "Valid JWT token is missing"}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
            current_user = Users.get_by_email(data["email"])

            if not current_user:
                return {"success": False,
                        "msg": "Sorry. Wrong auth token. This user does not exist."}, 400

            token_expired = db.session.query(JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "msg": "Token revoked."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "msg": "Token expired."}, 400

        except:
            return {"success": False, "msg": "Token is invalid"}, 400

        return f(current_user, *args, **kwargs)

    return decorator


"""
    Flask-Restx routes
"""


@rest_api.route('/api/users/register')
class Register(Resource):
    """
       Creates a new user by taking 'signup_model' input
    """

    @rest_api.expect(signup_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _username = req_data.get("username")
        _email = req_data.get("email")
        _password = req_data.get("password")
        _role = req_data.get("role", "Planner")

        user_exists = Users.get_by_email(_email)
        if user_exists:
            return {"success": False,
                    "msg": "Email already taken"}, 400

        new_user = Users(username=_username, email=_email, role=_role)

        new_user.set_password(_password)
        new_user.save()

        return {"success": True,
                "userID": new_user.id,
                "msg": "The user was successfully registered"}, 200


@rest_api.route('/api/users/login')
class Login(Resource):
    """
       Login user by taking 'login_model' input and return JWT token
    """

    @rest_api.expect(login_model, validate=True)
    def post(self):

        req_data = request.get_json()

        _email = req_data.get("email")
        _password = req_data.get("password")

        user_exists = Users.get_by_email(_email)

        if not user_exists:
            return {"success": False,
                    "msg": "This email does not exist."}, 400

        if not user_exists.check_password(_password):
            return {"success": False,
                    "msg": "Wrong credentials."}, 400

        # create access token uwing JWT
        token = jwt.encode({'email': _email, 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)

        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True,
                "token": token,
                "user": user_exists.toJSON()}, 200


@rest_api.route('/api/users/edit')
class EditUser(Resource):
    """
       Edits User's username or password or both using 'user_edit_model' input
    """

    @rest_api.expect(user_edit_model)
    @token_required
    def post(self, current_user):

        req_data = request.get_json()

        _new_username = req_data.get("username")
        _new_email = req_data.get("email")

        if _new_username:
            self.update_username(_new_username)

        if _new_email:
            self.update_email(_new_email)

        self.save()

        return {"success": True}, 200


@rest_api.route('/api/users/logout')
class LogoutUser(Resource):
    """
       Logs out User using 'logout_model' input
    """

    @token_required
    def post(self, current_user):

        _jwt_token = request.headers["authorization"]

        jwt_block = JWTTokenBlocklist(jwt_token=_jwt_token, created_at=datetime.now(timezone.utc))
        jwt_block.save()

        self.set_jwt_auth_active(False)
        self.save()

        return {"success": True}, 200


@rest_api.route('/api/sessions/oauth/github/')
class GitHubLogin(Resource):
    def get(self):
        code = request.args.get('code')
        client_id = BaseConfig.GITHUB_CLIENT_ID
        client_secret = BaseConfig.GITHUB_CLIENT_SECRET
        root_url = 'https://github.com/login/oauth/access_token'

        params = { 'client_id': client_id, 'client_secret': client_secret, 'code': code }

        data = requests.post(root_url, params=params, headers={
            'Content-Type': 'application/x-www-form-urlencoded',
        })

        response = data._content.decode('utf-8')
        access_token = response.split('&')[0].split('=')[1]

        user_data = requests.get('https://api.github.com/user', headers={
            "Authorization": "Bearer " + access_token
        }).json()
        
        user_exists = Users.get_by_username(user_data['login'])
        if user_exists:
            user = user_exists
        else:
            try:
                user = Users(username=user_data['login'], email=user_data['email'])
                user.save()
            except:
                user = Users(username=user_data['login'])
                user.save()
        
        user_json = user.toJSON()

        token = jwt.encode({"username": user_json['username'], 'exp': datetime.utcnow() + timedelta(minutes=30)}, BaseConfig.SECRET_KEY)
        user.set_jwt_auth_active(True)
        user.save()

        return {"success": True,
                "user": {
                    "_id": user_json['_id'],
                    "email": user_json['email'],
                    "username": user_json['username'],
                    "token": token,
                }}, 200
    
@rest_api.route('/api/marker_headers', methods=['GET'])
class MarkerHeaders(Resource):
    def get(self):
        try:
            # Apply filter directly in the query
            headers = MarkerHeader.query.filter_by(status='ACTIVE').all()
            
            result = []
            for header in headers:
                result.append({
                    "id": header.id,
                    "marker_name": header.marker_name,
                    "marker_width": header.marker_width,
                    "marker_length": header.marker_length,
                    "efficiency": header.efficiency,
                    "total_pcs": header.total_pcs,
                    "creation_type": header.creation_type,
                    "model": header.model,
                    "variant": header.variant
                })
            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
        
@rest_api.route('/api/marker_headers_planning', methods=['GET'])
class MarkerHeadersPlanning(Resource):
    def get(self):
        try:
            # Fetch only ACTIVE markers
            headers = MarkerHeader.query.filter_by(status='ACTIVE').all()
            
            # Return only required fields
            result = [{
                "marker_name": header.marker_name,
                "marker_width": header.marker_width,
                "marker_length": header.marker_length
            } for header in headers]

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

        
@rest_api.route('/api/import_marker', methods=['POST'])
class ImportMarker(Resource):
    def post(self):
        try:
            # Check for uploaded file
            if 'file' not in request.files:
                return {"success": False, "msg": "No file uploaded"}, 400

            file = request.files['file']

            if file.filename == '':
                return {"success": False, "msg": "No selected file"}, 400

            # Get user-edited data if available
            updated_data = json.loads(request.form.get('updatedData', '[]'))
            has_edits = request.form.get('hasEdits', 'false') == 'true'

            # Parse XML file
            tree = ET.parse(file)
            root = tree.getroot()

            # ======================== Extract <Marker> Data ==========================
            marker_elem = root.find('Marker')
            full_marker_name = marker_elem.attrib.get('Name', '').upper()
            marker_name = os.path.splitext(os.path.basename(full_marker_name))[0]
            
            existing_marker = db.session.query(MarkerHeader).filter_by(marker_name=marker_name).first()
            if existing_marker:
                return {"success": False, "msg": f"Marker '{marker_name}' already exists"}, 409  # Use 409 Conflict

            # ======================== Extract <Fabric> Data ==========================
            fabric_elem = root.find('Fabric')
            marker_type = fabric_elem.attrib.get('MarkerType', '').upper()
            fabric_code = fabric_elem.attrib.get('Code', '').upper()
            fabric_type = fabric_elem.attrib.get('Type', '').upper()
            constraint_file = fabric_elem.attrib.get('ConstraintFile', '').upper()

            # ==================== Extract <WidthDescription> Data ====================
            width_elem = root.find('WidthDescription')
            marker_width = width_elem.find('Width').attrib.get('Value', 0).replace(',', '.')
            marker_length = width_elem.find('Length').attrib.get('Value', 0).replace(',', '.')
            efficiency = width_elem.find('Efficiency').attrib.get('Value', 0).replace(',', '.')
            meters_by_variants = width_elem.find('MetersByVariants').attrib.get('Value', 0).replace(',', '.')

            # ====================== Extract <Tolerances> Data ========================
            tolerances_elem = root.find('Tolerances')
            global_spacing = tolerances_elem.find('GlobalSpacing').attrib.get('Value', 0).replace(',', '.')

            fabric_edges = tolerances_elem.find('FabricEdges')
            spacing_top = fabric_edges.find('Top').attrib.get('Value', 0).replace(',', '.')
            spacing_bottom = fabric_edges.find('Bottom').attrib.get('Value', 0).replace(',', '.')
            spacing_right = fabric_edges.find('Right').attrib.get('Value', 0).replace(',', '.')
            spacing_left = fabric_edges.find('Left').attrib.get('Value', 0).replace(',', '.')

            # ===================== Extract <Statistics> Data ========================
            statistics_elem = tolerances_elem.find('Statistics')
            perimeter = statistics_elem.find('Perimeter').attrib.get('Value', 0).replace(',', '.')
            lines = statistics_elem.find('Lines').attrib.get('Value', '0').replace(',', '.')
            curves = statistics_elem.find('Curves').attrib.get('Value', 0).replace(',', '.')
            area = statistics_elem.find('Area').attrib.get('Value', 0).replace(',', '.')
            angles = statistics_elem.find('Angles').attrib.get('Value', 0)
            notches = statistics_elem.find('Notches').attrib.get('Value', 0)
            cut_perimeter = statistics_elem.find('CutPerimeter').attrib.get('Value', 0).replace(',', '.')
            total_pieces = statistics_elem.find('TotalPieces').attrib.get('Value', 0)

            # ===================== Extract <MarkerContent> ==========================
            marker_content = root.find('.//MarkerContent')
            model = ''
            variant = ''

            if marker_content is not None:
                all_variants = marker_content.findall('NewVariant')
                if all_variants:
                    first_variant = all_variants[0]
                    model_elem = first_variant.find('Model')
                    variant_elem = first_variant.find('Variant')

                    model = model_elem.attrib.get('Value', '').strip() if model_elem is not None else ''
                    variant = variant_elem.attrib.get('Value', '').strip() if variant_elem is not None else ''

            # ===================== Creation Type ==========================
            creation_type = request.form.get('creationType').upper()
            
            # ===================== Save MarkerHeader ==========================
            new_marker = MarkerHeader(
                marker_name=marker_name,
                marker_type=marker_type,
                fabric_code=fabric_code,
                fabric_type=fabric_type,
                constraint=constraint_file,
                marker_width=float(marker_width),
                marker_length=float(marker_length),
                efficiency=float(efficiency),
                average_consumption=float(meters_by_variants),
                spacing_around_pieces=float(global_spacing),
                spacing_around_pieces_top=float(spacing_top),
                spacing_around_pieces_bottom=float(spacing_bottom),
                spacing_around_pieces_right=float(spacing_right),
                spacing_around_pieces_left=float(spacing_left),
                perimeter=float(perimeter),
                lines=float(lines),
                curves=float(curves),
                areas=float(area),
                angles=int(angles),
                notches=int(notches),
                cutting_perimeter=float(cut_perimeter),
                total_pcs=int(total_pieces),
                model=model,
                variant=variant,
                status='ACTIVE',
                creation_type=creation_type
            )

            db.session.add(new_marker)
            db.session.commit()

            # ===================== Save MarkerLines (Variants) ==========================
            if marker_content is not None:
                for i, variant in enumerate(all_variants):
                    # Extract data from XML
                    size_elem = variant.find('Size')
                    quantity_elem = variant.find('Quantity')

                    size = size_elem.attrib.get('Value', '').strip() if size_elem is not None else ''
                    quantity = quantity_elem.attrib.get('Value', '').strip() if quantity_elem is not None else ''
                    model_elem = variant.find('Model')
                    model = model_elem.attrib.get('Value', '').strip() if model_elem is not None else ''

                    # ✅ Use user-edited data if available
                    if has_edits and i < len(updated_data):
                        updated_variant = updated_data[i]
                        size = updated_variant.get('size', size)
                        quantity = updated_variant.get('qty', quantity)
                        model = updated_variant.get('style', model)

                    # Save to MarkerLine table
                    new_marker_line = MarkerLine(
                        marker_header_id=new_marker.id,
                        style=model,
                        size=size,
                        style_size=f"{model} {size}",
                        pcs_on_layer=float(quantity),
                    )

                    db.session.add(new_marker_line)

                db.session.commit()

            return {"success": True, "msg": f"Marker '{marker_name}' imported"}, 201

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
        
        
@rest_api.route('/api/order_lines')
class OrderLines(Resource):
    def get(self):
        try:
            # Fetch all data (no pagination)
            data = OrderLinesView.query.order_by(OrderLinesView.order_commessa).all()

            # Convert results to dictionary format
            data_list = [row.to_dict() for row in data]

            return {
                "success": True,
                "data": data_list
            }, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


