from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, WidthChangeRequest, MarkerRequest, Mattresses, MarkerHeader, MattressMarker, MattressDetail
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
            print(f"DEBUG: Received width change request data: {data}")

            if not data:
                return {"success": False, "message": "No JSON data received"}, 400

            # Validate required fields
            required_fields = ['mattress_id', 'requested_by', 'current_marker_name',
                             'current_width', 'requested_width', 'request_type']
            for field in required_fields:
                if field not in data:
                    print(f"DEBUG: Missing required field: {field}")
                    return {"success": False, "message": f"Missing required field: {field}"}, 400
            
            # Validate data types
            try:
                mattress_row_id = data['mattress_id']  # This is actually the row_id (UUID string)
                current_width = float(data['current_width'])
                requested_width = float(data['requested_width'])
            except (ValueError, TypeError) as e:
                print(f"DEBUG: Data type validation error: {e}")
                return {"success": False, "message": f"Invalid data types: {str(e)}"}, 400

            # Find mattress by row_id (UUID) and get the integer id
            mattress = Mattresses.query.filter_by(row_id=mattress_row_id).first()
            if not mattress:
                return {"success": False, "message": f"Mattress not found with row_id: {mattress_row_id}"}, 404

            mattress_id = mattress.id  # Get the integer ID
            if not mattress:
                return {"success": False, "message": "Mattress not found"}, 404
            
            # Resolve selected_marker_id if marker name is provided
            selected_marker_id = data.get('selected_marker_id')
            selected_marker_name = data.get('selected_marker_name')
            new_marker = None

            print(f"DEBUG: Initial selected_marker_id: {selected_marker_id}")
            print(f"DEBUG: Selected marker name: {selected_marker_name}")

            if selected_marker_name:
                # Find the marker by name in marker_headers table
                print(f"DEBUG: Searching for marker with name: {selected_marker_name}")
                new_marker = MarkerHeader.query.filter_by(marker_name=selected_marker_name).first()
                if new_marker:
                    selected_marker_id = new_marker.id
                    print(f"DEBUG: Found marker '{selected_marker_name}' with ID: {selected_marker_id}")
                    print(f"DEBUG: Marker details - width: {new_marker.marker_width}, length: {new_marker.marker_length}")
                else:
                    print(f"DEBUG: Could not find marker with name: {selected_marker_name}")
                    # Let's check what markers exist for debugging
                    similar_markers = MarkerHeader.query.filter(MarkerHeader.marker_name.like(f'%{selected_marker_name[:10]}%')).limit(5).all()
                    print(f"DEBUG: Similar markers found: {[m.marker_name for m in similar_markers]}")

            print(f"DEBUG: Final selected_marker_id: {selected_marker_id}")

            # Determine initial status - auto-approve for subcontractors
            initial_status = 'pending'
            approved_by = None
            approved_at = None

            # Check if request is from a subcontractor (no operator means subcontractor)
            if not data.get('operator'):
                if data['request_type'] == 'change_marker' or selected_marker_id:
                    # For change_marker requests or when we have a selected marker, auto-approve
                    initial_status = 'approved'
                    approved_by = 'SYSTEM_AUTO_APPROVAL'
                    approved_at = datetime.utcnow()
                    print(f"DEBUG: Auto-approving subcontractor width change request (change_marker)")
                elif data['request_type'] == 'new_marker':
                    # For new_marker requests, set to waiting_for_marker (will be approved when marker is created)
                    initial_status = 'waiting_for_marker'
                    print(f"DEBUG: Setting subcontractor new_marker request to waiting_for_marker")

            # Create width change request
            width_request = WidthChangeRequest(
                mattress_id=mattress_id,
                requested_by=data['requested_by'],
                operator=data.get('operator'),
                current_marker_name=data['current_marker_name'],
                current_width=current_width,
                requested_width=requested_width,
                selected_marker_name=data.get('selected_marker_name'),
                selected_marker_id=selected_marker_id,
                request_type=data['request_type'],
                status=initial_status,
                approved_by=approved_by,
                approved_at=approved_at
            )
            
            db.session.add(width_request)
            db.session.commit()

            # If this is a new marker request, create the marker request record
            if data['request_type'] == 'new_marker':
                marker_request = MarkerRequest(
                    width_change_request_id=width_request.id,
                    requested_width=requested_width,
                    style=data.get('style', ''),
                    order_commessa=data.get('order_commessa', ''),
                    size_quantities=json.dumps(data.get('size_quantities', {})),
                    requested_by=data['requested_by'],
                    status='pending'
                )
                db.session.add(marker_request)
                db.session.commit()

            # If auto-approved and has a selected marker, apply the marker change immediately
            print(f"DEBUG: Checking auto-approval conditions - initial_status: {initial_status}, selected_marker_id: {selected_marker_id}, new_marker: {new_marker is not None}")
            if initial_status == 'approved' and selected_marker_id and new_marker:
                try:
                    print(f"DEBUG: Applying marker change for auto-approved subcontractor request")
                    print(f"DEBUG: New marker details - name: {new_marker.marker_name}, width: {new_marker.marker_width}, length: {new_marker.marker_length}")

                    # Update the mattress_markers table
                    mattress_marker = MattressMarker.query.filter_by(mattress_id=mattress_id).first()
                    if mattress_marker:
                        print(f"DEBUG: Found existing mattress_marker - old marker_id: {mattress_marker.marker_id}, old marker_name: {mattress_marker.marker_name}")
                        print(f"DEBUG: Updating to new marker_id: {selected_marker_id}, new marker_name: {new_marker.marker_name}")

                        # Update all marker fields in mattress_markers table
                        mattress_marker.marker_id = selected_marker_id
                        mattress_marker.marker_name = new_marker.marker_name
                        mattress_marker.marker_width = new_marker.marker_width
                        mattress_marker.marker_length = new_marker.marker_length
                        mattress_marker.efficiency = new_marker.efficiency  # Add efficiency field
                        db.session.add(mattress_marker)

                        # Update the mattress_details table with new length and consumption
                        mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()
                        if mattress_detail:
                            # Get current values
                            layers = mattress_detail.layers or 0
                            extra = mattress_detail.extra or 0

                            print(f"DEBUG: Current mattress_detail - length: {mattress_detail.length_mattress}, cons_planned: {mattress_detail.cons_planned}")
                            print(f"DEBUG: Calculation inputs - layers: {layers}, extra: {extra}, new_marker_length: {new_marker.marker_length}")

                            # Update length_mattress with new marker length + extra
                            old_length = mattress_detail.length_mattress
                            old_cons = mattress_detail.cons_planned

                            mattress_detail.length_mattress = new_marker.marker_length + extra

                            # Calculate new planned consumption: (marker_length + extra) * layers
                            # Round to maximum 3 decimal places
                            new_cons_planned = round((new_marker.marker_length + extra) * layers, 3)
                            mattress_detail.cons_planned = new_cons_planned
                            db.session.add(mattress_detail)

                            print(f"DEBUG: Updated mattress_detail - length: {old_length} -> {mattress_detail.length_mattress}")
                            print(f"DEBUG: Updated mattress_detail - cons_planned: {old_cons} -> {mattress_detail.cons_planned}")
                        else:
                            print("DEBUG: No mattress_detail found!")

                        # Commit all changes to both tables
                        db.session.commit()
                        print("DEBUG: Marker change applied successfully to both mattress_markers and mattress_details tables")
                    else:
                        print(f"DEBUG: No mattress_marker found for mattress_id: {mattress_id}")
                except Exception as marker_error:
                    print(f"DEBUG: Error applying marker change: {str(marker_error)}")
                    import traceback
                    traceback.print_exc()
                    db.session.rollback()
                    # Don't fail the entire request, just log the error
                    print("DEBUG: Continuing with width change request creation despite marker application error")
            else:
                print(f"DEBUG: Marker change not applied - conditions not met")
                print(f"DEBUG: - initial_status == 'approved': {initial_status == 'approved'}")
                print(f"DEBUG: - selected_marker_id exists: {selected_marker_id is not None}")
                print(f"DEBUG: - new_marker found: {new_marker is not None}")
            
            return {
                "success": True, 
                "message": "Width change request created successfully",
                "data": width_request.to_dict()
            }, 201
            
        except Exception as e:
            db.session.rollback()
            print(f"ERROR: Exception in width change request creation: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"Error creating width change request: {str(e)}"}, 500


@width_change_requests_api.route('/list')
class ListWidthChangeRequests(Resource):
    def get(self):
        """List width change requests with filtering rules for approvals page"""
        try:
            status = request.args.get('status', None)
            requested_by = request.args.get('requested_by', None)

            query = WidthChangeRequest.query

            # Apply filtering rules for approvals page:
            # 1. Show everything that doesn't have status 'approved' OR 'rejected'
            # 2. Show everything that is 'approved' or 'rejected' but was created less than 48 hours ago
            from datetime import datetime, timedelta
            forty_eight_hours_ago = datetime.utcnow() - timedelta(hours=48)

            # Filter: (status != 'approved' AND status != 'rejected') OR (created_at > 48 hours ago)
            query = query.filter(
                db.or_(
                    ~WidthChangeRequest.status.in_(['approved', 'rejected']),
                    WidthChangeRequest.created_at > forty_eight_hours_ago
                )
            )

            # Exclude subcontractor requests (requests without operator are from subcontractors)
            query = query.filter(WidthChangeRequest.operator.isnot(None))

            # Apply additional filters if provided
            if status:
                query = query.filter(WidthChangeRequest.status == status)
            if requested_by:
                query = query.filter(WidthChangeRequest.requested_by == requested_by)

            requests = query.order_by(WidthChangeRequest.created_at.desc()).all()

            # Enhance the data with marker length and consumption information
            enhanced_data = []
            for req in requests:
                req_data = req.to_dict()

                # Get current marker length from marker_headers using the current marker name
                # This ensures we get the original marker length, not the updated one after approval
                current_marker = MarkerHeader.query.filter_by(marker_name=req.current_marker_name).first()
                if current_marker:
                    req_data['current_marker_length'] = current_marker.marker_length

                # Get selected marker length if it's a change_marker request
                if req.request_type == 'change_marker' and req.selected_marker_id:
                    selected_marker = MarkerHeader.query.get(req.selected_marker_id)
                    if selected_marker:
                        req_data['selected_marker_length'] = selected_marker.marker_length

                # Get mattress layers, planned consumption and extra (allowance) from mattress_details
                mattress_detail = MattressDetail.query.filter_by(mattress_id=req.mattress_id).first()
                if mattress_detail:
                    req_data['mattress_layers'] = mattress_detail.layers
                    req_data['planned_consumption'] = mattress_detail.cons_planned
                    req_data['extra'] = mattress_detail.extra

                enhanced_data.append(req_data)

            return {
                "success": True,
                "data": enhanced_data
            }, 200
            
        except Exception as e:
            return {"success": False, "message": f"Error fetching width change requests: {str(e)}"}, 500


@width_change_requests_api.route('/subcontractor/list')
class ListSubcontractorWidthChangeRequests(Resource):
    def get(self):
        """List width change requests from subcontractors only"""
        try:
            status = request.args.get('status', None)
            requested_by = request.args.get('requested_by', None)

            query = WidthChangeRequest.query

            # Apply filtering rules for approvals page:
            # 1. Show everything that doesn't have status 'approved' OR 'rejected'
            # 2. Show everything that is 'approved' or 'rejected' but was created less than 48 hours ago
            from datetime import datetime, timedelta
            forty_eight_hours_ago = datetime.utcnow() - timedelta(hours=48)

            # Filter: (status != 'approved' AND status != 'rejected') OR (created_at > 48 hours ago)
            query = query.filter(
                db.or_(
                    ~WidthChangeRequest.status.in_(['approved', 'rejected']),
                    WidthChangeRequest.created_at > forty_eight_hours_ago
                )
            )

            # Only include subcontractor requests (requests without operator are from subcontractors)
            query = query.filter(WidthChangeRequest.operator.is_(None))

            # Apply additional filters if provided
            if status:
                query = query.filter(WidthChangeRequest.status == status)
            if requested_by:
                query = query.filter(WidthChangeRequest.requested_by == requested_by)

            requests = query.order_by(WidthChangeRequest.created_at.desc()).all()

            # Enhance the data with marker length and consumption information
            enhanced_data = []
            for req in requests:
                req_data = req.to_dict()

                # Get current marker length from marker_headers using the current marker name
                # This ensures we get the original marker length, not the updated one after approval
                current_marker = MarkerHeader.query.filter_by(marker_name=req.current_marker_name).first()
                if current_marker:
                    req_data['current_marker_length'] = current_marker.marker_length

                # Get selected marker length if it's a change_marker request
                if req.request_type == 'change_marker' and req.selected_marker_id:
                    selected_marker = MarkerHeader.query.get(req.selected_marker_id)
                    if selected_marker:
                        req_data['selected_marker_length'] = selected_marker.marker_length

                # Get mattress layers, planned consumption and extra (allowance) from mattress_details
                mattress_detail = MattressDetail.query.filter_by(mattress_id=req.mattress_id).first()
                if mattress_detail:
                    req_data['mattress_layers'] = mattress_detail.layers
                    req_data['planned_consumption'] = mattress_detail.cons_planned
                    req_data['extra'] = mattress_detail.extra

                enhanced_data.append(req_data)

            return {
                "success": True,
                "data": enhanced_data
            }, 200

        except Exception as e:
            return {"success": False, "message": f"Error fetching subcontractor width change requests: {str(e)}"}, 500


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
    def post(self, request_id):
        """Approve a width change request"""
        try:
            data = request.get_json()
            approved_by = data.get('approved_by')
            
            if not approved_by:
                return {"success": False, "message": "approved_by is required"}, 400
            
            width_request = WidthChangeRequest.query.get(request_id)
            if not width_request:
                return {"success": False, "message": "Width change request not found"}, 404
            
            if width_request.status != 'pending':
                return {"success": False, "message": "Request is not in pending status"}, 400

            # Update request status based on request type and marker availability
            if width_request.request_type == 'new_marker' and not width_request.selected_marker_id:
                # For new marker requests without a selected marker, set status to waiting_for_marker
                width_request.status = 'waiting_for_marker'
            else:
                # For change_marker requests OR new_marker requests with selected marker, set to approved
                width_request.status = 'approved'

            width_request.approved_by = approved_by
            width_request.approved_at = datetime.utcnow()

            # Apply the marker change if there's a selected marker
            if width_request.selected_marker_id:
                print(f"DEBUG: Processing marker change request for mattress_id: {width_request.mattress_id}")
                print(f"DEBUG: Selected marker ID: {width_request.selected_marker_id}")

                # Get the new marker details
                new_marker = MarkerHeader.query.get(width_request.selected_marker_id)
                if new_marker:
                    print(f"DEBUG: Found new marker: {new_marker.marker_name}, length: {new_marker.marker_length}")

                    # Update the mattress marker
                    mattress_marker = MattressMarker.query.filter_by(mattress_id=width_request.mattress_id).first()
                    if mattress_marker:
                        print(f"DEBUG: Updating mattress_marker from {mattress_marker.marker_name} to {new_marker.marker_name}")
                        mattress_marker.marker_id = new_marker.id
                        mattress_marker.marker_name = new_marker.marker_name
                        mattress_marker.marker_width = new_marker.marker_width
                        mattress_marker.marker_length = new_marker.marker_length
                    else:
                        print("DEBUG: No mattress_marker found!")

                    # Update the mattress details with new marker length and consumption
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=width_request.mattress_id).first()
                    if mattress_detail:
                        # Get current values
                        layers = mattress_detail.layers
                        extra = mattress_detail.extra

                        print(f"DEBUG: Current mattress_detail - length: {mattress_detail.length_mattress}, cons_planned: {mattress_detail.cons_planned}")
                        print(f"DEBUG: Layers: {layers}, Extra: {extra}")

                        # Update length_mattress with marker length + extra
                        old_length = mattress_detail.length_mattress
                        old_cons = mattress_detail.cons_planned

                        mattress_detail.length_mattress = new_marker.marker_length + extra

                        # Calculate new planned consumption: (marker_length + extra) * layers
                        # Round to maximum 3 decimal places
                        new_cons_planned = round((new_marker.marker_length + extra) * layers, 3)
                        mattress_detail.cons_planned = new_cons_planned

                        print(f"DEBUG: Updated mattress_detail - length: {old_length} -> {mattress_detail.length_mattress}")
                        print(f"DEBUG: Updated mattress_detail - cons_planned: {old_cons} -> {mattress_detail.cons_planned}")
                    else:
                        print("DEBUG: No mattress_detail found!")
                else:
                    print(f"DEBUG: No marker found with ID: {width_request.selected_marker_id}")
            else:
                print(f"DEBUG: Not a change_marker request or no selected_marker_id")
                print(f"DEBUG: request_type: {width_request.request_type}, selected_marker_id: {width_request.selected_marker_id}")
            
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
    def post(self, request_id):
        """Reject a width change request"""
        try:
            data = request.get_json()
            approved_by = data.get('approved_by')
            
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
    def get(self, request_id):
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


@width_change_requests_api.route('/<int:request_id>')
class DeleteWidthChangeRequest(Resource):
    def delete(self, request_id):
        """Delete a width change request and its associated marker request"""
        try:
            width_request = WidthChangeRequest.query.get(request_id)
            if not width_request:
                return {"success": False, "message": "Width change request not found"}, 404

            # Store info for logging
            mattress_id = width_request.mattress_id
            request_type = width_request.request_type

            # Delete the width change request (CASCADE will handle marker_request deletion)
            db.session.delete(width_request)
            db.session.commit()

            return {
                "success": True,
                "message": f"Width change request {request_id} and associated marker request deleted successfully",
                "deleted_request_id": request_id,
                "mattress_id": mattress_id,
                "request_type": request_type
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error deleting width change request: {str(e)}"}, 500
