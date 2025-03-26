# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
import random
import string
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.realpath(__file__))

class BaseConfig():
    
    SECRET_KEY = os.getenv('SECRET_KEY') or ''.join(random.choice(string.ascii_lowercase) for _ in range(32))
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or ''.join(random.choice(string.ascii_lowercase) for _ in range(32))

    GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_SECRET_KEY')
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

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