# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""


from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.inspection import inspect

db = SQLAlchemy()


class Users(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(32, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    email = db.Column(db.String(64, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    password = db.Column(db.Text(collation='SQL_Latin1_General_CP1_CI_AS'))
    jwt_auth_active = db.Column(db.Boolean, nullable=True)
    date_joined = db.Column(db.DateTime, nullable=True)
    role = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)

    def __repr__(self):
        return f"User {self.username}"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def update_email(self, new_email):
        self.email = new_email

    def update_username(self, new_username):
        self.username = new_username

    def check_jwt_auth_active(self):
        return self.jwt_auth_active

    def set_jwt_auth_active(self, set_status):
        self.jwt_auth_active = set_status

    @classmethod
    def get_by_id(cls, id):
        return cls.query.get_or_404(id)

    @classmethod
    def get_by_email(cls, email):
        return cls.query.filter_by(email=email).first()
    
    @classmethod
    def get_by_username(cls, username):
        return cls.query.filter_by(username=username).first()

    def toDICT(self):
        return {
            '_id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role
        }

    def toJSON(self):
        return self.toDICT()


class JWTTokenBlocklist(db.Model):
    __tablename__ = 'jwt_token_blocklist'

    id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # Matches MS SQL primary key definition
    jwt_token = db.Column(db.Text(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f"Expired Token: {self.jwt_token}"

    def save(self):
        db.session.add(self)
        db.session.commit()

class MarkerHeader(db.Model):
    __tablename__ = 'marker_headers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    marker_name = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    marker_width = db.Column(db.Float, nullable=False)
    marker_length = db.Column(db.Float, nullable=False)
    marker_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    fabric_code = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    fabric_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    constraint = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    spacing_around_pieces = db.Column(db.Float, nullable=True)
    spacing_around_pieces_top = db.Column(db.Float, nullable=True)
    spacing_around_pieces_bottom = db.Column(db.Float, nullable=True)
    spacing_around_pieces_right = db.Column(db.Float, nullable=True)
    spacing_around_pieces_left = db.Column(db.Float, nullable=True)
    efficiency = db.Column(db.Float, nullable=True)
    cutting_perimeter = db.Column(db.Float, nullable=True)
    perimeter = db.Column(db.Float, nullable=True)
    average_consumption = db.Column(db.Float, nullable=True)
    lines = db.Column(db.Float, nullable=True)
    curves = db.Column(db.Float, nullable=True)
    areas = db.Column(db.Float, nullable=True)
    angles = db.Column(db.Float, nullable=True)
    notches = db.Column(db.Float, nullable=True)
    total_pcs = db.Column(db.Float, nullable=True)
    model = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    variant = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    status = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True, default='ACTIVE')
    created_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)
    creation_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)

    # Relationship to marker_lines
    relation_lines = db.relationship('MarkerLine', backref='header', cascade="all, delete-orphan", lazy=True)


class MarkerLine(db.Model):
    __tablename__ = 'marker_lines'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    marker_header_id = db.Column(db.Integer, db.ForeignKey('marker_headers.id', ondelete='CASCADE'), nullable=False)
    style = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    size = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    style_size = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    pcs_on_layer = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    

class OrderLinesView(db.Model):
    __tablename__ = 'order_lines_view'  # SQL View
    __table_args__ = {'info': {'read_only': True}}  # Read-only view

    # Composite primary key
    order_commessa = db.Column(db.String(50), primary_key=True, nullable=False)
    size = db.Column(db.String(10), primary_key=True, nullable=False)

    # Other columns
    season = db.Column(db.String(10), nullable=False)
    prod_order_no = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    color_code = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    status = db.Column(db.Integer, nullable=False)

    # Convert row data to dictionary
    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


class Mattresses(db.Model):
    __tablename__ = 'mattresses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_code = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_color = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    dye_lot = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    item_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    spreading_method = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f"<Mattress {self.mattress}, Order {self.order_commessa}>"

    def save(self):
        """Save the mattress record to the database."""
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # ✅ Convert datetime to string
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')  # Format: YYYY-MM-DD HH:MM:SS
            else:
                result[column.name] = value
        return result

    @classmethod
    def get_by_id(cls, id):
        """Fetch a mattress by its ID."""
        return cls.query.get_or_404(id)

    @classmethod
    def get_all(cls):
        """Retrieve all mattress records."""
        return cls.query.all()

    @classmethod
    def get_by_order(cls, order_commessa):
        """Fetch mattresses by order_commessa."""
        return cls.query.filter_by(order_commessa=order_commessa).all()


