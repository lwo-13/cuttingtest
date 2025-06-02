from datetime import datetime, timedelta
from functools import wraps
import json

import jwt
from flask import Blueprint, request
from flask_restx import Namespace, Resource, fields

from api.models import db, Users, SystemNotification, UserNotificationRead, get_local_time
from api.config import BaseConfig
from api.routes.auth import token_required

# Create Blueprint and API instance
notifications_bp = Blueprint('notifications', __name__)
notifications_api = Namespace('notifications', description="System Notifications Endpoints")

# Request Models
notification_model = notifications_api.model('NotificationModel', {
    "title": fields.String(required=True, min_length=1, max_length=255),
    "message": fields.String(required=True, min_length=1),
    "notification_type": fields.String(required=False, default='warning', enum=['info', 'warning', 'error', 'success']),
    "priority": fields.String(required=False, default='high', enum=['low', 'normal', 'high', 'critical']),
    "expires_in_minutes": fields.Integer(required=False, default=60),
    "target_roles": fields.List(fields.String, required=False, description="List of roles to target, empty means all users")
})

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For Flask-RESTX Resource classes, current_user is the second parameter
        if len(args) >= 2 and hasattr(args[0], '__class__') and 'Resource' in str(args[0].__class__):
            # Flask-RESTX Resource method: args[0] = self, args[1] = current_user
            current_user = args[1]
        else:
            # Regular function: args[0] = current_user
            current_user = args[0]

        if current_user.role not in ['Administrator', 'Manager', 'Project Admin']:
            return {"success": False, "msg": "Admin privileges required"}, 403
        return f(*args, **kwargs)
    return decorated_function

@notifications_api.route('/send')
class SendNotificationResource(Resource):
    @token_required
    @admin_required
    @notifications_api.expect(notification_model, validate=True)
    def post(self, current_user):
        """Send a system notification (Admin only)"""

        try:
            req_data = request.get_json()
            
            # Calculate expiration time
            expires_at = None
            if req_data.get('expires_in_minutes'):
                expires_at = get_local_time() + timedelta(minutes=req_data['expires_in_minutes'])
            
            # Handle target roles
            target_roles = None
            if req_data.get('target_roles'):
                target_roles = json.dumps(req_data['target_roles'])
            
            # Create notification
            notification = SystemNotification(
                title=req_data['title'],
                message=req_data['message'],
                notification_type=req_data.get('notification_type', 'warning'),
                priority=req_data.get('priority', 'high'),
                created_by=current_user.id,
                expires_at=expires_at,
                target_roles=target_roles
            )
            
            notification.save()
            
            return {
                "success": True, 
                "message": "Notification sent successfully",
                "data": notification.to_dict()
            }, 201
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@notifications_api.route('/active')
class GetActiveNotificationsResource(Resource):
    @token_required
    def get(self, current_user):
        """Get active notifications for the current user"""

        try:
            # Get all active notifications
            query = SystemNotification.query.filter(
                SystemNotification.is_active == True,
                db.or_(
                    SystemNotification.expires_at.is_(None),
                    SystemNotification.expires_at > get_local_time()
                )
            )
            
            notifications = query.all()
            
            # Filter by user role if target_roles is specified
            filtered_notifications = []
            for notification in notifications:
                if notification.target_roles:
                    target_roles = json.loads(notification.target_roles)
                    if current_user.role not in target_roles:
                        continue
                
                # Check if user has already read this notification
                read_record = UserNotificationRead.query.filter_by(
                    user_id=current_user.id,
                    notification_id=notification.id
                ).first()
                
                notification_dict = notification.to_dict()
                notification_dict['is_read'] = read_record is not None
                filtered_notifications.append(notification_dict)
            
            return {
                "success": True,
                "data": filtered_notifications
            }, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@notifications_api.route('/mark_read/<int:notification_id>')
class MarkNotificationReadResource(Resource):
    @token_required
    def post(self, current_user, notification_id):
        """Mark a notification as read"""
        try:
            # Check if notification exists
            notification = SystemNotification.query.get(notification_id)
            if not notification:
                return {"success": False, "message": "Notification not found"}, 404
            
            # Check if already marked as read
            existing_read = UserNotificationRead.query.filter_by(
                user_id=current_user.id,
                notification_id=notification_id
            ).first()
            
            if existing_read:
                return {"success": True, "message": "Already marked as read"}, 200
            
            # Mark as read
            read_record = UserNotificationRead(
                user_id=current_user.id,
                notification_id=notification_id
            )
            read_record.save()
            
            return {"success": True, "message": "Notification marked as read"}, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@notifications_api.route('/dismiss/<int:notification_id>')
class DismissNotificationResource(Resource):
    @token_required
    @admin_required
    def post(self, current_user, notification_id):
        """Dismiss/deactivate a notification (Admin only)"""
        try:
            notification = SystemNotification.query.get(notification_id)
            if not notification:
                return {"success": False, "message": "Notification not found"}, 404
            
            notification.is_active = False
            db.session.commit()
            
            return {"success": True, "message": "Notification dismissed"}, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@notifications_api.route('/active_users')
class GetActiveUsersResource(Resource):
    @token_required
    @admin_required
    def get(self, current_user):
        """Get list of currently active users (Admin only)"""

        try:
            # Get users with active JWT tokens (logged in within last hour)
            cutoff_time = get_local_time() - timedelta(hours=1)
            
            # This is a simplified approach - in a real system you'd track user activity more precisely
            active_users = Users.query.filter(
                Users.jwt_auth_active == True
            ).all()
            
            users_data = []
            for user in active_users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'role': user.role,
                    'email': user.email
                })
            
            return {
                "success": True,
                "data": users_data,
                "count": len(users_data)
            }, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

# Note: SSE endpoint removed - using polling approach instead for better reliability
