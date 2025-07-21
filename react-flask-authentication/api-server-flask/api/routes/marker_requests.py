from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, MarkerRequest, WidthChangeRequest, MarkerHeader, MattressMarker
from datetime import datetime
import json

# Create Blueprint and API instance
marker_requests_bp = Blueprint('marker_requests', __name__)
marker_requests_api = Namespace('marker_requests', description="Marker Request Management")


@marker_requests_api.route('/list')
class ListMarkerRequests(Resource):
    def get(self):
        """List marker requests with optional filtering"""
        try:
            status = request.args.get('status', None)
            assigned_to = request.args.get('assigned_to', None)
            
            query = MarkerRequest.query
            
            if status:
                query = query.filter(MarkerRequest.status == status)
            if assigned_to:
                query = query.filter(MarkerRequest.assigned_to == assigned_to)
            
            requests = query.order_by(MarkerRequest.created_at.desc()).all()
            
            return {
                "success": True,
                "data": [req.to_dict() for req in requests]
            }, 200
            
        except Exception as e:
            return {"success": False, "message": f"Error fetching marker requests: {str(e)}"}, 500


@marker_requests_api.route('/pending/count')
class PendingMarkerRequestsCount(Resource):
    def get(self):
        """Get count of pending marker requests for badge notifications"""
        try:
            count = MarkerRequest.query.filter_by(status='pending').count()
            return {"success": True, "count": count}, 200
        except Exception as e:
            return {"success": False, "count": 0, "error": str(e)}, 500


@marker_requests_api.route('/<int:request_id>/assign')
class AssignMarkerRequest(Resource):
    def post(self):
        """Assign a marker request to a planner"""
        try:
            data = request.get_json()
            assigned_to = data.get('assigned_to')
            
            if not assigned_to:
                return {"success": False, "message": "assigned_to is required"}, 400
            
            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404
            
            if marker_request.status != 'pending':
                return {"success": False, "message": "Request is not in pending status"}, 400
            
            # Update assignment
            marker_request.assigned_to = assigned_to
            db.session.commit()
            
            return {
                "success": True,
                "message": "Marker request assigned successfully",
                "data": marker_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error assigning marker request: {str(e)}"}, 500


@marker_requests_api.route('/<int:request_id>/complete')
class CompleteMarkerRequest(Resource):
    def post(self):
        """Mark a marker request as completed and link the created marker"""
        try:
            data = request.get_json()
            created_marker_id = data.get('created_marker_id')
            planner_notes = data.get('planner_notes', '')
            
            if not created_marker_id:
                return {"success": False, "message": "created_marker_id is required"}, 400
            
            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404
            
            if marker_request.status != 'pending':
                return {"success": False, "message": "Request is not in pending status"}, 400
            
            # Verify the marker exists
            created_marker = MarkerHeader.query.get(created_marker_id)
            if not created_marker:
                return {"success": False, "message": "Created marker not found"}, 404
            
            # Update marker request
            marker_request.status = 'completed'
            marker_request.created_marker_id = created_marker_id
            marker_request.planner_notes = planner_notes
            marker_request.completed_at = datetime.utcnow()
            
            # Update the associated width change request's mattress with the new marker
            width_request = marker_request.width_change_request
            if width_request and width_request.status == 'approved':
                # Update the mattress marker
                mattress_marker = MattressMarker.query.filter_by(mattress_id=width_request.mattress_id).first()
                if mattress_marker:
                    mattress_marker.marker_id = created_marker.id
                    mattress_marker.marker_name = created_marker.marker_name
                    mattress_marker.marker_width = created_marker.marker_width
                    mattress_marker.marker_length = created_marker.marker_length
            
            db.session.commit()
            
            return {
                "success": True,
                "message": "Marker request completed successfully",
                "data": marker_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error completing marker request: {str(e)}"}, 500


@marker_requests_api.route('/<int:request_id>/cancel')
class CancelMarkerRequest(Resource):
    def post(self):
        """Cancel a marker request"""
        try:
            data = request.get_json()
            planner_notes = data.get('planner_notes', '')
            
            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404
            
            if marker_request.status not in ['pending']:
                return {"success": False, "message": "Request cannot be cancelled in current status"}, 400
            
            # Update marker request
            marker_request.status = 'cancelled'
            marker_request.planner_notes = planner_notes
            marker_request.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                "success": True,
                "message": "Marker request cancelled successfully",
                "data": marker_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error cancelling marker request: {str(e)}"}, 500


@marker_requests_api.route('/<int:request_id>')
class GetMarkerRequest(Resource):
    def get(self):
        """Get a specific marker request by ID"""
        try:
            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404
            
            return {
                "success": True,
                "data": marker_request.to_dict()
            }, 200
            
        except Exception as e:
            return {"success": False, "message": f"Error fetching marker request: {str(e)}"}, 500


@marker_requests_api.route('/<int:request_id>/update_notes')
class UpdateMarkerRequestNotes(Resource):
    def post(self):
        """Update planner notes for a marker request"""
        try:
            data = request.get_json()
            planner_notes = data.get('planner_notes', '')
            
            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404
            
            # Update notes
            marker_request.planner_notes = planner_notes
            db.session.commit()
            
            return {
                "success": True,
                "message": "Marker request notes updated successfully",
                "data": marker_request.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error updating marker request notes: {str(e)}"}, 500
