# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
from datetime import timedelta
import pytz

BASE_DIR = os.path.dirname(os.path.realpath(__file__))

class BaseConfig():
    
    SECRET_KEY = 'internal-app-secret-key'
    JWT_SECRET_KEY = 'internal-app-jwt-key'

    GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_SECRET_KEY')
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Timezone configuration - Change this to your timezone
    TIMEZONE = pytz.timezone('Europe/Sofia')  # Bulgaria timezone (UTC+2/UTC+3)

    # MS SQL Server Credentials
    DB_ENGINE = 'mssql+pyodbc'
    DB_USERNAME = 'sa'
    DB_PASS = 'sqladmin'
    DB_HOST = '172.27.57.201'
    DB_PORT = '1433'  # Default SQL Server port
    DB_NAME = 'CuttingRoom'

    # Build the SQLAlchemy connection string for MS SQL Server using ODBC 18
    SQLALCHEMY_DATABASE_URI = (
    f"mssql+pyodbc://{DB_USERNAME}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
    )