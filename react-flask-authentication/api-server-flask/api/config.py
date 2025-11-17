# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
import random
import string
import json
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.realpath(__file__))

def load_database_config():
    """Load database configuration from serverSettings.json file"""
    server_settings_path = os.path.join(BASE_DIR, '..', 'static', 'serverSettings.json')

    # Default values (fallback)
    defaults = {
        'host': '172.27.57.201',
        'port': '1433',
        'name': 'CuttingRoom',
        'user': 'sa',
        'password': 'sqladmin',
        'odbc_driver': 'ODBC Driver 18 for SQL Server'
    }

    try:
        if os.path.exists(server_settings_path):
            with open(server_settings_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {
                    'host': data.get('databaseHost', defaults['host']),
                    'port': data.get('databasePort', defaults['port']),
                    'name': data.get('databaseName', defaults['name']),
                    'user': data.get('databaseUser', defaults['user']),
                    'password': data.get('databasePassword', defaults['password']),
                    'odbc_driver': data.get('odbcDriver', defaults['odbc_driver'])
                }
    except Exception as e:
        print(f"[CONFIG] Error loading database config from file: {e}")

    return defaults

class BaseConfig():

    SECRET_KEY = os.getenv('SECRET_KEY') or ''.join(random.choice(string.ascii_lowercase) for _ in range(32))
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or ''.join(random.choice(string.ascii_lowercase) for _ in range(32))

    GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_SECRET_KEY')

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Load database credentials from serverSettings.json
    _db_config = load_database_config()
    DB_ENGINE = 'mssql+pyodbc'
    DB_USERNAME = _db_config['user']
    DB_PASS = _db_config['password']
    DB_HOST = _db_config['host']
    DB_PORT = _db_config['port']
    DB_NAME = _db_config['name']
    DB_ODBC_DRIVER = _db_config['odbc_driver']

    # Build the SQLAlchemy connection string for MS SQL Server using ODBC
    # Replace spaces with + in driver name for URL encoding
    driver_for_url = DB_ODBC_DRIVER.replace(' ', '+')
    SQLALCHEMY_DATABASE_URI = (
    f"mssql+pyodbc://{DB_USERNAME}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    f"?driver={driver_for_url}&TrustServerCertificate=yes&charset=utf8"
    )