from flask import Blueprint, request, jsonify
from api.models import Mattresses, db, MattressPhase, MattressDetail, MattressMarker, MarkerHeader, MattressSize, MattressKanban
from flask_restx import Namespace, Resource
from sqlalchemy import func
from collections import defaultdict

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
                "dye_lot", "item_type", "spreading_method", "layers", "length_mattress", "cons_planned", 
                "extra", "marker_name", "marker_width", "marker_length"
            ]
            for field in required_fields:
                if field not in data or data[field] is None:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400

            # ✅ Check if the mattress already exists
            existing_mattress = Mattresses.query.filter_by(mattress=data["mattress"]).first()

            if existing_mattress:
                print(f"🔄 Updating existing mattress: {data['mattress']}")

                # ✅ Update mattress details
                existing_mattress.order_commessa = data["order_commessa"]
                existing_mattress.fabric_type = data["fabric_type"]
                existing_mattress.fabric_code = data["fabric_code"]
                existing_mattress.fabric_color = data["fabric_color"]
                existing_mattress.dye_lot = data["dye_lot"]
                existing_mattress.item_type = data["item_type"]
                existing_mattress.spreading_method = data["spreading_method"]

                # ✅ Update mattress details
                mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                if mattress_detail:
                    mattress_detail.layers = data["layers"]
                    mattress_detail.length_mattress = data["length_mattress"]
                    mattress_detail.cons_planned = data["cons_planned"]
                    mattress_detail.extra = data["extra"]
                else:
                    new_mattress_detail = MattressDetail(
                        mattress_id=existing_mattress.id,
                        layers=data["layers"],
                        length_mattress=data["length_mattress"],
                        cons_planned=data["cons_planned"],
                        extra=data["extra"]
                    )
                    db.session.add(new_mattress_detail)

                mattress_id = existing_mattress.id  # ✅ Get existing ID for marker saving
                db.session.commit()
                print(f"✅ Mattress Updated (ID: {mattress_id})")

                # ✅ Update mattress sizes if provided (for existing mattress)
                if "sizes" in data:
                    for size_data in data["sizes"]:
                        mattress_size = MattressSize.query.filter_by(mattress_id=mattress_id, size=size_data["size"]).first()
                        if mattress_size:
                            # If size exists, update it
                            mattress_size.pcs_layer = size_data["pcs_layer"]
                            mattress_size.pcs_planned = size_data["pcs_planned"]
                            mattress_size.pcs_actual = None  # Leave it as None initially
                        else:
                            # Otherwise, add new mattress size
                            new_mattress_size = MattressSize(
                                mattress_id=mattress_id,
                                style=size_data["style"],
                                size=size_data["size"],
                                pcs_layer=size_data["pcs_layer"],
                                pcs_planned=size_data["pcs_planned"],
                                pcs_actual=None  # Leave it as None initially
                            )
                            db.session.add(new_mattress_size)

            else:
                # ✅ Insert new mattress
                print(f"➕ Inserting new mattress: {data['mattress']}")
                new_mattress = Mattresses(
                    mattress=data["mattress"],
                    order_commessa=data["order_commessa"],
                    fabric_type=data["fabric_type"],
                    fabric_code=data["fabric_code"],
                    fabric_color=data["fabric_color"],
                    dye_lot=data["dye_lot"],
                    item_type=data["item_type"],
                    spreading_method=data["spreading_method"]
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
                    extra=data["extra"]
                )
                db.session.add(new_mattress_detail)

                # ✅ Insert mattress phases
                phases = [
                    MattressPhase(mattress_id=mattress_id, status="0 - NOT SET", active=True, operator=data["operator"]),
                    MattressPhase(mattress_id=mattress_id, status="1 - TO LOAD", active=False),
                    MattressPhase(mattress_id=mattress_id, status="2 - COMPLETED", active=False),
                ]
                db.session.add_all(phases)

                db.session.commit()
                print(f"✅ Mattress Added (ID: {mattress_id})")

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
                    print(f"🟡 Marker changed. Removing old marker {existing_marker.marker_name} and adding {data['marker_name']}")
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
                    print(f"✅ Marker already up to date for Mattress ID: {mattress_id}")

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
                print(f"✅ New marker added for Mattress ID: {mattress_id}")

            db.session.commit()
            return {
                "success": True,
                "message": "Mattress, details, and marker updated successfully",
                "mattress_id": mattress_id
            }, 201

        except Exception as e:
            db.session.rollback()  # ✅ Rollback transaction on error
            print(f"❌ Exception: {str(e)}")
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/get_by_order/<string:order_commessa>', methods=['GET'])
class GetMattressesByOrder(Resource):
    def get(self, order_commessa):
        try:
            mattresses = db.session.query(
                Mattresses,
                MattressDetail.layers,  # Fetch `layers` from mattress_details
                MattressDetail.extra,
                MattressMarker.marker_name,  # Fetch `marker_name` from mattress_markers
                MattressPhase.status.label('phase_status')
            ).outerjoin(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).outerjoin(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).outerjoin(
                MattressPhase, db.and_(Mattresses.id == MattressPhase.mattress_id, MattressPhase.active == True)
            ).filter(
                Mattresses.order_commessa == order_commessa,
                Mattresses.item_type == 'AS'
            ).all()

            if not mattresses:
                return {"success": False, "message": "No mattresses found for this order"}, 404

            result = []
            for mattress, layers, extra, marker_name, phase_status  in mattresses:
                result.append({
                    "mattress": mattress.mattress,
                    "phase_status": phase_status,
                    "fabric_type": mattress.fabric_type,
                    "fabric_code": mattress.fabric_code,
                    "fabric_color": mattress.fabric_color,
                    "dye_lot": mattress.dye_lot,
                    "item_type": mattress.item_type,
                    "spreading_method": mattress.spreading_method,
                    "layers": layers if layers is not None else "",  # Ensure empty if no value
                    "marker_name": marker_name if marker_name is not None else "",  # Ensure empty if no value
                    "allowance": extra if extra is not None else 0
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@ mattress_api.route('/delete/<string:mattress_name>', methods=['DELETE'])
class DeleteMattressResource(Resource):
    def delete(self, mattress_name):
        try:
            mattress = Mattresses.query.filter_by(mattress=mattress_name).first()
            if not mattress:
                return {"success": False, "message": "Mattress not found"}, 404

            db.session.delete(mattress)
            db.session.commit()

            return {"success": True, "message": f"Deleted mattress {mattress_name}"}, 200

        except Exception as e:
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
        
@ mattress_api.route('/kanban')
class GetKanbanMattressesResource(Resource):
    def get(self):
        """Fetch all necessary info for Kanban - active TO LOAD phases with device, operator, marker, layers, fabric, sizes"""
        try:
            # Base query for mattress and phase
            query = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.status,
                MattressPhase.device,
                Mattresses.mattress,
                Mattresses.order_commessa,
                Mattresses.fabric_type,
                Mattresses.fabric_code,
                Mattresses.fabric_color,
                Mattresses.dye_lot,
                Mattresses.spreading_method,
                MattressMarker.marker_name,
                MattressMarker.marker_length,
                MattressMarker.marker_width,
                MattressDetail.layers,
                MattressDetail.cons_planned,
                # Adding left join on mattress_kanban
                db.func.coalesce(MattressKanban.day, 'Not Assigned').label('day'),
                db.func.coalesce(MattressKanban.shift, 'Not Assigned').label('shift'),
                db.func.coalesce(MattressKanban.position, 0).label('position')
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .join(MattressMarker, MattressPhase.mattress_id == MattressMarker.mattress_id) \
             .join(MattressDetail, MattressPhase.mattress_id == MattressDetail.mattress_id) \
             .outerjoin(MattressKanban, MattressPhase.mattress_id == MattressKanban.mattress_id) \
             .filter(MattressPhase.active == True) \
             .filter(MattressPhase.status == "1 - TO LOAD") \
             .order_by(MattressKanban.day, MattressKanban.shift, MattressKanban.position) \
             .all()

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

            # Build final result
            result = []
            for row in query:
                pcs_per_layer = pcs_sum_dict.get(row.mattress_id, 0)
                total_pcs = pcs_per_layer * row.layers if pcs_per_layer else 0

                result.append({
                    "id": row.mattress_id,
                    "mattress": row.mattress,
                    "status": row.status,
                    "device": row.device if row.device else "SP0",
                    "order_commessa": row.order_commessa,
                    "fabric_type": row.fabric_type,
                    "fabric_code": row.fabric_code,
                    "fabric_color": row.fabric_color,
                    "dye_lot": row.dye_lot,
                    "spreading_method": row.spreading_method,
                    "marker": row.marker_name,
                    "marker_length": row.marker_length,
                    "width": row.marker_width,
                    "layers": row.layers,
                    "consumption": row.cons_planned,
                    "sizes": "; ".join(size_dict.get(row.mattress_id, [])),
                    "total_pcs": total_pcs,
                    "day": row.day,  # Includes 'Not Assigned' if not found in mattress_kanban
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
        """Fetch all mattress records with associated details and markers."""
        try:
            # Query all mattresses with their details and markers
            mattresses = Mattresses.query.join(MattressDetail).join(MattressMarker).all()
            
            # Create a list of dictionaries with mattress info, details, and markers
            data = []
            for mattress in mattresses:
                mattress_dict = mattress.to_dict()
                
                # Add related details and markers
                mattress_dict['details'] = [detail.to_dict() for detail in mattress.details]
                mattress_dict['markers'] = [marker.to_dict() for marker in mattress.mattress_markers]
                
                data.append(mattress_dict)
            
            return {"success": True, "data": data}, 200
        
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
        
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

@mattress_api.route('/update_device/<int:mattress_id>', methods=['PUT'])
class UpdateDeviceResource(Resource):
    def put(self, mattress_id):
        data = request.get_json()
        new_device = data.get('device')
        day = data.get('day', 'today')      # Optional, defaults to 'today'
        shift = data.get('shift', '1shift') # Optional, defaults to '1shift'

        if not new_device:
            return {"success": False, "message": "Device is required"}, 400

        try:
            # Update the device inside mattress_phase
            phase = db.session.query(MattressPhase).filter_by(
                mattress_id=mattress_id,
                active=True,
                status='1 - TO LOAD'
            ).first()

            if not phase:
                return {"success": False, "message": "Mattress not found"}, 404

            phase.device = new_device

            # If moved to SP0, delete the mattress from mattress_kanban
            if new_device == "SP0":
                kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if kanban:
                    db.session.delete(kanban)
                    db.session.commit()
                    return {"success": True, "message": "Device moved to SP0, Kanban entry deleted"}, 200
            else:
                # ✅ Upsert into mattress_kanban when not moved to SP0
                kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if not kanban:
                    # Calculate next position for the Kanban board based on the day and shift
                    max_position = db.session.query(db.func.max(MattressKanban.position)).filter_by(day=day, shift=shift).scalar() or 0
                    kanban = MattressKanban(
                        mattress_id=mattress_id,
                        day=day,
                        shift=shift,
                        position=max_position + 1
                    )
                    db.session.add(kanban)
                else:
                    # Update the shift and day if mattress_kanban entry exists
                    kanban.day = day
                    kanban.shift = shift

            db.session.commit()
            return {"success": True, "message": "Device and Kanban updated"}, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500
    
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
                MattressDetail.cons_planned.label('consumption')
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .join(MattressMarker, MattressPhase.mattress_id == MattressMarker.mattress_id) \
             .join(MattressDetail, MattressPhase.mattress_id == MattressDetail.mattress_id) \
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
                    "marker_length": row.marker_length,
                    "width": row.marker_width,
                    "layers": row.layers,
                    "sizes": '; '.join(size_dict.get(row.mattress_id, [])),
                    "consumption": row.consumption
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/approve')
class ApproveMattressesResource(Resource):
    def post(self):
        mattress_ids = request.json.get('mattress_ids', [])
        operator = request.json.get('operator', 'Unknown')  # ✅ Get operator from frontend
        print("Received mattress_ids:", mattress_ids, "Operator:", operator)

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

            db.session.commit()

            return {"success": True, "message": f"Deactivated: {deactivated}, Activated: {activated}"}, 200

        except Exception as e:
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return {"success": False, "message": str(e)}, 500
