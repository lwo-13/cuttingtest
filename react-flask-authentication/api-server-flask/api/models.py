# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""


from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.inspection import inspect

import uuid

db = SQLAlchemy()


class Users(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(32, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    email = db.Column(db.String(64, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=False)
    password = db.Column(db.String(512, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
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
        if not self.password:
            return False

        try:
            return check_password_hash(self.password.strip(), password)
        except ValueError as e:
            return False

    def update_email(self, new_email):
        self.email = new_email

    def update_username(self, new_username):
        self.username = new_username

    def check_jwt_auth_active(self):
        return self.jwt_auth_active

    def set_jwt_auth_active(self, set_status):
        self.jwt_auth_active = set_status
        db.session.commit()

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

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Matches MS SQL primary key definition
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
    creation_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())


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
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class MarkerLineRotation(db.Model):
    __tablename__ = 'marker_lines_rotation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    marker_header_id = db.Column(db.Integer, db.ForeignKey('marker_headers.id', ondelete='CASCADE'), nullable=False)
    style = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    size = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    style_size = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    rotation180 = db.Column(db.Boolean, nullable=False, default=False)
    pcs_on_layer = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

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

class ProdOrderComponentView(db.Model):
    __tablename__ = 'vw_ProdOrderComponent_COL'  # SQL View
    __table_args__ = {'info': {'read_only': True}}  # Read-only view

    # Primary key columns
    prod_order_no = db.Column('Prod_ Order No_', db.String(50), primary_key=True, nullable=False)
    line_no = db.Column('Line No_', db.Integer, primary_key=True, nullable=False)

    # Other important columns
    status = db.Column('Status', db.Integer, nullable=True)
    prod_order_line_no = db.Column('Prod_ Order Line No_', db.Integer, nullable=True)
    item_no = db.Column('Item No_', db.String(50), nullable=True)
    description = db.Column('Description', db.String(255), nullable=True)
    unit_of_measure_code = db.Column('Unit of Measure Code', db.String(10), nullable=True)
    quantity = db.Column('Quantity', db.Float, nullable=True)
    quantity_per = db.Column('Quantity per', db.Float, nullable=True)
    fabric_code = db.Column('Fabric Code', db.String(50), nullable=True)
    item_category_code = db.Column('Item Category Code', db.String(50), nullable=True)
    product_group_code = db.Column('Product Group Code', db.String(50), nullable=True)

    # Convert row data to dictionary
    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

class OrderRatio(db.Model):
    __tablename__ = 'order_ratios'

    order_commessa = db.Column(db.String(50), primary_key=True, nullable=False)
    size = db.Column(db.String(10), primary_key=True, nullable=False)
    theoretical_ratio = db.Column(db.Float, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "order_commessa": self.order_commessa,
            "size": self.size,
            "theoretical_ratio": self.theoretical_ratio
        }

class Mattresses(db.Model):
    __tablename__ = 'mattresses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_code = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_color = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    dye_lot = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    item_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    spreading_method = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    table_id = db.Column(db.String(36), nullable=False, default=lambda: str(uuid.uuid4()))
    row_id = db.Column(db.String(36), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))
    sequence_number = db.Column(db.Integer)

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

class MattressPhase(db.Model):
    __tablename__ = 'mattress_phases'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id'), nullable=False)
    status = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, nullable=False, default=False)
    device = db.Column(db.String(255), nullable=True)
    operator = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def save(self):
        """Save phase record to the database."""
        db.session.add(self)
        db.session.commit()

class MattressDetail(db.Model):
    __tablename__ = 'mattress_details'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id', ondelete='CASCADE'), nullable=False, unique=True)
    layers = db.Column(db.Float, nullable=False)
    layers_a = db.Column(db.Float, nullable=True)
    length_mattress = db.Column(db.Float, nullable=False)
    cons_planned = db.Column(db.Float, nullable=False)
    cons_actual = db.Column(db.Float, nullable=True)
    cons_real = db.Column(db.Float, nullable=True)
    extra = db.Column(db.Float, nullable=False)
    bagno_ready = db.Column(db.Boolean, default=False, nullable=True)
    print_travel = db.Column(db.Boolean, default=False)
    print_marker = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result

    mattress = db.relationship('Mattresses', backref=db.backref('details', cascade='all, delete-orphan'))

class MattressMarker(db.Model):
    __tablename__ = 'mattress_markers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id', ondelete='CASCADE'), nullable=False)
    marker_id = db.Column(db.Integer, db.ForeignKey('marker_headers.id'), nullable=False)  # Linking to `marker_headers` table
    marker_name = db.Column(db.String(255), nullable=False)
    marker_width = db.Column(db.Float, nullable=False)
    marker_length = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result
    # Relationships
    mattress = db.relationship('Mattresses', backref=db.backref('mattress_markers', cascade='all, delete-orphan'))
    marker = db.relationship('MarkerHeader', backref=db.backref('mattress_markers'))

