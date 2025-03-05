# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os, json
from flask import Flask
from flask_cors import CORS
from api.routes import rest_api  # Import Flask-RestX API
from api.models import db

app = Flask(__name__)

app.config.from_object('api.config.BaseConfig')  # Ensure this works

db.init_app(app)
CORS(app)

# Register Flask-RestX API
rest_api.init_app(app)  # This auto-registers all routes in routes.py


# Setup database
@app.before_first_request
def initialize_database():
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
    """
    Sends back a custom error with {"success", "msg"} format
    """
    if int(response.status_code) >= 400:
        try:
            response_data = json.loads(response.get_data())
            if "errors" in response_data:
                response_data = {"success": False, "msg": list(response_data["errors"].items())[0][1]}
                response.set_data(json.dumps(response_data))
        except (json.JSONDecodeError, TypeError):
            response_data = {"success": False, "msg": "An unexpected error occurred. Invalid response format."}
            response.set_data(json.dumps(response_data))

        response.headers.add('Content-Type', 'application/json')

    return response

