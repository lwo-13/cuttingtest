from flask import Blueprint, request, jsonify
from api.models import Mattresses, db, MattressPhase, MattressDetail, MattressMarker, MarkerHeader, MattressSize, MattressKanban, CollarettoDetail, ProductionCenter, MattressProductionCenter, SystemSettings, WidthChangeRequest
from flask_restx import Namespace, Resource
from sqlalchemy import func
from collections import defaultdict
import time
from datetime import datetime, date, timedelta
from sqlalchemy.exc import OperationalError

mattress_bp = Blueprint('mattress_bp', __name__)
mattress_api = Namespace('mattress', description="Mattress Management")

@mattress_api.route('/add_mattress_row', methods=['POST'])
class MattressResource(Resource):
    def post(self):
        try:
            data = request.get_json()

            # ✅ Validate required fields
            required_fields = [
                "mattress", "order_commessa", "fabric_type", "fabric_code", "fabric_color",
                "item_type", "spreading_method", "layers", "length_mattress", "cons_planned",
                "extra", "marker_name", "marker_width", "marker_length", "table_id", "row_id"
            ]
            for field in required_fields:
                if field not in data or data[field] is None:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400

            # ✅ Check if the mattress already exists
            existing_mattress = Mattresses.query.filter_by(row_id=data["row_id"]).first()

            if existing_mattress:
    

                # ✅ Update mattress details including the mattress name
                existing_mattress.mattress = data["mattress"]  # ✅ Update mattress name
                existing_mattress.order_commessa = data["order_commessa"]
                existing_mattress.fabric_type = data["fabric_type"]
                existing_mattress.fabric_code = data["fabric_code"]
                existing_mattress.fabric_color = data["fabric_color"]
                existing_mattress.dye_lot = data.get("dye_lot", "")
                existing_mattress.item_type = data["item_type"]
                existing_mattress.spreading_method = data["spreading_method"]
                existing_mattress.table_id = data["table_id"]
                existing_mattress.row_id = data["row_id"]
                existing_mattress.sequence_number = data.get("sequence_number")

                # ✅ Update mattress details
                mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                if mattress_detail:
                    mattress_detail.layers = data["layers"]
                    mattress_detail.length_mattress = data["length_mattress"]
                    mattress_detail.cons_planned = data["cons_planned"]
                    mattress_detail.extra = data["extra"]
                    mattress_detail.bagno_ready = data.get("bagno_ready")
                else:
                    new_mattress_detail = MattressDetail(
                        mattress_id=existing_mattress.id,
                        layers=data["layers"],
                        length_mattress=data["length_mattress"],
                        cons_planned=data["cons_planned"],
                        extra=data["extra"],
                        bagno_ready=data.get("bagno_ready")
                    )
                    db.session.add(new_mattress_detail)

                mattress_id = existing_mattress.id  # ✅ Get existing ID for marker saving
                db.session.commit()


                # ✅ Update mattress sizes if provided (for existing mattress)
                if "sizes" in data:
                    for size_data in data["sizes"]:
                        retry_attempts = 3
                        for attempt in range(retry_attempts):
                            try:
                                mattress_size = MattressSize.query.filter_by(
                                    mattress_id=mattress_id,
                                    size=size_data["size"]
                                ).first()

                                if mattress_size:
                                    mattress_size.pcs_layer = size_data["pcs_layer"]
                                    mattress_size.pcs_planned = size_data["pcs_planned"]
                                    mattress_size.pcs_actual = None
                                else:
                                    new_mattress_size = MattressSize(
                                        mattress_id=mattress_id,
                                        style=size_data["style"],
                                        size=size_data["size"],
                                        pcs_layer=size_data["pcs_layer"],
                                        pcs_planned=size_data["pcs_planned"],
                                        pcs_actual=None
                                    )
                                    db.session.add(new_mattress_size)

                                break  # ✅ Success — exit retry loop

                            except OperationalError as e:
                                if "deadlock victim" in str(e).lower():

                                    time.sleep(0.3)
                                else:
                                    raise
                        else:
                            raise Exception(f"❌ Failed to process mattress size {size_data['size']} after retries")

            else:
                # ✅ Insert new mattress

                new_mattress = Mattresses(
                    mattress=data["mattress"],
                    order_commessa=data["order_commessa"],
                    fabric_type=data["fabric_type"],
                    fabric_code=data["fabric_code"],
                    fabric_color=data["fabric_color"],
                    dye_lot=data.get("dye_lot", ""),
                    item_type=data["item_type"],
                    spreading_method=data["spreading_method"],
                    table_id=data["table_id"],
                    row_id=data["row_id"],
                    sequence_number=data.get("sequence_number")
                )
                db.session.add(new_mattress)
                db.session.flush()  # ✅ Get the new ID before commit

                mattress_id = new_mattress.id

                # ✅ Insert mattress details
                new_mattress_detail = MattressDetail(
                    mattress_id=mattress_id,
                    layers=data["layers"],
                    length_mattress=data["length_mattress"],
                    cons_planned=data["cons_planned"],
                    extra=data["extra"],
                    bagno_ready=data.get("bagno_ready")
                )
                db.session.add(new_mattress_detail)

                # ✅ Insert mattress phases
                phases = [
                    MattressPhase(mattress_id=mattress_id, status="0 - NOT SET", active=True, operator=data["operator"]),
                    MattressPhase(mattress_id=mattress_id, status="1 - TO LOAD", active=False),
                    MattressPhase(mattress_id=mattress_id, status="2 - ON SPREAD", active=False),
                    MattressPhase(mattress_id=mattress_id, status="3 - TO CUT", active=False),
                    MattressPhase(mattress_id=mattress_id, status="4 - ON CUT", active=False),
                    MattressPhase(mattress_id=mattress_id, status="5 - COMPLETED", active=False),
                ]
                db.session.add_all(phases)

                db.session.commit()


                # ✅ Insert mattress sizes if provided (for new mattress)
                if "sizes" in data:
                    for size_data in data["sizes"]:
                        new_mattress_size = MattressSize(
                            mattress_id=mattress_id,
                            style=size_data["style"],
                            size=size_data["size"],
                            pcs_layer=size_data["pcs_layer"],
                            pcs_planned=size_data["pcs_planned"],
                            pcs_actual=None  # Leave it as None initially
                        )
                        db.session.add(new_mattress_size)

            # ✅ Find marker_id based on marker_name
            marker = MarkerHeader.query.filter_by(marker_name=data["marker_name"]).first()
            if not marker:
                db.session.rollback()
                return {"success": False, "message": f"Marker '{data['marker_name']}' not found"}, 400

            marker_id = marker.id

            # ✅ Check if a different marker is already linked to this mattress
            existing_marker = MattressMarker.query.filter_by(mattress_id=mattress_id).first()

            if existing_marker:
                if existing_marker.marker_id != marker_id:
                    # ✅ If the marker has changed, delete the old one and insert the new one

                    db.session.delete(existing_marker)

                    new_marker_entry = MattressMarker(
                        mattress_id=mattress_id,
                        marker_id=marker_id,
                        marker_name=data["marker_name"],
                        marker_width=data["marker_width"],
                        marker_length=data["marker_length"]
                    )
                    db.session.add(new_marker_entry)
                else:
                    pass

            else:
                # ✅ Insert new marker if none exists
                new_marker_entry = MattressMarker(
                    mattress_id=mattress_id,
                    marker_id=marker_id,
                    marker_name=data["marker_name"],
                    marker_width=data["marker_width"],
                    marker_length=data["marker_length"]
                )
                db.session.add(new_marker_entry)


            db.session.commit()
            return {
                "success": True,
                "message": "Mattress, details, and marker updated successfully",
                "mattress_id": mattress_id
            }, 201

        except Exception as e:
            db.session.rollback()  # ✅ Rollback transaction on error

            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/get_by_order/<string:order_commessa>', methods=['GET'])
