from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, MarkerRequest, WidthChangeRequest, MarkerHeader, MattressMarker, Mattresses
from datetime import datetime
import json

# Create Blueprint and API instance
marker_requests_bp = Blueprint('marker_requests', __name__)
marker_requests_api = Namespace('marker_requests', description="Marker Request Management")


@marker_requests_api.route('/list')
class ListMarkerRequests(Resource):
    def get(self):
        """List marker requests with optional filtering and fabric information"""
        try:
            status = request.args.get('status', None)

            # Join with WidthChangeRequest and Mattresses to get fabric information
            query = db.session.query(MarkerRequest, Mattresses).join(
                WidthChangeRequest, MarkerRequest.width_change_request_id == WidthChangeRequest.id
            ).join(
                Mattresses, WidthChangeRequest.mattress_id == Mattresses.id
            )

            if status:
                query = query.filter(MarkerRequest.status == status)

            results = query.order_by(MarkerRequest.created_at.desc()).all()

            # Build response data with fabric information
            data = []
            for marker_request, mattress in results:
                request_data = marker_request.to_dict()
                # Add fabric code only
                request_data['fabric_code'] = mattress.fabric_code
                data.append(request_data)

            return {
                "success": True,
                "data": data
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



@marker_requests_api.route('/<int:request_id>/complete')
class CompleteMarkerRequest(Resource):
    def post(self, request_id):
        """Mark a marker request as completed and link the created marker"""
        try:
            data = request.get_json()
            created_marker_id = data.get('created_marker_id')

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
            marker_request.completed_at = datetime.utcnow()

            # Update the associated width change request with the new marker information
            width_request = marker_request.width_change_request
            if width_request:
                # Update the width change request with the selected marker information
                width_request.selected_marker_name = created_marker.marker_name
                width_request.selected_marker_id = created_marker.id

                # If the width change request is waiting for marker, change it back to pending for shift manager approval
                if width_request.status == 'waiting_for_marker':
                    width_request.status = 'pending'

                # Note: We don't update the mattress marker here - that happens when the shift manager approves the request

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
    def post(self, request_id):
        """Cancel a marker request and automatically reject the connected width change request"""
        try:
            data = request.get_json()
            cancelled_by = data.get('cancelled_by', 'Unknown')

            marker_request = MarkerRequest.query.get(request_id)
            if not marker_request:
                return {"success": False, "message": "Marker request not found"}, 404

            if marker_request.status not in ['pending']:
                return {"success": False, "message": "Request cannot be cancelled in current status"}, 400

            # Update marker request
            marker_request.status = 'cancelled'
            marker_request.completed_at = datetime.utcnow()

            # Automatically reject the connected width change request
            width_request = marker_request.width_change_request
            if width_request and width_request.status in ['pending', 'waiting_for_marker']:
                width_request.status = 'rejected'
                width_request.approved_by = cancelled_by  # Set planner's username
                width_request.approved_at = datetime.utcnow()

            db.session.commit()

            return {
                "success": True,
                "message": "Marker request cancelled and width change request rejected successfully",
                "data": marker_request.to_dict()
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error cancelling marker request: {str(e)}"}, 500


@marker_requests_api.route('/<int:request_id>')
class GetMarkerRequest(Resource):
    def get(self, request_id):
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



