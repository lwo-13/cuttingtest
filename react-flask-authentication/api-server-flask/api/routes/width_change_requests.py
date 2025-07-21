from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, WidthChangeRequest, MarkerRequest, Mattresses, MarkerHeader, MattressMarker
from datetime import datetime
import json

# Create Blueprint and API instance
width_change_requests_bp = Blueprint('width_change_requests', __name__)
width_change_requests_api = Namespace('width_change_requests', description="Width Change Request Management")


@width_change_requests_api.route('/create')
class CreateWidthChangeRequest(Resource):
    def post(self):
        """Create a new width change request"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['mattress_id', 'requested_by', 'current_marker_name', 
                             'current_width', 'requested_width', 'request_type']
            for field in required_fields:
                if field not in data:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400
            
            # Validate mattress exists
            mattress = Mattresses.query.get(data['mattress_id'])
            if not mattress:
                return {"success": False, "message": "Mattress not found"}, 404
            
            # Create width change request
            width_request = WidthChangeRequest(
                mattress_id=data['mattress_id'],
                requested_by=data['requested_by'],
                current_marker_name=data['current_marker_name'],
                current_width=float(data['current_width']),
                requested_width=float(data['requested_width']),
                selected_marker_name=data.get('selected_marker_name'),
                selected_marker_id=data.get('selected_marker_id'),
                request_type=data['request_type'],
                status='pending'
            )
            
            width_request.save()
            
            # If this is a new marker request, create the marker request record
            if data['request_type'] == 'new_marker':
                marker_request = MarkerRequest(
                    width_change_request_id=width_request.id,
                    requested_width=float(data['requested_width']),
                    style=data.get('style', ''),
                    order_commessa=data.get('order_commessa', ''),
                    size_quantities=json.dumps(data.get('size_quantities', {})),
                    requested_by=data['requested_by'],
                    status='pending'
                )
                marker_request.save()
            
            return {
                "success": True, 
                "message": "Width change request created successfully",
                "data": width_request.to_dict()
            }, 201
            
        except Exception as e:
            return {"success": False, "message": f"Error creating width change request: {str(e)}"}, 500


@width_change_requests_api.route('/list')
class ListWidthChangeRequests(Resource):
    def get(self):
        """List width change requests with optional filtering"""
        try:
            status = request.args.get('status', None)
            requested_by = request.args.get('requested_by', None)
            
            query = WidthChangeRequest.query
            
            if status:
                query = query.filter(WidthChangeRequest.status == status)
            if requested_by:
                query = query.filter(WidthChangeRequest.requested_by == requested_by)
            
            requests = query.order_by(WidthChangeRequest.created_at.desc()).all()
            
            return {
                "success": True,
                "data": [req.to_dict() for req in requests]
            }, 200
            
        except Exception as e:
            return {"success": False, "message": f"Error fetching width change requests: {str(e)}"}, 500


@width_change_requests_api.route('/pending/count')
class PendingWidthChangeRequestsCount(Resource):
    def get(self):
        """Get count of pending width change requests for badge notifications"""
        try:
            count = WidthChangeRequest.query.filter_by(status='pending').count()
            return {"success": True, "count": count}, 200
        except Exception as e:
            return {"success": False, "count": 0, "error": str(e)}, 500


@width_change_requests_api.route('/<int:request_id>/approve')
class ApproveWidthChangeRequest(Resource):
    def post(self):
        """Approve a width change request"""
        try:
            data = request.get_json()
            approved_by = data.get('approved_by')
            approval_notes = data.get('approval_notes', '')
            
            if not approved_by:
                return {"success": False, "message": "approved_by is required"}, 400
            
            width_request = WidthChangeRequest.query.get(request_id)
            if not width_request:
                return {"success": False, "message": "Width change request not found"}, 404
            
            if width_request.status != 'pending':
                return {"success": False, "message": "Request is not in pending status"}, 400
            
            # Update request status
            width_request.status = 'approved'
            width_request.approved_by = approved_by
            width_request.approval_notes = approval_notes
            width_request.approved_at = datetime.utcnow()
            
            # If this is a marker change request (not new marker), apply the change immediately
            if width_request.request_type == 'change_marker' and width_request.selected_marker_id:
                # Update the mattress marker
                mattress_marker = MattressMarker.query.filter_by(mattress_id=width_request.mattress_id).first()
                if mattress_marker:
                    # Get the new marker details
                    new_marker = MarkerHeader.query.get(width_request.selected_marker_id)
                    if new_marker:
                        mattress_marker.marker_id = new_marker.id
                        mattress_marker.marker_name = new_marker.marker_name
                        mattress_marker.marker_width = new_marker.marker_width
                        mattress_marker.marker_length = new_marker.marker_length
            
            db.session.commit()
            
            return {
                "success": True,
                "message": "Width change request approved successfully",
                "data": width_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error approving width change request: {str(e)}"}, 500


@width_change_requests_api.route('/<int:request_id>/reject')
class RejectWidthChangeRequest(Resource):
    def post(self):
        """Reject a width change request"""
        try:
            data = request.get_json()
            approved_by = data.get('approved_by')
            approval_notes = data.get('approval_notes', '')
            
            if not approved_by:
                return {"success": False, "message": "approved_by is required"}, 400
            
            width_request = WidthChangeRequest.query.get(request_id)
            if not width_request:
                return {"success": False, "message": "Width change request not found"}, 404
            
            if width_request.status != 'pending':
                return {"success": False, "message": "Request is not in pending status"}, 400
            
            # Update request status
            width_request.status = 'rejected'
            width_request.approved_by = approved_by
            width_request.approval_notes = approval_notes
            width_request.approved_at = datetime.utcnow()
            
            # If there's an associated marker request, cancel it
            if width_request.marker_request:
                width_request.marker_request.status = 'cancelled'
            
            db.session.commit()
            
            return {
                "success": True,
                "message": "Width change request rejected successfully",
                "data": width_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error rejecting width change request: {str(e)}"}, 500


@width_change_requests_api.route('/<int:request_id>')
class GetWidthChangeRequest(Resource):
    def get(self):
        """Get a specific width change request by ID"""
        try:
            width_request = WidthChangeRequest.query.get(request_id)
            if not width_request:
                return {"success": False, "message": "Width change request not found"}, 404
            
            return {
                "success": True,
                "data": width_request.to_dict()
            }, 200
            
        except Exception as e:
            return {"success": False, "message": f"Error fetching width change request: {str(e)}"}, 500