class GetMattressesByOrder(Resource):
    def get(self, order_commessa):
        try:
            # Get optional filtering parameters
            cutting_room = request.args.get('cutting_room')
            destination = request.args.get('destination')

            # Subquery to get the updated_at from completed phase (status = "5 - COMPLETED" and active = TRUE)
            completed_phase_subquery = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.updated_at.label('completed_phase_updated_at')
            ).filter(
                MattressPhase.status == "5 - COMPLETED",
                MattressPhase.active == True
            ).subquery()

            query = db.session.query(
                Mattresses,
                MattressDetail.layers,
                MattressDetail.layers_a,
                MattressDetail.extra,
                MattressDetail.cons_planned,
                MattressDetail.cons_actual,
                MattressDetail.cons_real,
                MattressDetail.bagno_ready,  # Add bagno_ready field
                completed_phase_subquery.c.completed_phase_updated_at.label('layers_updated_at'),  # Get timestamp from completed phase
                MattressMarker.marker_name,  # Fetch `marker_name` from mattress_markers
                MattressPhase.status.label('phase_status'),
                # Add table-specific production center fields
                MattressProductionCenter.production_center,
                MattressProductionCenter.cutting_room,
                MattressProductionCenter.destination
            ).outerjoin(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).outerjoin(
                completed_phase_subquery, Mattresses.id == completed_phase_subquery.c.mattress_id
            ).outerjoin(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).outerjoin(
                MattressPhase, db.and_(Mattresses.id == MattressPhase.mattress_id, MattressPhase.active == True)
            ).outerjoin(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).filter(
                Mattresses.order_commessa == order_commessa,
                Mattresses.item_type.in_(['AS', 'MS'])  # Exclude adhesive types (ASA, MSA)
            )

            # Apply production center filtering if provided
            if cutting_room:
                query = query.filter(MattressProductionCenter.cutting_room == cutting_room)
            if destination:
                query = query.filter(MattressProductionCenter.destination == destination)

            mattresses = query.order_by(
                Mattresses.fabric_type, Mattresses.sequence_number
            ).all()

            if not mattresses:
                return {"success": False, "message": "No mattresses found for this order"}, 404

            # Get all mattress IDs that have pending width change requests
            pending_width_change_mattresses = set()
            pending_requests = WidthChangeRequest.query.filter_by(status='pending').all()
            for req in pending_requests:
                pending_width_change_mattresses.add(req.mattress_id)

            result = []
            for mattress, layers, layers_a, extra, cons_planned, cons_actual, cons_real, bagno_ready, layers_updated_at, marker_name, phase_status, production_center, cutting_room, destination in mattresses:
                result.append({
                    "mattress": mattress.mattress,
                    "phase_status": phase_status,
                    "has_pending_width_change": mattress.id in pending_width_change_mattresses,
                    # Table-specific production center fields (before fabric info)
                    "production_center": production_center,
                    "cutting_room": cutting_room,
                    "destination": destination,
                    "fabric_type": mattress.fabric_type,
                    "fabric_code": mattress.fabric_code,
                    "fabric_color": mattress.fabric_color,
                    "dye_lot": mattress.dye_lot,
                    "item_type": mattress.item_type,
                    "spreading_method": mattress.spreading_method,
                    "layers": layers if layers is not None else "",
                    "layers_a": layers_a if layers_a is not None else "",
                    "layers_updated_at": layers_updated_at.strftime('%Y-%m-%d %H:%M:%S') if layers_updated_at is not None else "",
                    "marker_name": marker_name if marker_name is not None else "",  # Ensure empty if no value
                    "allowance": extra if extra is not None else 0,
                    "cons_planned": cons_planned if cons_planned is not None else "",
                    "cons_actual": cons_actual if cons_actual is not None else "",
                    "cons_real": cons_real if cons_real is not None else "",
                    "bagno_ready": bagno_ready if bagno_ready is not None else False,  # Add bagno_ready field

                    "table_id": mattress.table_id,
                    "row_id": mattress.row_id,
                    "sequence_number": mattress.sequence_number
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/get_adhesive_by_order/<string:order_commessa>', methods=['GET'])
class GetAdhesivesByOrder(Resource):
    def get(self, order_commessa):
        try:
            # Get optional filtering parameters
            cutting_room = request.args.get('cutting_room')
            destination = request.args.get('destination')

            # Subquery to get the updated_at from completed phase (status = "5 - COMPLETED" and active = TRUE)
            completed_phase_subquery = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.updated_at.label('completed_phase_updated_at')
            ).filter(
                MattressPhase.status == "5 - COMPLETED",
                MattressPhase.active == True
            ).subquery()

            query = db.session.query(
                Mattresses,
                MattressDetail.layers,
                MattressDetail.layers_a,
                MattressDetail.extra,
                MattressDetail.cons_planned,
                MattressDetail.cons_actual,
                MattressDetail.cons_real,
                MattressDetail.bagno_ready,  # Add bagno_ready field
                completed_phase_subquery.c.completed_phase_updated_at.label('layers_updated_at'),  # Get timestamp from completed phase
                MattressMarker.marker_name,  # Fetch `marker_name` from mattress_markers
                MattressPhase.status.label('phase_status'),
                # Add table-specific production center fields
                MattressProductionCenter.production_center,
                MattressProductionCenter.cutting_room,
                MattressProductionCenter.destination
            ).outerjoin(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).outerjoin(
                completed_phase_subquery, Mattresses.id == completed_phase_subquery.c.mattress_id
            ).outerjoin(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).outerjoin(
                MattressPhase, db.and_(Mattresses.id == MattressPhase.mattress_id, MattressPhase.active == True)
            ).outerjoin(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).filter(
                Mattresses.order_commessa == order_commessa,
                Mattresses.item_type.in_(['ASA', 'MSA'])  # Only adhesive types
            )

            # Apply production center filtering if provided
            if cutting_room:
                query = query.filter(MattressProductionCenter.cutting_room == cutting_room)
            if destination:
                query = query.filter(MattressProductionCenter.destination == destination)

            mattresses = query.order_by(
                Mattresses.fabric_type, Mattresses.sequence_number
            ).all()

            if not mattresses:
                return {"success": True, "data": []}, 200  # Return empty array instead of error

            # Get all mattress IDs that have pending width change requests
            pending_width_change_mattresses = set()
            pending_requests = WidthChangeRequest.query.filter_by(status='pending').all()
            for req in pending_requests:
                pending_width_change_mattresses.add(req.mattress_id)

            result = []
            for mattress, layers, layers_a, extra, cons_planned, cons_actual, cons_real, bagno_ready, layers_updated_at, marker_name, phase_status, production_center, cutting_room, destination in mattresses:
                result.append({
                    "id": mattress.id,
                    "mattress": mattress.mattress,
                    "order_commessa": mattress.order_commessa,
                    "fabric_type": mattress.fabric_type,
                    "fabric_code": mattress.fabric_code,
                    "fabric_color": mattress.fabric_color,
                    "dye_lot": mattress.dye_lot,
                    "item_type": mattress.item_type,
                    "spreading_method": mattress.spreading_method,
                    "created_at": mattress.created_at.strftime('%Y-%m-%d %H:%M:%S') if mattress.created_at else None,
                    "updated_at": mattress.updated_at.strftime('%Y-%m-%d %H:%M:%S') if mattress.updated_at else None,
                    "layers": layers if layers is not None else "",
                    "layers_a": layers_a if layers_a is not None else "",
                    "layers_updated_at": layers_updated_at.strftime('%Y-%m-%d %H:%M:%S') if layers_updated_at is not None else "",
                    "marker_name": marker_name if marker_name is not None else "",  # Ensure empty if no value
                    "allowance": extra if extra is not None else 0,
                    "cons_planned": cons_planned if cons_planned is not None else "",
                    "cons_actual": cons_actual if cons_actual is not None else "",
                    "cons_real": cons_real if cons_real is not None else "",
                    "bagno_ready": bagno_ready if bagno_ready is not None else False,  # Add bagno_ready field

                    "table_id": mattress.table_id,
                    "row_id": mattress.row_id,
                    "sequence_number": mattress.sequence_number,
                    "phase_status": phase_status if phase_status is not None else "0 - NOT SET",
                    "has_pending_width_change": mattress.id in pending_width_change_mattresses,
                    # Production center fields
                    "production_center": production_center,
                    "cutting_room": cutting_room,
                    "destination": destination
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/save_actual_layers', methods=['POST'])
class SaveActualLayersResource(Resource):
    def post(self):
        """Save actual layers for subcontractors and update mattress phase to completed"""
        try:
            data = request.get_json()
            updates = data.get('updates', [])

            if not updates:
                return {"success": False, "message": "No updates provided"}, 400

            updated_count = 0

            for update in updates:
                row_id = update.get('row_id')
                layers_a = update.get('layers_a')

                if not row_id or layers_a is None:
                    continue

                # Find the mattress by row_id
                mattress = Mattresses.query.filter_by(row_id=row_id).first()
                if not mattress:
                    continue

                # Update mattress_details with actual layers
                mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress.id).first()
                if mattress_detail:
                    mattress_detail.layers_a = layers_a

                    # Calculate actual consumption based on actual layers
                    # Formula: (planned_consumption / planned_layers) * actual_layers
                    if mattress_detail.layers and mattress_detail.layers > 0:
                        consumption_per_layer = mattress_detail.cons_planned / mattress_detail.layers
                        mattress_detail.cons_actual = consumption_per_layer * layers_a
                    else:
                        mattress_detail.cons_actual = 0

                    mattress_detail.updated_at = db.func.current_timestamp()

                # Update mattress phase: set current active phase to FALSE and create/update "5 - COMPLETED" to TRUE
                # First, set all current active phases to FALSE
                current_active_phases = MattressPhase.query.filter_by(mattress_id=mattress.id, active=True).all()
                for phase in current_active_phases:
                    phase.active = False
                    phase.updated_at = db.func.current_timestamp()

                # Check if "5 - COMPLETED" phase already exists
                completed_phase = MattressPhase.query.filter_by(mattress_id=mattress.id, status="5 - COMPLETED").first()
                if completed_phase:
                    # Update existing completed phase to active
                    completed_phase.active = True
                    completed_phase.updated_at = db.func.current_timestamp()
                else:
                    # Create new completed phase
                    new_completed_phase = MattressPhase(
                        mattress_id=mattress.id,
                        status="5 - COMPLETED",
                        active=True,
                        device="SUBCONTRACTOR",
                        created_at=db.func.current_timestamp(),
                        updated_at=db.func.current_timestamp()
                    )
                    db.session.add(new_completed_phase)

                updated_count += 1

            # Commit all changes
            db.session.commit()

            return {
                "success": True,
                "message": f"Successfully updated {updated_count} mattresses",
                "updated_count": updated_count
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/delete/<string:mattress_name>', methods=['DELETE'])
class DeleteMattressResource(Resource):
    def delete(self, mattress_name):
        max_retries = 2
        retry_delay = 0.5  # seconds

        for attempt in range(max_retries + 1):
            try:
                mattress = Mattresses.query.filter_by(mattress=mattress_name).first()

                if not mattress:
                    return {"success": True, "message": f"Mattress {mattress_name} already deleted or not found"}, 200

                db.session.delete(mattress)
                db.session.commit()

                return {"success": True, "message": f"Deleted mattress {mattress_name}"}, 200

            except Exception as e:
                db.session.rollback()  # 🔥 THIS is the missing piece

                if "deadlocked" in str(e).lower() and attempt < max_retries:

                    time.sleep(retry_delay)
                    continue


                return {"success": False, "message": str(e)}, 500

@mattress_api.route('/delete_by_row_id/<string:row_id>', methods=['DELETE'])
class DeleteMattressByRowIdResource(Resource):
    def delete(self, row_id):
        """Delete mattress by row_id - more reliable than mattress name"""
        max_retries = 2
        retry_delay = 0.5  # seconds

        for attempt in range(max_retries + 1):
            try:
                mattress = Mattresses.query.filter_by(row_id=row_id).first()

                if not mattress:
                    return {"success": True, "message": f"Mattress with row_id {row_id} already deleted or not found"}, 200

                mattress_name = mattress.mattress  # Store for logging
                db.session.delete(mattress)
                db.session.commit()

                return {"success": True, "message": f"Deleted mattress {mattress_name} (row_id: {row_id})"}, 200

            except Exception as e:
                db.session.rollback()

                if "deadlocked" in str(e).lower() and attempt < max_retries:
                    time.sleep(retry_delay)
                    continue

                return {"success": False, "message": str(e)}, 500

@ mattress_api.route('/all')
class GetAllMattressesResource(Resource):
    def get(self):
        """Fetch all mattress records from the database."""
        try:
            mattresses = Mattresses.get_all()  # Retrieve all mattresses
            return {"success": True, "data": [m.to_dict() for m in mattresses]}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@ mattress_api.route('/orders_completion_status')
class GetOrdersCompletionStatusResource(Resource):
    def get(self):
        """Get the minimum (lowest) phase status for each order to determine completion.

        Returns completion status based on the lowest phase number:
        - If min_phase_number = 5 (COMPLETED), all mattresses are completed -> Order is finished
        - If min_phase_number < 5, at least one mattress is not completed -> Order is not finished
        """
        try:
            # Get all active mattress phases with their order info
            query = db.session.query(
                Mattresses.order_commessa,
                MattressPhase.status
            ).join(
                MattressPhase, Mattresses.id == MattressPhase.mattress_id
            ).filter(
                MattressPhase.active == True
            ).all()

            # Process in Python to avoid database-specific function issues
            order_phases = {}
            for order_commessa, status in query:
                # Extract numeric part from status (e.g., "5 - COMPLETED" -> 5)
                try:
                    phase_number = int(status.split(' - ')[0])
                except (ValueError, IndexError):
                    phase_number = 0  # Default to 0 if parsing fails

                if order_commessa not in order_phases:
                    order_phases[order_commessa] = []
                order_phases[order_commessa].append(phase_number)

            # Calculate minimum phase for each order
            result = []
            for order_commessa, phases in order_phases.items():
                min_phase_number = min(phases)
                result.append({
                    "order_commessa": order_commessa,
                    "min_phase_number": min_phase_number,
                    "is_completed": min_phase_number == 5  # Only completed if ALL mattresses are at phase 5
                })

            return {"success": True, "data": result}, 200
        except Exception as e:
            # Add detailed error logging
            import traceback
            print(f"❌ Error in orders_completion_status: {str(e)}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return {"success": False, "message": str(e)}, 500



@ mattress_api.route('/kanban')
class GetKanbanMattressesResource(Resource):
    def get(self):
        """Fetch all necessary info for Kanban - active TO LOAD phases with device, operator, marker, layers, fabric, sizes"""
        try:
            # Base query for mattress and phase

            day_filter = request.args.get('day', None)

            query = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.status,
                MattressPhase.device,
                Mattresses.mattress,
                Mattresses.order_commessa,
                Mattresses.table_id,  # Add table_id for joining with mattress production center
                Mattresses.fabric_type,
                Mattresses.fabric_code,
                Mattresses.fabric_color,
                Mattresses.dye_lot,
                Mattresses.item_type,
                Mattresses.spreading_method,
                Mattresses.created_at,
                MattressMarker.marker_name,
                MattressMarker.marker_length,
                MattressMarker.marker_width,
                MattressDetail.layers,
                MattressDetail.layers_a,  # Add actual layers for cutter display
                # Use CollarettoDetail.extra for collaretto mattresses, MattressDetail.extra for regular mattresses
                db.func.coalesce(CollarettoDetail.extra, MattressDetail.extra).label('extra'),
                MattressDetail.cons_planned,
                MattressDetail.length_mattress,
                MattressDetail.bagno_ready,  # Add bagno_ready field
                CollarettoDetail.usable_width,
                # Adding left join on mattress_kanban
                db.func.coalesce(MattressKanban.day, 'Not Assigned').label('day'),
                db.func.coalesce(MattressKanban.shift, 'Not Assigned').label('shift'),
                db.func.coalesce(MattressKanban.position, 0).label('position'),
                # Adding table-specific production center information
                db.func.coalesce(MattressProductionCenter.production_center, 'Not Assigned').label('production_center'),
                db.func.coalesce(MattressProductionCenter.cutting_room, 'Not Assigned').label('cutting_room'),
                db.func.coalesce(MattressProductionCenter.destination, 'Not Assigned').label('destination'),
                # Adding sector information from table-specific production center (use destination as sector)
                db.func.coalesce(MattressProductionCenter.destination, 'No Sector Assigned').label('sector')
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .outerjoin(MattressMarker, MattressPhase.mattress_id == MattressMarker.mattress_id) \
             .join(MattressDetail, MattressPhase.mattress_id == MattressDetail.mattress_id) \
             .outerjoin(MattressKanban, MattressPhase.mattress_id == MattressKanban.mattress_id) \
             .outerjoin(CollarettoDetail, MattressPhase.mattress_id == CollarettoDetail.mattress_id) \
             .outerjoin(MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id) \
             .outerjoin(ProductionCenter, Mattresses.order_commessa == ProductionCenter.order_commessa) \
             .filter(MattressPhase.active == True) \
             .filter(MattressPhase.status.in_(["0 - NOT SET", "1 - TO LOAD", "2 - ON SPREAD", "3 - TO CUT", "4 - ON CUT"])) \
             .filter(MattressDetail.bagno_ready == True) \
             .filter(MattressProductionCenter.cutting_room == 'ZALLI')  # Only show mattresses with cutting room ZALLI

            if day_filter:
                if day_filter in ["today", "tomorrow"]:
                    query = query.filter(
                        db.or_(
                            # Assigned to that day
                            MattressKanban.day == day_filter,
                            # OR unassigned AND still in status 0
                            db.and_(
                                MattressKanban.day.is_(None),
                                MattressPhase.status == "0 - NOT SET"
                            )
                        )
                    )

            # Grab sizes separately
            size_rows = db.session.query(
                MattressSize.mattress_id,
                MattressSize.size,
                MattressSize.pcs_layer
            ).all()

            # Prepare size mapping
            size_dict = {}
            pcs_sum_dict = {}
            for row in size_rows:
                pcs = int(row.pcs_layer) if row.pcs_layer.is_integer() else row.pcs_layer
                size_dict.setdefault(row.mattress_id, []).append(f"{row.size} - {pcs}")
                pcs_sum_dict[row.mattress_id] = pcs_sum_dict.get(row.mattress_id, 0) + pcs

            # Get all mattress IDs that have pending width change requests
            pending_width_change_mattresses = set()
            pending_requests = WidthChangeRequest.query.filter_by(status='pending').all()
            for req in pending_requests:
                pending_width_change_mattresses.add(req.mattress_id)

            # Build final result
            result = []
            for row in query:
                pcs_per_layer = pcs_sum_dict.get(row.mattress_id, 0)
                # Use actual layers (layers_a) when available, fallback to planned layers
                effective_layers = row.layers_a if row.layers_a is not None else row.layers
                total_pcs = pcs_per_layer * effective_layers if pcs_per_layer else 0

                # Check if this mattress has a pending width change request
                mattress_status = row.status
                if row.mattress_id in pending_width_change_mattresses:
                    mattress_status = "PENDING APPROVAL"

                result.append({
                    "id": row.mattress_id,
                    "mattress": row.mattress,
                    "status": mattress_status,
                    "device": row.device if row.device else "SP0",
                    "order_commessa": row.order_commessa,
                    "table_id": row.table_id,
                    # Table-specific production center fields (before fabric info)
                    "production_center": row.production_center,
                    "cutting_room": row.cutting_room,
                    "destination": row.destination,
                    "fabric_type": row.fabric_type,
                    "fabric_code": row.fabric_code,
                    "fabric_color": row.fabric_color,
                    "dye_lot": row.dye_lot,
                    "item_type": row.item_type,
                    "spreading_method": row.spreading_method,
                    "marker": row.marker_name,
                    "marker_length": row.marker_length or row.length_mattress,
                    "width": row.marker_width or row.usable_width,
                    "layers": row.layers,  # Planned layers
                    "layers_a": row.layers_a,  # Actual layers (set by spreader)
                    "extra": row.extra,
                    "consumption": row.cons_planned,
                    "bagno_ready": row.bagno_ready,  # Include bagno_ready field
                    "sizes": "; ".join(size_dict.get(row.mattress_id, [])),
                    "total_pcs": total_pcs,
                    "created_at": row.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "day": row.day,  # Includes 'Not Assigned' if not found in mattress_kanban
                    "sector": row.sector,  # Adding sector information (order-level fallback)
                    "shift": row.shift,  # Includes 'Not Assigned' if not found in mattress_kanban
                    "position": row.position  # Defaults to 0 if not found in mattress_kanban
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@ mattress_api.route('/all_with_details')
class GetAllMattressesWithDetailsResource(Resource):
    def get(self):
        """Fetch mattress records with associated details and markers, filtered for travel document printing.

        Optimized version that uses a single SQL query with joins to avoid N+1 query problems.
        Supports pagination to improve performance.

        Query parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 100, max: 500)
        - search: Search term for filtering

        Filters applied:
        - Only mattresses created within the last 30 days
        - Only mattresses assigned to ZALLI cutting room
        - Only mattresses in early phases (0 - NOT SET, 1 - TO LOAD)
        - Only mattresses with both details and markers
        """
        try:
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 100, type=int), 500)  # Max 500 items per page
            search_term = request.args.get('search', '', type=str).strip()
            skip_count = request.args.get('skip_count', 'false', type=str).lower() == 'true'  # Option to skip count for faster response
            # ABSOLUTE STRICT DATE FILTERING - ONLY LAST 30 DAYS
            current_time = datetime.now()
            one_month_ago = current_time - timedelta(days=30)

            # ✅ SUPER OPTIMIZED: Use separate simpler queries instead of complex joins
            # Step 1: Get mattress IDs that match our criteria (fastest query)
            mattress_ids_query = db.session.query(Mattresses.id).join(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).join(
                MattressPhase, Mattresses.id == MattressPhase.mattress_id
            ).filter(
                # Date filter
                Mattresses.created_at >= one_month_ago,
                # Cutting room filter
                MattressProductionCenter.cutting_room == 'ZALLI',
                # Phase filter
                MattressPhase.active == True,
                MattressPhase.status.in_(["0 - NOT SET", "1 - TO LOAD"])
            )

            # Add search filtering if search term provided
            if search_term:
                search_filter = f"%{search_term.lower()}%"
                mattress_ids_query = mattress_ids_query.filter(
                    db.or_(
                        Mattresses.mattress.ilike(search_filter),
                        Mattresses.order_commessa.ilike(search_filter),
                        Mattresses.fabric_type.ilike(search_filter),
                        Mattresses.fabric_code.ilike(search_filter),
                        Mattresses.fabric_color.ilike(search_filter),
                        Mattresses.dye_lot.ilike(search_filter),
                        Mattresses.item_type.ilike(search_filter),
                        Mattresses.spreading_method.ilike(search_filter)
                    )
                )

            # ✅ Get count if needed (reuse the same query for efficiency)
            if skip_count:
                total_count = -1  # Indicate count was skipped
            else:
                total_count = mattress_ids_query.count()

            # ✅ Get paginated mattress IDs
            print(f"🔍 Fetching page {page}, per_page {per_page}, offset {(page - 1) * per_page}")
            paginated_mattress_ids = mattress_ids_query.order_by(
                Mattresses.created_at.desc(),  # Most recent first
                Mattresses.id.desc()  # Secondary sort for consistency
            ).offset((page - 1) * per_page).limit(per_page).all()
            print(f"📊 Found {len(paginated_mattress_ids)} mattress IDs for page {page}")

            # Extract just the IDs
            mattress_id_list = [row.id for row in paginated_mattress_ids]

            if not mattress_id_list:
                # No results found
                data = []
            else:
                # ✅ Step 2: Get full mattress data for the paginated IDs (much faster)
                mattresses_data = db.session.query(Mattresses).filter(
                    Mattresses.id.in_(mattress_id_list)
                ).order_by(
                    Mattresses.created_at.desc(),
                    Mattresses.id.desc()
                ).all()

                # ✅ Step 3: Get details for these mattresses
                details_data = db.session.query(MattressDetail).filter(
                    MattressDetail.mattress_id.in_(mattress_id_list)
                ).all()

                # ✅ Step 4: Get markers for these mattresses
                markers_data = db.session.query(MattressMarker).filter(
                    MattressMarker.mattress_id.in_(mattress_id_list)
                ).all()

                # ✅ Create lookup dictionaries for fast access
                details_dict = {detail.mattress_id: detail for detail in details_data}
                markers_dict = {marker.mattress_id: marker for marker in markers_data}

                # ✅ Build response data efficiently using lookup dictionaries
                data = []
                for mattress in mattresses_data:
                    detail = details_dict.get(mattress.id)
                    marker = markers_dict.get(mattress.id)

                    mattress_dict = {
                        "id": mattress.id,
                        "mattress": mattress.mattress,
                        "order_commessa": mattress.order_commessa,
                        "fabric_type": mattress.fabric_type,
                        "fabric_code": mattress.fabric_code,
                        "fabric_color": mattress.fabric_color,
                        "dye_lot": mattress.dye_lot,
                        "item_type": mattress.item_type,
                        "spreading_method": mattress.spreading_method,
                        "created_at": mattress.created_at.strftime('%Y-%m-%d %H:%M:%S') if mattress.created_at else None,
                        "updated_at": mattress.updated_at.strftime('%Y-%m-%d %H:%M:%S') if mattress.updated_at else None,
                        "table_id": mattress.table_id,
                        "row_id": mattress.row_id,
                        "sequence_number": mattress.sequence_number,
                        # Only include the detail fields that the frontend actually uses
                        "details": [{
                            "print_travel": detail.print_travel if detail else False,
                            "print_marker": detail.print_marker if detail else False,
                            "layers": detail.layers if detail else 0,
                            "length_mattress": detail.length_mattress if detail else 0,
                            "cons_planned": detail.cons_planned if detail else 0,
                            "extra": detail.extra if detail else 0,
                            "bagno_ready": detail.bagno_ready if detail else False
                        }],
                        # Only include the marker fields that the frontend actually uses
                        "markers": [{
                            "marker_name": marker.marker_name if marker else "",
                            "marker_width": marker.marker_width if marker else 0,
                            "marker_length": marker.marker_length if marker else 0
                        }] if marker else []
                    }
                    data.append(mattress_dict)

            # ✅ Calculate pagination metadata
            if skip_count:
                # When count is skipped, provide limited pagination info
                has_next = len(data) == per_page  # If we got a full page, there might be more
                has_prev = page > 1
                pagination_info = {
                    "page": page,
                    "per_page": per_page,
                    "total_count": -1,  # Indicate count was skipped
                    "total_pages": -1,  # Unknown
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "count_skipped": True
                }
            else:
                # Full pagination info when count is available
                total_pages = (total_count + per_page - 1) // per_page
                has_next = page < total_pages
                has_prev = page > 1
                pagination_info = {
                    "page": page,
                    "per_page": per_page,
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "count_skipped": False
                }

            return {
                "success": True,
                "data": data,
                "pagination": pagination_info
            }, 200

        except Exception as e:
            # ✅ Add detailed error logging for debugging
            import traceback
            print(f"❌ Error in /mattress/all_with_details: {str(e)}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return {"success": False, "message": f"Database error: {str(e)}"}, 500

@mattress_api.route('/update_print_travel', methods=['PUT'])
class UpdatePrintTravelStatus(Resource):
    def put(self):
        try:
            data = request.get_json()
            mattress_id = data.get("mattress_id")
            print_travel = data.get("print_travel", None)

            if not mattress_id:
                return {"success": False, "msg": "mattress_id is required"}, 400

            # 🔹 Find the mattress detail entry
            mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()

            if not mattress_detail:
                return {"success": False, "msg": "Mattress detail not found"}, 404

            # 🔹 Update only `print_travel`
            if print_travel is not None:
                mattress_detail.print_travel = print_travel
                db.session.commit()
                return {"success": True, "msg": "Print travel status updated successfully"}, 200

            return {"success": False, "msg": "No valid update provided"}, 400

        except Exception as e:
            db.session.rollback()
            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/move_mattress/<int:mattress_id>', methods=['PUT'])
class MoveMattressResource(Resource):
    def put(self, mattress_id):
        """Completely rewritten robust mattress movement API with MS validation"""
        data = request.get_json()
        target_device = data.get('device')
        target_day = data.get('day', 'today')
        target_shift = data.get('shift')
        target_position = data.get('position')
        operator = data.get('operator', 'Unknown')

        if not target_device:
            return {"success": False, "message": "Device is required"}, 400

        try:
            # Start transaction
            with db.session.begin():
                # Get mattress info to check spreading method
                mattress = db.session.query(Mattresses).filter_by(id=mattress_id).first()
                if not mattress:
                    return {"success": False, "message": "Mattress not found"}, 404

                # MS (Manual Spreading) validation rules
                if target_device == "MS":
                    # Rule: Only MS mattresses can be placed on MS device
                    if mattress.spreading_method != "MANUAL":
                        return {"success": False, "message": "Only Manual Spreading (MS) mattresses can be assigned to MS device"}, 400
                elif target_device in ["SP1", "SP2", "SP3"]:
                    # Rule: MS mattresses cannot be placed on automatic spreaders
                    if mattress.spreading_method == "MANUAL":
                        return {"success": False, "message": "Manual Spreading (MS) mattresses cannot be assigned to automatic spreader devices. Use MS device instead."}, 400

                # Get mattress phases
                all_phases = db.session.query(MattressPhase).filter_by(mattress_id=mattress_id).all()
                if not all_phases:
                    return {"success": False, "message": "Mattress phases not found"}, 404

                # Get current kanban entry
                current_kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()

                # Step 1: Handle phase updates
                for phase in all_phases:
                    phase.active = False

                if target_device == "SP0":
                    # Moving to unassigned
                    not_set_phase = next((p for p in all_phases if p.status == "0 - NOT SET"), None)
                    if not_set_phase:
                        not_set_phase.active = True
                        not_set_phase.device = "SP0"
                        not_set_phase.operator = operator

                    # Remove from kanban completely
                    if current_kanban:
                        self._remove_from_kanban(current_kanban)
                        db.session.delete(current_kanban)

                else:
                    # Moving to spreader device
                    to_load_phase = next((p for p in all_phases if p.status == "1 - TO LOAD"), None)
                    if to_load_phase:
                        to_load_phase.active = True
                        to_load_phase.device = target_device
                        to_load_phase.operator = operator

                    # Handle kanban entry - MS device doesn't use shifts
                    if target_device == "MS":
                        target_shift = None  # MS doesn't use shifts

                    if current_kanban:
                        # Update existing kanban entry
                        self._move_existing_kanban(current_kanban, target_day, target_shift, target_position)
                    else:
                        # Create new kanban entry
                        self._create_new_kanban(mattress_id, target_day, target_shift, target_position)

            return {"success": True, "message": "Mattress moved successfully"}, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error: {str(e)}"}, 500

    def _remove_from_kanban(self, kanban_entry):
        """Remove kanban entry and reorder remaining items"""
        old_day = kanban_entry.day
        old_shift = kanban_entry.shift
        old_position = kanban_entry.position

        # Shift all items after this position up by 1
        items_to_shift = db.session.query(MattressKanban).filter(
            MattressKanban.day == old_day,
            MattressKanban.shift == old_shift,
            MattressKanban.position > old_position
        ).all()

        for item in items_to_shift:
            item.position -= 1

    def _move_existing_kanban(self, kanban_entry, target_day, target_shift, target_position):
        """Move existing kanban entry to new position"""
        old_day = kanban_entry.day
        old_shift = kanban_entry.shift
        old_position = kanban_entry.position

        # Check if moving within same column
        same_column = (old_day == target_day and old_shift == target_shift)

        if same_column and target_position is not None:
            # Reordering within same column
            self._reorder_within_column(kanban_entry, old_position, target_position, target_day, target_shift)
        else:
            # Moving to different column
            # Remove from old position
            self._remove_from_kanban(kanban_entry)

            # Add to new position
            if target_position is not None:
                # Insert at specific position
                self._insert_at_position(target_day, target_shift, target_position)
                kanban_entry.position = target_position
            else:
                # Add to end
                max_pos = self._get_max_position(target_day, target_shift)
                kanban_entry.position = max_pos + 1

            kanban_entry.day = target_day
            kanban_entry.shift = target_shift

    def _create_new_kanban(self, mattress_id, target_day, target_shift, target_position):
        """Create new kanban entry"""
        if target_position is not None:
            # Insert at specific position
            self._insert_at_position(target_day, target_shift, target_position)
            new_position = target_position
        else:
            # Add to end
            new_position = self._get_max_position(target_day, target_shift) + 1

        new_kanban = MattressKanban(
            mattress_id=mattress_id,
            day=target_day,
            shift=target_shift,
            position=new_position
        )
        db.session.add(new_kanban)

    def _reorder_within_column(self, kanban_entry, old_position, new_position, day, shift):
        """Reorder items within the same column with improved logic"""
        if old_position == new_position:
            return



        # Get all items in the same column (excluding the one being moved)
        all_items = db.session.query(MattressKanban).filter(
            MattressKanban.day == day,
            MattressKanban.shift == shift,
            MattressKanban.mattress_id != kanban_entry.mattress_id
        ).order_by(MattressKanban.position).all()

        # Create a new ordered list
        new_order = []
        moved_item_inserted = False

        for i, item in enumerate(all_items):
            # Adjust for the removed item
            current_pos = item.position if item.position < old_position else item.position - 1

            # Insert the moved item at the correct position
            if not moved_item_inserted and current_pos >= new_position:
                new_order.append(kanban_entry)
                moved_item_inserted = True

            new_order.append(item)

        # If we haven't inserted the moved item yet, add it to the end
        if not moved_item_inserted:
            new_order.append(kanban_entry)

        # Update all positions
        for i, item in enumerate(new_order):
            item.position = i




    def _insert_at_position(self, day, shift, position):
        """Insert space at specific position by shifting items down"""
        items_to_shift = db.session.query(MattressKanban).filter(
            MattressKanban.day == day,
            MattressKanban.shift == shift,
            MattressKanban.position >= position
        ).all()

        for item in items_to_shift:
            item.position += 1

    def _get_max_position(self, day, shift):
        """Get maximum position for given day/shift"""
        max_pos = db.session.query(db.func.max(MattressKanban.position)).filter(
            MattressKanban.day == day,
            MattressKanban.shift == shift
        ).scalar()
        return max_pos or 0

@mattress_api.route('/update_device/<int:mattress_id>', methods=['PUT'])
class UpdateDeviceResource(Resource):
    """Legacy endpoint - redirects to new unified move endpoint"""
    def put(self, mattress_id):
        # Redirect to new unified endpoint
        move_resource = MoveMattressResource()
        return move_resource.put(mattress_id)

@mattress_api.route('/cleanup_kanban', methods=['POST'])
class CleanupKanbanResource(Resource):
    """Clean up orphaned kanban entries and reset positions"""
    def post(self):
        try:
            # Step 1: Find all kanban entries
            all_kanban = db.session.query(MattressKanban).all()
            print(f"Found {len(all_kanban)} kanban entries")

            # Step 2: Find orphaned entries (kanban entries for mattresses that should be in SP0)
            orphaned_count = 0
            valid_entries = []

            for kanban in all_kanban:
                # Get the active phase for this mattress
                active_phase = db.session.query(MattressPhase).filter_by(
                    mattress_id=kanban.mattress_id,
                    active=True
                ).first()

                if not active_phase:
                    print(f"Orphaned: Mattress {kanban.mattress_id} has no active phase")
                    db.session.delete(kanban)
                    orphaned_count += 1
                elif active_phase.device == "SP0" or active_phase.status == "0 - NOT SET":
                    print(f"Orphaned: Mattress {kanban.mattress_id} should be in SP0 (device: {active_phase.device}, status: {active_phase.status})")
                    db.session.delete(kanban)
                    orphaned_count += 1
                elif active_phase.status not in ["1 - TO LOAD", "2 - ON SPREAD", "PENDING APPROVAL"]:
                    print(f"Orphaned: Mattress {kanban.mattress_id} has inactive status: {active_phase.status}")
                    db.session.delete(kanban)
                    orphaned_count += 1
                else:
                    valid_entries.append(kanban)

            print(f"Deleted {orphaned_count} orphaned kanban entries")
            print(f"Kept {len(valid_entries)} valid entries")

            # Step 3: Reset positions for remaining valid entries
            # Group by day/shift
            position_groups = {}
            for kanban in valid_entries:
                key = f"{kanban.day}_{kanban.shift}"
                if key not in position_groups:
                    position_groups[key] = []
                position_groups[key].append(kanban)

            reset_count = 0
            for group_key, group_kanban in position_groups.items():
                # Sort by current position to maintain relative order
                group_kanban.sort(key=lambda k: k.position)

                # Reset positions starting from 1
                for i, kanban in enumerate(group_kanban):
                    old_position = kanban.position
                    kanban.position = i + 1
                    if old_position != kanban.position:
                        reset_count += 1
                        print(f"Reset mattress {kanban.mattress_id} position: {old_position} → {kanban.position}")

            db.session.commit()

            return {
                "success": True,
                "message": f"Cleanup complete: deleted {orphaned_count} orphaned entries, reset {reset_count} positions",
                "orphaned_deleted": orphaned_count,
                "positions_reset": reset_count,
                "valid_entries": len(valid_entries)
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Cleanup failed: {str(e)}"}, 500

@mattress_api.route('/cleanup_kanban', methods=['POST'])
class CleanupKanbanResource(Resource):
    """Remove kanban entries for mattresses that have advanced beyond kanban phases"""
    def post(self):
        try:
            # Find all kanban entries for mattresses that shouldn't be in kanban anymore
            kanban_entries = db.session.query(MattressKanban).join(
                MattressPhase, MattressKanban.mattress_id == MattressPhase.mattress_id
            ).filter(
                MattressPhase.active == True,
                ~MattressPhase.status.in_(["0 - NOT SET", "1 - TO LOAD", "2 - ON SPREAD", "PENDING APPROVAL"])
            ).all()

            deleted_count = 0
            for kanban in kanban_entries:
                print(f"Deleting kanban entry for mattress {kanban.mattress_id} (advanced beyond kanban phases)")
                db.session.delete(kanban)
                deleted_count += 1

            # Also find kanban entries where mattress has no active phase or is SP0
            orphaned_entries = db.session.query(MattressKanban).outerjoin(
                MattressPhase, db.and_(
                    MattressKanban.mattress_id == MattressPhase.mattress_id,
                    MattressPhase.active == True
                )
            ).filter(
                db.or_(
                    MattressPhase.mattress_id.is_(None),  # No active phase
                    MattressPhase.device == "SP0"  # Should be in SP0
                )
            ).all()

            for kanban in orphaned_entries:
                print(f"Deleting orphaned kanban entry for mattress {kanban.mattress_id}")
                db.session.delete(kanban)
                deleted_count += 1

            db.session.commit()

            return {
                "success": True,
                "message": f"Deleted {deleted_count} invalid kanban entries",
                "deleted_count": deleted_count
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Cleanup failed: {str(e)}"}, 500

@mattress_api.route('/update_position/<int:mattress_id>', methods=['PUT'])
class UpdateKanbanPositionResource(Resource):
    """Legacy endpoint - redirects to new unified move endpoint"""
    def put(self, mattress_id):
        data = request.get_json()
        # Add device info for unified endpoint
        kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
        if kanban:
            # Get device from active phase
            active_phase = db.session.query(MattressPhase).filter_by(
                mattress_id=mattress_id, active=True
            ).first()
            if active_phase:
                data['device'] = active_phase.device
            else:
                data['device'] = 'SP0'
        else:
            data['device'] = 'SP0'

        # Redirect to new unified endpoint
        move_resource = MoveMattressResource()
        return move_resource.put(mattress_id)

@mattress_api.route('/approval')
class MattressApproval(Resource):
    def get(self):
        try:
            # Step 1: Fetch sizes separately
            size_rows = db.session.query(
                MattressSize.mattress_id,
                MattressSize.size,
                MattressSize.pcs_layer
            ).all()

            # Step 2: Build a dictionary of sizes per mattress_id
            size_dict = defaultdict(list)
            for row in size_rows:
                pcs = int(row.pcs_layer) if row.pcs_layer.is_integer() else row.pcs_layer
                size_dict[row.mattress_id].append(f"{row.size} - {pcs}")

            # Step 3: Fetch the main mattress info
            query = db.session.query(
                MattressPhase.mattress_id,
                Mattresses.mattress,
                Mattresses.order_commessa,
                Mattresses.fabric_code,
                Mattresses.fabric_color,
                Mattresses.fabric_type,
                Mattresses.dye_lot,
                MattressMarker.marker_name,
                MattressMarker.marker_length,
                MattressMarker.marker_width,
                MattressDetail.layers,
                MattressDetail.cons_planned.label('consumption'),
                MattressDetail.length_mattress,
                CollarettoDetail.usable_width
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .outerjoin(MattressMarker, MattressPhase.mattress_id == MattressMarker.mattress_id) \
             .join(MattressDetail, MattressPhase.mattress_id == MattressDetail.mattress_id) \
             .outerjoin(CollarettoDetail, MattressPhase.mattress_id == CollarettoDetail.mattress_id) \
             .filter(MattressPhase.status == "0 - NOT SET") \
             .filter(MattressPhase.active == True) \
             .all()

            # Step 4: Build the final result, inserting the sizes string from the dict
            result = []
            for row in query:
                result.append({
                    "id": row.mattress_id,
                    "mattress": row.mattress,
                    "order_commessa": row.order_commessa,
                    "fabric_code": row.fabric_code,
                    "fabric_color": row.fabric_color,
                    "fabric_type": row.fabric_type,
                    "dye_lot": row.dye_lot,
                    "marker": row.marker_name,
                    "marker_length": row.marker_length or row.length_mattress,
                    "width": row.marker_width or row.usable_width,
                    "layers": row.layers,
                    "sizes": '; '.join(size_dict.get(row.mattress_id, [])),
                    "consumption": row.consumption
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/production_center/save', methods=['POST'])
class SaveMattressProductionCenter(Resource):
    def post(self):
        try:
            data = request.get_json()
            table_id = data.get("table_id")
            table_type = data.get("table_type", "MATTRESS")  # Default to MATTRESS for backward compatibility
            production_center = data.get("production_center")
            cutting_room = data.get("cutting_room")
            destination = data.get("destination")

            if not table_id:
                return {"success": False, "msg": "table_id is required"}, 400

            # Validate table_type
            if table_type not in ['MATTRESS', 'ALONG', 'WEFT', 'BIAS', 'ADHESIVE']:
                return {"success": False, "msg": "table_type must be MATTRESS, ALONG, WEFT, BIAS, or ADHESIVE"}, 400

            # Check if record exists
            existing = db.session.query(MattressProductionCenter).filter_by(table_id=table_id).first()

            if existing:
                # Update existing record
                existing.table_type = table_type
                existing.production_center = production_center
                existing.cutting_room = cutting_room
                existing.destination = destination
            else:
                # Create new record
                new_entry = MattressProductionCenter(
                    table_id=table_id,
                    table_type=table_type,
                    production_center=production_center,
                    cutting_room=cutting_room,
                    destination=destination
                )
                db.session.add(new_entry)

            db.session.commit()
            return {"success": True}, 200

        except Exception as e:
            db.session.rollback()

            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/production_center/get/<string:table_id>', methods=['GET'])
class GetMattressProductionCenter(Resource):
    def get(self, table_id):
        try:
            record = db.session.query(MattressProductionCenter).filter_by(table_id=table_id).first()
            if record:
                return {
                    "success": True,
                    "data": {
                        "table_type": record.table_type,
                        "production_center": record.production_center,
                        "cutting_room": record.cutting_room,
                        "destination": record.destination
                    }
                }, 200
            else:
                return {"success": True, "data": None}, 200  # Still a success, just empty
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/production_center/delete/<string:table_id>', methods=['DELETE'])
class DeleteMattressProductionCenter(Resource):
    def delete(self, table_id):
        """Delete production center entry for a specific table_id"""
        try:
            record = db.session.query(MattressProductionCenter).filter_by(table_id=table_id).first()

            if record:
                db.session.delete(record)
                db.session.commit()

                return {"success": True, "msg": f"Production center entry for table {table_id} deleted successfully"}, 200
            else:
                # Not an error if the record doesn't exist - table might not have had production center data
                return {"success": True, "msg": f"No production center entry found for table {table_id}"}, 200

        except Exception as e:
            db.session.rollback()

            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/production_center/orders', methods=['GET'])
class GetOrdersWithProductionCenter(Resource):
    def get(self):
        """Get all order IDs that have mattresses with production center data"""
        try:
            # Query distinct order IDs that have mattresses with production center data
            orders = db.session.query(
                Mattresses.order_commessa
            ).join(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).distinct().all()

            result = [{"order_commessa": order.order_commessa} for order in orders]

            return {"success": True, "data": result}, 200

        except Exception as e:

            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/production_center/orders_by_cutting_room/<string:cutting_room>', methods=['GET'])
class GetOrdersByCuttingRoom(Resource):
    def get(self, cutting_room):
        """Get all order IDs assigned to a specific cutting room"""
        try:
            # Query distinct order IDs that have mattresses assigned to this cutting room
            orders = db.session.query(
                Mattresses.order_commessa
            ).join(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).filter(
                MattressProductionCenter.cutting_room == cutting_room
            ).distinct().all()

            result = [{"order_commessa": order.order_commessa} for order in orders]



            return {"success": True, "data": result}, 200

        except Exception as e:

            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/production_center/combinations/<string:order_commessa>', methods=['GET'])
class GetProductionCenterCombinations(Resource):
    def get(self, order_commessa):
        """Get unique production center combinations for an order from mattress production center tables"""
        try:
            # Query unique combinations of production center, cutting room and destination from mattress tables for this order
            # Only require destination for ZALLI and DELICIA cutting rooms
            combinations = db.session.query(
                MattressProductionCenter.production_center,
                MattressProductionCenter.cutting_room,
                MattressProductionCenter.destination
            ).join(
                Mattresses, Mattresses.table_id == MattressProductionCenter.table_id
            ).filter(
                Mattresses.order_commessa == order_commessa,
                Mattresses.item_type.in_(['AS', 'MS', 'ASA', 'MSA']),
                MattressProductionCenter.cutting_room.isnot(None)
            ).distinct().all()

            # Convert to list of dictionaries and group by cutting room logic
            result = []
            cutting_room_groups = {}

            for production_center, cutting_room, destination in combinations:
                # For ZALLI and DELICIA, we need destination-specific combinations
                if cutting_room in ['ZALLI', 'DELICIA']:
                    if destination:  # Only include if destination is set
                        result.append({
                            "production_center": production_center,
                            "cutting_room": cutting_room,
                            "destination": destination
                        })
                else:
                    # For other cutting rooms, group by cutting room only (ignore destination variations)
                    key = f"{production_center}_{cutting_room}"
                    if key not in cutting_room_groups:
                        cutting_room_groups[key] = {
                            "production_center": production_center,
                            "cutting_room": cutting_room,
                            "destination": destination  # Use the first destination found, or None
                        }

            # Add the grouped cutting rooms to result
            result.extend(cutting_room_groups.values())

            return {
                "success": True,
                "data": result
            }, 200

        except Exception as e:

            return {"success": False, "msg": str(e)}, 500

@mattress_api.route('/approve')
class ApproveMattressesResource(Resource):
    def post(self):
        mattress_ids = request.json.get('mattress_ids', [])
        operator = request.json.get('operator', 'Unknown')  # ✅ Get operator from frontend


        if not mattress_ids:
            return {"success": False, "message": "No mattress IDs provided"}, 400

        try:
            # Deactivate the '0 - NOT SET' phase
            deactivated = db.session.query(MattressPhase).filter(
                MattressPhase.mattress_id.in_(mattress_ids),
                MattressPhase.status == "0 - NOT SET",
                MattressPhase.active == True
            ).update({"active": False}, synchronize_session='evaluate')

            # Activate '1 - TO LOAD' and set operator name
            activated = db.session.query(MattressPhase).filter(
                MattressPhase.mattress_id.in_(mattress_ids),
                MattressPhase.status == "1 - TO LOAD"
            ).update({"active": True, "operator": operator}, synchronize_session='evaluate')

            # Auto-assign MS mattresses to MS device
            ms_mattresses = db.session.query(Mattresses).filter(
                Mattresses.id.in_(mattress_ids),
                Mattresses.spreading_method == "MANUAL"
            ).all()

            auto_assigned_count = 0
            for mattress in ms_mattresses:
                # Update the phase to assign to MS device
                ms_phase = db.session.query(MattressPhase).filter(
                    MattressPhase.mattress_id == mattress.id,
                    MattressPhase.status == "1 - TO LOAD",
                    MattressPhase.active == True
                ).first()

                if ms_phase:
                    ms_phase.device = "MS"

                    # Create kanban entry for MS device (no shift needed)
                    max_position = db.session.query(db.func.max(MattressKanban.position)).filter(
                        MattressKanban.day == 'today',
                        MattressKanban.shift.is_(None)  # MS doesn't use shifts
                    ).scalar() or 0

                    new_kanban = MattressKanban(
                        mattress_id=mattress.id,
                        day='today',
                        shift=None,  # MS doesn't use shifts
                        position=max_position + 1
                    )
                    db.session.add(new_kanban)
                    auto_assigned_count += 1

            db.session.commit()

            message = f"Deactivated: {deactivated}, Activated: {activated}"
            if auto_assigned_count > 0:
                message += f", Auto-assigned {auto_assigned_count} MS mattresses to MS device"

            return {"success": True, "message": message}, 200

        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/check_day_transition', methods=['POST'])
class CheckDayTransitionResource(Resource):
    """Check if day transition is needed and perform it if necessary"""

    def post(self):
        """Check if we need to transition from tomorrow to today based on database-stored date"""
        try:
            today_str = date.today().isoformat()  # Format: YYYY-MM-DD

            # Get the last transition date from database
            last_transition_setting = db.session.query(SystemSettings).filter_by(
                setting_key='last_day_transition'
            ).first()

            last_transition_date = None
            if last_transition_setting:
                last_transition_date = last_transition_setting.setting_value

            # If we haven't transitioned today, perform the transition
            if last_transition_date != today_str:
                return self._perform_transition(today_str)
            else:
                # Already transitioned today
                return {
                    "success": True,
                    "message": "Day transition already completed for today",
                    "moved_count": 0,
                    "already_done": True
                }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error checking day transition: {str(e)}"}, 500

    def _perform_transition(self, today_str):
        """Perform the actual transition from tomorrow to today"""
        try:
            # Get all current 'today' items to determine max positions per shift
            today_items = db.session.query(MattressKanban).filter_by(day='today').all()

            # Calculate max positions for each shift in 'today'
            shift_max_positions = {}
            for item in today_items:
                shift_key = item.shift
                if shift_key not in shift_max_positions:
                    shift_max_positions[shift_key] = 0
                shift_max_positions[shift_key] = max(shift_max_positions[shift_key], item.position)

            # Get all 'tomorrow' items
            tomorrow_items = db.session.query(MattressKanban).filter_by(day='tomorrow').order_by(
                MattressKanban.shift, MattressKanban.position
            ).all()

            # Move 'tomorrow' items to 'today' with positions after existing 'today' items
            for item in tomorrow_items:
                shift_key = item.shift
                # Get the next available position for this shift
                next_position = shift_max_positions.get(shift_key, 0) + 1

                # Update the item
                item.day = 'today'
                item.position = next_position

                # Update max position for this shift
                shift_max_positions[shift_key] = next_position

            # Update or create the last transition date setting
            last_transition_setting = db.session.query(SystemSettings).filter_by(
                setting_key='last_day_transition'
            ).first()

            if last_transition_setting:
                last_transition_setting.setting_value = today_str
                last_transition_setting.updated_at = datetime.now()
            else:
                new_setting = SystemSettings(
                    setting_key='last_day_transition',
                    setting_value=today_str
                )
                db.session.add(new_setting)

            # Commit the transaction
            db.session.commit()

            moved_count = len(tomorrow_items)
            return {
                "success": True,
                "message": f"Successfully moved {moved_count} items from tomorrow to today",
                "moved_count": moved_count,
                "already_done": False
            }, 200

        except Exception as e:
            db.session.rollback()
            raise e

@mattress_api.route('/update_status/<int:mattress_id>', methods=['PUT'])
class UpdateMattressStatusResource(Resource):
    """Update the status of a mattress"""

    @mattress_api.doc(params={'mattress_id': 'ID of the mattress to update'})
    def put(self, mattress_id):
        """Update the status of a mattress to a new value with race condition prevention"""
        data = request.get_json()
        new_status = data.get('status')
        operator = data.get('operator', 'Unknown')
        device = data.get('device')  # Get device from request
        expected_current_status = data.get('expected_current_status')  # For optimistic locking

        if not new_status:
            return {"success": False, "message": "Status is required"}, 400

        try:
            # Get all mattress phases with row-level locking to prevent concurrent modifications
            all_phases = db.session.query(MattressPhase).filter_by(mattress_id=mattress_id).with_for_update().all()
            if not all_phases:
                return {"success": False, "message": "Mattress phases not found"}, 404

            # Get current active phase for validation
            current_active_phase = next((p for p in all_phases if p.active), None)
            if not current_active_phase:
                return {"success": False, "message": "No active phase found for mattress"}, 404

            # Optimistic locking: check if the current status matches expected status
            if expected_current_status and current_active_phase.status != expected_current_status:
                return {
                    "success": False,
                    "message": f"Mattress status has changed. Expected '{expected_current_status}' but found '{current_active_phase.status}'. Please refresh and try again.",
                    "current_status": current_active_phase.status,
                    "conflict": True
                }, 409  # HTTP 409 Conflict

            # Special validation for "4 - ON CUT" status to prevent multiple cutters
            if new_status == "4 - ON CUT":
                # Ensure mattress is in "3 - TO CUT" status before allowing "4 - ON CUT"
                if current_active_phase.status != "3 - TO CUT":
                    return {
                        "success": False,
                        "message": f"Cannot start cutting. Mattress must be in 'TO CUT' status, but is currently '{current_active_phase.status}'.",
                        "current_status": current_active_phase.status,
                        "conflict": True
                    }, 409

                # CRITICAL: Check if mattress is already assigned to a different CUTTER device
                # This prevents the race condition where two cutters try to start the same mattress
                # Only check for cutter devices (CT1, CT2, etc.), not spreader devices (SP1, SP2, etc.)
                if (current_active_phase.device and
                    current_active_phase.device.startswith('CT') and
                    current_active_phase.device != device):
                    # Get mattress name for better error message
                    current_mattress = db.session.query(Mattresses).filter_by(id=mattress_id).first()
                    mattress_name = current_mattress.mattress if current_mattress else f"ID {mattress_id}"
                    return {
                        "success": False,
                        "message": f"Mattress {mattress_name} has already been assigned to {current_active_phase.device}. Please refresh to see current assignments.",
                        "conflict": True,
                        "assigned_device": current_active_phase.device
                    }, 409

                # Check if this device already has a mattress in "ON CUT" status
                if device:
                    existing_cutting = db.session.query(MattressPhase).filter(
                        MattressPhase.status == "4 - ON CUT",
                        MattressPhase.active == True,
                        MattressPhase.device == device,
                        MattressPhase.mattress_id != mattress_id  # Exclude current mattress
                    ).first()

                    if existing_cutting:
                        # Get mattress name for better error message
                        cutting_mattress = db.session.query(Mattresses).filter_by(id=existing_cutting.mattress_id).first()
                        mattress_name = cutting_mattress.mattress if cutting_mattress else f"ID {existing_cutting.mattress_id}"
                        return {
                            "success": False,
                            "message": f"Device {device} is already cutting mattress {mattress_name}. Please finish the current mattress before starting a new one.",
                            "conflict": True,
                            "active_cutting_mattress": mattress_name
                        }, 409

            # Deactivate current active phases
            for phase in all_phases:
                if phase.active:
                    phase.active = False

            # Activate the requested phase
            target_phase = next((p for p in all_phases if p.status == new_status), None)
            if target_phase:
                target_phase.active = True
                target_phase.operator = operator

                # Set device if provided, otherwise keep from previous phase
                if device:
                    target_phase.device = device
                else:
                    # Keep the device from the previous phase
                    current_device = next((p.device for p in all_phases if p.device), None)
                    if current_device:
                        target_phase.device = current_device
            else:
                return {"success": False, "message": f"Phase with status '{new_status}' not found"}, 404

            # AUTO-CLEANUP: Remove from kanban if advancing beyond kanban phases
            if new_status not in ["0 - NOT SET", "1 - TO LOAD", "2 - ON SPREAD", "PENDING APPROVAL"]:
                kanban_entry = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if kanban_entry:
                    print(f"Auto-removing mattress {mattress_id} from kanban (advanced to {new_status})")
                    db.session.delete(kanban_entry)

            db.session.commit()
            return {"success": True, "message": f"Status updated to '{new_status}'"}, 200

        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/cutter_queue')
class GetCutterQueueResource(Resource):
    """Get mattresses for cutter view - shows mattresses with TO CUT or ON CUT status"""
    def get(self):
        try:
            # Get cutter device from query parameter
            cutter_device = request.args.get('device')
            if not cutter_device:
                return {"success": False, "message": "Cutter device parameter is required"}, 400

            # Query mattresses with active TO CUT or ON CUT phases
            query = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.status,
                MattressPhase.device,
                MattressPhase.operator,
                Mattresses.mattress,
                Mattresses.order_commessa,
                Mattresses.fabric_code,
                Mattresses.fabric_color,
                Mattresses.dye_lot,
                MattressMarker.marker_name,
                MattressDetail.layers,
                MattressDetail.layers_a,
                MattressDetail.cons_planned,
                MattressProductionCenter.destination
            ).select_from(MattressPhase) \
             .join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .join(MattressDetail, Mattresses.id == MattressDetail.mattress_id) \
             .outerjoin(MattressMarker, Mattresses.id == MattressMarker.mattress_id) \
             .outerjoin(MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id) \
             .filter(MattressPhase.active == True) \
             .filter(MattressPhase.status.in_(["3 - TO CUT", "4 - ON CUT"])) \
             .filter(MattressDetail.bagno_ready == True)

            # Filter by cutter device assignment
            # Show ALL "TO CUT" mattresses to all cutters, but only "ON CUT" mattresses assigned to this cutter
            query = query.filter(
                db.or_(
                    # All TO CUT mattresses (available to any cutter)
                    MattressPhase.status == "3 - TO CUT",
                    # Only ON CUT mattresses assigned to this specific cutter
                    db.and_(
                        MattressPhase.status == "4 - ON CUT",
                        MattressPhase.device == cutter_device
                    )
                )
            )

            results = query.all()

            # Get sizes and piece quantities for each mattress
            mattress_ids = [row.mattress_id for row in results]
            sizes_query = db.session.query(
                MattressSize.mattress_id,
                MattressSize.size,
                MattressSize.pcs_layer
            ).filter(MattressSize.mattress_id.in_(mattress_ids)).all()

            # Group sizes by mattress_id and calculate total pieces per layer
            size_dict = {}
            pcs_sum_dict = {}
            for size_row in sizes_query:
                if size_row.mattress_id not in size_dict:
                    size_dict[size_row.mattress_id] = []
                    pcs_sum_dict[size_row.mattress_id] = 0

                # Format pieces as integer if it's a whole number, otherwise as float
                pcs = int(size_row.pcs_layer) if size_row.pcs_layer.is_integer() else size_row.pcs_layer
                size_dict[size_row.mattress_id].append(f"{size_row.size} - {pcs}")
                pcs_sum_dict[size_row.mattress_id] += pcs

            # Format results
            result = []
            for row in results:
                # Calculate total pieces: pieces per layer * effective layers
                pcs_per_layer = pcs_sum_dict.get(row.mattress_id, 0)
                effective_layers = row.layers_a if row.layers_a is not None else row.layers
                total_pcs = pcs_per_layer * effective_layers if pcs_per_layer else 0

                result.append({
                    "id": row.mattress_id,
                    "mattress": row.mattress,
                    "status": row.status,
                    "device": row.device,
                    "operator": row.operator,
                    "order_commessa": row.order_commessa,
                    "fabric_code": row.fabric_code,
                    "fabric_color": row.fabric_color,
                    "dye_lot": row.dye_lot,
                    "marker": row.marker_name,
                    "layers": row.layers,
                    "layers_a": row.layers_a,
                    "consumption": row.cons_planned,
                    "destination": row.destination,
                    "sizes": "; ".join(size_dict.get(row.mattress_id, [])),
                    "total_pcs": total_pcs
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/update_status_and_layers/<int:mattress_id>', methods=['PUT'])
class UpdateStatusAndLayersResource(Resource):
    """Update both status and actual layers of a mattress in a single call"""

    @mattress_api.doc(params={'mattress_id': 'ID of the mattress to update'})
    def put(self, mattress_id):
        """Update both status and actual layers (layers_a) of a mattress"""
        data = request.get_json()
        new_status = data.get('status')
        layers_a = data.get('layers_a')
        operator = data.get('operator', 'Unknown')
        device = data.get('device')

        if not new_status:
            return {"success": False, "message": "Status is required"}, 400

        if layers_a is None:
            return {"success": False, "message": "layers_a is required"}, 400

        try:
            # Update status first
            all_phases = db.session.query(MattressPhase).filter_by(mattress_id=mattress_id).all()
            if not all_phases:
                return {"success": False, "message": "Mattress phases not found"}, 404

            # Deactivate current active phases
            for phase in all_phases:
                if phase.active:
                    phase.active = False

            # Activate the requested phase
            target_phase = next((p for p in all_phases if p.status == new_status), None)
            if target_phase:
                target_phase.active = True
                target_phase.operator = operator

                # Set device if provided, otherwise keep from previous phase
                if device:
                    target_phase.device = device
                else:
                    # Keep the device from the previous phase
                    current_device = next((p.device for p in all_phases if p.device), None)
                    if current_device:
                        target_phase.device = current_device
            else:
                return {"success": False, "message": f"Phase with status '{new_status}' not found"}, 404

            # AUTO-CLEANUP: Remove from kanban if advancing beyond kanban phases
            if new_status not in ["0 - NOT SET", "1 - TO LOAD", "2 - ON SPREAD", "PENDING APPROVAL"]:
                kanban_entry = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if kanban_entry:
                    print(f"Auto-removing mattress {mattress_id} from kanban (advanced to {new_status})")
                    db.session.delete(kanban_entry)

            # Update layers_a and calculate cons_actual
            mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()
            if not mattress_detail:
                return {"success": False, "message": "Mattress detail not found"}, 404

            # Update the layers_a field
            mattress_detail.layers_a = layers_a

            # Calculate cons_actual using the same formula as cons_planned
            if mattress_detail.layers > 0:
                # cons_actual = (cons_planned / layers) * layers_a
                mattress_detail.cons_actual = (mattress_detail.cons_planned / mattress_detail.layers) * float(layers_a)
            else:
                # Fallback to direct calculation if layers is zero
                mattress_detail.cons_actual = mattress_detail.length_mattress * float(layers_a)

            db.session.commit()
            return {"success": True, "message": f"Status updated to '{new_status}' and layers_a updated to {layers_a}"}, 200

        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/update_layers_a/<int:mattress_id>', methods=['PUT'])
class UpdateLayersAResource(Resource):
    """Update the actual layers (layers_a) of a mattress"""

    @mattress_api.doc(params={'mattress_id': 'ID of the mattress to update'})
    def put(self, mattress_id):
        """Update the actual layers (layers_a) of a mattress"""
        data = request.get_json()
        layers_a = data.get('layers_a')

        if layers_a is None:
            return {"success": False, "message": "layers_a is required"}, 400

        try:
            # Find the mattress detail entry
            mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()

            if not mattress_detail:
                return {"success": False, "message": "Mattress detail not found"}, 404

            # Update the layers_a field
            mattress_detail.layers_a = layers_a

            # Calculate cons_actual using the same formula as cons_planned
            # If layers is not zero, calculate based on the ratio of cons_planned to layers
            if mattress_detail.layers > 0:
                # cons_actual = (cons_planned / layers) * layers_a
                mattress_detail.cons_actual = (mattress_detail.cons_planned / mattress_detail.layers) * float(layers_a)
            else:
                # Fallback to direct calculation if layers is zero
                mattress_detail.cons_actual = mattress_detail.length_mattress * float(layers_a)

            db.session.commit()

            return {"success": True, "message": "Actual layers and consumption updated successfully"}, 200

        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/order_ids')
class MattressOrderIdsResource(Resource):
    def get(self):
        """Fetch all unique order_commessa from mattresses"""
        try:
            # Query distinct order_commessa from the database
            result = db.session.query(Mattresses.order_commessa).distinct().all()

            # Flatten the result: list of dicts instead of list of tuples
            data = [{"order_commessa": row[0]} for row in result if row[0] is not None]

            return {"success": True, "data": data}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/production_center/options', methods=['GET'])
class GetProductionCenterOptions(Resource):
    def get(self):
        """Get all available production center options"""
        try:
            # Real production center combinations based on your system configuration
            options = [
                # PXE1 - ZALLI combinations
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "ZALLI 1 - SECTOR 1"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "ZALLI 1 - SECTOR 2"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "ZALLI 1 - SECTOR 3"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "ZALLI 2"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "ZALLI 3"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "INTERTOP"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "SANIA"},
                {"production_center": "PXE1", "cutting_room": "ZALLI", "destination": "CUTTING SECTION"},

                # PXE1 - VERONA combinations
                {"production_center": "PXE1", "cutting_room": "VERONA", "destination": "VERONA"},

                # PXE1 - TEXCONS combinations
                {"production_center": "PXE1", "cutting_room": "TEXCONS", "destination": "TEXCONS"},

                # PXE3 - VEGATEX combinations
                {"production_center": "PXE3", "cutting_room": "VEGATEX", "destination": "VEGATEX"},

                # PXE3 - SINA STYLE combinations
                {"production_center": "PXE3", "cutting_room": "SINA STYLE L", "destination": "SINA STYLE L"},
                {"production_center": "PXE3", "cutting_room": "SINA STYLE D", "destination": "SINA STYLE D"},

                # PXE3 - ZEYNTEX combinations
                {"production_center": "PXE3", "cutting_room": "ZEYNTEX", "destination": "ZEYNTEX"},

                # PXE3 - DELICIA combinations
                {"production_center": "PXE3", "cutting_room": "DELICIA", "destination": "DELICIA"},
                {"production_center": "PXE3", "cutting_room": "DELICIA", "destination": "SUNAI"},
                {"production_center": "PXE3", "cutting_room": "DELICIA", "destination": "NADJI"},
                {"production_center": "PXE3", "cutting_room": "DELICIA", "destination": "SABRI89"},

                # PXE3 - VAIDE MOLA combinations
                {"production_center": "PXE3", "cutting_room": "VAIDE MOLA", "destination": "VAIDE MOLA"},

                # PXE3 - HADJIOLI combinations
                {"production_center": "PXE3", "cutting_room": "HADJIOLI", "destination": "HADJIOLI"},

                # PXE3 - YUMER combinations
                {"production_center": "PXE3", "cutting_room": "YUMER", "destination": "YUMER"},

                # PXE3 - RILA TEXTILE combinations
                {"production_center": "PXE3", "cutting_room": "RILA TEXTILE", "destination": "RILA TEXTILE"},
            ]

            return {"success": True, "data": options}, 200

        except Exception as e:

            return {"success": False, "msg": str(e)}, 500



