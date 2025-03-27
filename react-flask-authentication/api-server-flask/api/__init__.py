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

    # Initialize database
    db.init_app(app)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "http://172.27.57.210:3000"}}, supports_credentials=True)
    
    # Register Blueprints (auth, markers, etc.)
    register_blueprints(app)
    
    rest_api.init_app(app)

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