class PadPrint(db.Model):
    __tablename__ = 'padprint'

    # Add a primary key column:
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    brand = db.Column(db.String(255), nullable=False)
    style = db.Column(db.String(255), nullable=False)
    color = db.Column(db.String(255), nullable=False)
    padprint_color = db.Column(db.String(255), nullable=False)
    pattern = db.Column(db.String(255), nullable=False)
    season = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('brand', 'style', 'color', 'padprint_color', 'pattern', 'season', name='UQ_padprint'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'style': self.style,
            'color': self.color,
            'padprint_color': self.padprint_color,
            'pattern': self.pattern,
            'season': self.season,
            'date': self.date.isoformat() if self.date else None
        }

class PadPrintImage(db.Model):
    __tablename__ = 'padprint_image'

    pattern = db.Column(db.String(255), primary_key=True)
    padprint_color = db.Column(db.String(255), primary_key=True)
    image_url = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        return {
            'pattern': self.pattern,
            'padprint_color': self.padprint_color,
            'image_url': self.image_url
        }

class MattressSize(db.Model):
    __tablename__ = 'mattress_sizes'

    id = db.Column(db.Integer, primary_key=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id', onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    style = db.Column(db.String(255), nullable=False)
    size = db.Column(db.String(255), nullable=False)
    pcs_layer = db.Column(db.Float, nullable=False)
    pcs_planned = db.Column(db.Float, nullable=False)
    pcs_actual = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp(), nullable=False)

    # Optional: Relationship to the Mattress model if you need backref
    mattress = db.relationship('Mattresses', backref=db.backref('sizes', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "mattress_id": self.mattress_id,
            "style": self.style,
            "size": self.size,
            "pcs_layer": self.pcs_layer,
            "pcs_planned": self.pcs_planned,
            "pcs_actual": self.pcs_actual,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class MarkerCalculatorData(db.Model):
    __tablename__ = 'marker_calculator_data'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    tab_number = db.Column(db.String(10), nullable=False)  # Tab identifier (e.g., '01', '02', '03')
    selected_baseline = db.Column(db.String(50), nullable=False, default='original')  # 'original', table_id, or 'calc_tab_XX'
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Composite unique constraint to ensure one record per tab per order
    __table_args__ = (
        db.UniqueConstraint('order_commessa', 'tab_number', name='uq_calculator_order_tab'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "order_commessa": self.order_commessa,
            "tab_number": self.tab_number,
            "selected_baseline": self.selected_baseline,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class OrderComments(db.Model):
    __tablename__ = 'order_comments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    comment_text = db.Column(db.UnicodeText(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "order_commessa": self.order_commessa,
            "comment_text": self.comment_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class StyleComments(db.Model):
    __tablename__ = 'style_comments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    style = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    comment_text = db.Column(db.UnicodeText(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "style": self.style,
            "comment_text": self.comment_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class StyleSettings(db.Model):
    __tablename__ = 'style_settings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    style = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    max_pieces_in_package = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "style": self.style,
            "max_pieces_in_package": self.max_pieces_in_package,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class MarkerCalculatorMarker(db.Model):
    __tablename__ = 'marker_calculator_markers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    calculator_data_id = db.Column(db.Integer, db.ForeignKey('marker_calculator_data.id', ondelete='CASCADE'), nullable=False)
    marker_name = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    marker_width = db.Column(db.Float, nullable=True)  # Add width field
    layers = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship
    calculator_data = db.relationship('MarkerCalculatorData', backref=db.backref('markers', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            "id": self.id,
            "calculator_data_id": self.calculator_data_id,
            "marker_name": self.marker_name,
            "marker_width": self.marker_width,
            "layers": self.layers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class MarkerCalculatorQuantity(db.Model):
    __tablename__ = 'marker_calculator_quantities'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    marker_id = db.Column(db.Integer, db.ForeignKey('marker_calculator_markers.id', ondelete='CASCADE'), nullable=False)
    size = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship
    marker = db.relationship('MarkerCalculatorMarker', backref=db.backref('quantities', cascade='all, delete-orphan'))

    # Composite unique constraint to ensure one quantity per marker per size
    __table_args__ = (
        db.UniqueConstraint('marker_id', 'size', name='uq_marker_size_quantity'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "marker_id": self.marker_id,
            "size": self.size,
            "quantity": self.quantity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Collaretto(db.Model):
    __tablename__ = 'collaretto'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    collaretto = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, unique=True)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_code = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    fabric_color = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    dye_lot = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # ✅ Now nullable
    item_type = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    table_id = db.Column(db.String(36), nullable=False, default=lambda: str(uuid.uuid4()))
    row_id = db.Column(db.String(36), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))
    sequence_number = db.Column(db.Integer)

    def __repr__(self):
        return f"<Collaretto {self.collaretto}, Order {self.order_commessa}>"

    def save(self):
        """Save the collaretto record to the database."""
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result

class CollarettoDetail(db.Model):
    __tablename__ = 'collaretto_details'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    collaretto_id = db.Column(
        db.Integer,
        db.ForeignKey('collaretto.id', ondelete='CASCADE'),
        nullable=False, unique=True
    )

    mattress_id = db.Column(
        db.Integer,
        db.ForeignKey('mattresses.id', ondelete='CASCADE'),
        nullable=True
    )

    pieces = db.Column(db.Float, nullable=False)
    usable_width = db.Column(db.Float, nullable=False)
    roll_width = db.Column(db.Float, nullable=False)
    gross_length = db.Column(db.Float, nullable=False)
    pcs_seam = db.Column(db.Float, nullable=True)
    scrap_rolls = db.Column(db.Float, nullable=True)
    rolls_planned = db.Column(db.Float, nullable=True)
    rolls_actual = db.Column(db.Float, nullable=True)
    cons_planned = db.Column(db.Float, nullable=True)
    cons_actual = db.Column(db.Float, nullable=True)
    extra = db.Column(db.Float, nullable=True)
    total_collaretto = db.Column(db.Float, nullable=True)

    applicable_sizes = db.Column(db.String(100, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f"<CollarettoDetail CollarettoID={self.collaretto_id} MattressID={self.mattress_id}>"

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result

    # Optional Relationships (if you want easy access to parent objects)
    collaretto = db.relationship('Collaretto', backref=db.backref('details', cascade='all, delete-orphan'))
    mattress = db.relationship('Mattresses', backref=db.backref('collaretto_details', cascade='all, delete-orphan'))

class MattressKanban(db.Model):
    __tablename__ = 'mattress_kanban'

    id = db.Column(db.Integer, primary_key=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id', ondelete='CASCADE'), nullable=False, unique=True)
    day = db.Column(db.String(20), nullable=False)    # 'today' or 'tomorrow'
    shift = db.Column(db.String(20), nullable=False)  # '1shift' or '2shift'
    position = db.Column(db.Integer, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())


class SystemSettings(db.Model):
    __tablename__ = 'system_settings'

    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), nullable=False, unique=True)
    setting_value = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class ZalliItemsView(db.Model):
    __tablename__ = 'zalli_items_view'
    __table_args__ = {'info': {'read_only': True}}

    item_no = db.Column(db.String(50), primary_key=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    search_description = db.Column(db.String(255), nullable=True)
    description_2 = db.Column(db.String(255), nullable=True)
    brand = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        """Convert row data to dictionary format."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Operator(db.Model):
    __tablename__ = 'operators'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    operator_type = db.Column(db.String(50), nullable=False)  # 'SPREADER', 'CUTTER', 'COLLARETTO', 'WAREHOUSE', etc.
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        """Convert row data to dictionary format."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result

    @classmethod
    def get_by_type(cls, operator_type, active_only=False):
        """Get operators by type, optionally filtering for active only."""
        query = cls.query.filter_by(operator_type=operator_type.upper())
        if active_only:
            query = query.filter_by(active=True)
        return query.all()

    @classmethod
    def get_spreader_operators(cls, active_only=False):
        """Get spreader operators (for backward compatibility)."""
        return cls.get_by_type('SPREADER', active_only)

    @classmethod
    def get_cutter_operators(cls, active_only=False):
        """Get cutter operators (for backward compatibility)."""
        return cls.get_by_type('CUTTER', active_only)

class ProductionCenter(db.Model):
    __tablename__ = 'production_center'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_commessa = db.Column(db.String(50), nullable=False)
    production_center = db.Column(db.String(50), nullable=False)
    cutting_room = db.Column(db.String(50), nullable=False)
    destination = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

class OrderProductionCenter(db.Model):
    __tablename__ = 'order_production_center'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_commessa = db.Column(db.String(50), nullable=False)
    combination_id = db.Column(db.String(36), nullable=False)  # UUID for each combination
    production_center = db.Column(db.String(50), nullable=True)
    cutting_room = db.Column(db.String(50), nullable=True)
    destination = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # For soft delete/deactivation
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    # Unique constraint to prevent duplicate combinations per order
    __table_args__ = (
        db.UniqueConstraint('order_commessa', 'production_center', 'cutting_room', 'destination',
                          name='uq_order_production_combination'),
    )

class OrderAudit(db.Model):
    __tablename__ = 'order_audit'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_commessa = db.Column(db.String(50), nullable=False, unique=True)
    created_by = db.Column(db.String(32, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    last_modified_by = db.Column(db.String(32, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    last_modified_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    def __repr__(self):
        return f"<OrderAudit {self.order_commessa}, Created by {self.created_by}>"

    def to_dict(self):
        return {
            'id': self.id,
            'order_commessa': self.order_commessa,
            'created_by': self.created_by,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'last_modified_by': self.last_modified_by,
            'last_modified_at': self.last_modified_at.strftime('%Y-%m-%d %H:%M:%S') if self.last_modified_at else None
        }

    @classmethod
    def get_by_order(cls, order_commessa):
        """Fetch audit record by order_commessa."""
        return cls.query.filter_by(order_commessa=order_commessa).first()

    @classmethod
    def create_or_update(cls, order_commessa, username):
        """Create new audit record or update existing one."""
        existing = cls.get_by_order(order_commessa)

        if existing:
            # Update existing record
            existing.last_modified_by = username
            existing.last_modified_at = db.func.current_timestamp()
        else:
            # Create new record
            new_audit = cls(
                order_commessa=order_commessa,
                created_by=username,
                last_modified_by=username
            )
            db.session.add(new_audit)

        db.session.commit()
        return existing or new_audit

class MattressProductionCenter(db.Model):
    __tablename__ = 'mattress_production_center'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    table_id = db.Column(db.String(36), nullable=False, unique=True)  # Links to all table types
    table_type = db.Column(db.String(10), nullable=False)  # 'MATTRESS', 'ALONG', 'WEFT', 'BIAS', 'ADHESIVE'
    production_center = db.Column(db.String(50), nullable=True)
    cutting_room = db.Column(db.String(50), nullable=True)
    destination = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp()
    )

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.strftime('%Y-%m-%d %H:%M:%S')
            else:
                result[column.name] = value
        return result


class WidthChangeRequest(db.Model):
    __tablename__ = 'width_change_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mattress_id = db.Column(db.Integer, db.ForeignKey('mattresses.id', ondelete='CASCADE'), nullable=False)
    requested_by = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)  # Username of spreader
    operator = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # Name of the operator
    current_marker_name = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    current_width = db.Column(db.Float, nullable=False)
    requested_width = db.Column(db.Float, nullable=False)
    selected_marker_name = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # If existing marker selected
    selected_marker_id = db.Column(db.Integer, db.ForeignKey('marker_headers.id'), nullable=True)  # If existing marker selected
    request_type = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)  # 'change_marker' or 'new_marker'
    status = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, default='pending')  # 'pending', 'approved', 'rejected'
    approved_by = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # Username of shift manager
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    approved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    mattress = db.relationship('Mattresses', backref=db.backref('width_change_requests', cascade='all, delete-orphan'))
    selected_marker = db.relationship('MarkerHeader', backref=db.backref('width_change_requests', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'mattress_id': self.mattress_id,
            'requested_by': self.requested_by,
            'operator': self.operator,
            'current_marker_name': self.current_marker_name,
            'current_width': self.current_width,
            'requested_width': self.requested_width,
            'selected_marker_name': self.selected_marker_name,
            'selected_marker_id': self.selected_marker_id,
            'request_type': self.request_type,
            'status': self.status,
            'approved_by': self.approved_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            # Include mattress details for display
            'mattress': self.mattress.to_dict() if self.mattress else None
        }

    def save(self):
        db.session.add(self)
        db.session.commit()


class MarkerRequest(db.Model):
    __tablename__ = 'marker_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    width_change_request_id = db.Column(db.Integer, db.ForeignKey('width_change_requests.id', ondelete='CASCADE'), nullable=False)
    requested_width = db.Column(db.Float, nullable=False)
    style = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    order_commessa = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    size_quantities = db.Column(db.Text(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # JSON string of size quantities
    requested_by = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)  # Username of spreader (original requester)
    status = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, default='pending')  # 'pending', 'completed', 'cancelled'
    created_marker_id = db.Column(db.Integer, db.ForeignKey('marker_headers.id'), nullable=True)  # Once marker is created
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    width_change_request = db.relationship('WidthChangeRequest', backref=db.backref('marker_request', uselist=False, cascade='all, delete-orphan'))
    created_marker = db.relationship('MarkerHeader', backref=db.backref('marker_requests', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'width_change_request_id': self.width_change_request_id,
            'requested_width': self.requested_width,
            'style': self.style,
            'order_commessa': self.order_commessa,
            'size_quantities': self.size_quantities,
            'requested_by': self.requested_by,
            'status': self.status,
            'created_marker_id': self.created_marker_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            # Include related data for display
            'width_change_request': self.width_change_request.to_dict() if self.width_change_request else None
        }

    def save(self):
        db.session.add(self)
        db.session.commit()

