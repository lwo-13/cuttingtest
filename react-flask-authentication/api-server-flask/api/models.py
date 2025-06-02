# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""


from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.inspection import inspect
import pytz
import uuid

def get_local_time():
    """Get current time in the configured timezone"""
    from api.config import BaseConfig
    utc_now = datetime.utcnow()
    utc_time = pytz.utc.localize(utc_now)
    local_time = utc_time.astimezone(BaseConfig.TIMEZONE)
    return local_time.replace(tzinfo=None)  # Remove timezone info for database storage

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

class SystemNotification(db.Model):
    __tablename__ = 'system_notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    message = db.Column(db.Text(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    notification_type = db.Column(db.String(50, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, default='info')  # info, warning, error, success
    priority = db.Column(db.String(20, collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False, default='normal')  # low, normal, high, critical
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=get_local_time)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    target_roles = db.Column(db.Text(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=True)  # JSON string of roles, null means all users

    def __repr__(self):
        return f"SystemNotification: {self.title}"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'priority': self.priority,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'target_roles': self.target_roles
        }

class UserNotificationRead(db.Model):
    __tablename__ = 'user_notification_read'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_id = db.Column(db.Integer, db.ForeignKey('system_notifications.id'), nullable=False)
    read_at = db.Column(db.DateTime, nullable=False, default=get_local_time)

    def __repr__(self):
        return f"UserNotificationRead: User {self.user_id} read notification {self.notification_id}"

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
    pcs_bundle = db.Column(db.Float, nullable=True)
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

class SpreadOperator(db.Model):
    __tablename__ = 'spreader_operators'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
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

class CutterOperator(db.Model):
    __tablename__ = 'cutter_operators'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
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