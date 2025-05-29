from flask import Blueprint, request, jsonify
from api.models import Mattresses, db, MattressPhase, MattressDetail, MattressMarker, MarkerHeader, MattressSize, MattressKanban, CollarettoDetail
from flask_restx import Namespace, Resource
from sqlalchemy import func
from collections import defaultdict
import time
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
            existing_mattress = Mattresses.query.filter_by(mattress=data["mattress"]).first()

            if existing_mattress:
                print(f"🔄 Updating existing mattress: {data['mattress']}")

                # ✅ Update mattress details
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
                                    print(f"🔁 Deadlock on mattress size {size_data['size']} — retrying ({attempt + 1}/{retry_attempts})...")
                                    time.sleep(0.3)
                                else:
                                    raise
                        else:
                            raise Exception(f"❌ Failed to process mattress size {size_data['size']} after retries")

            else:
                # ✅ Insert new mattress
                print(f"➕ Inserting new mattress: {data['mattress']}")
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
                    extra=data["extra"]
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
                MattressDetail.layers,
                MattressDetail.layers_a,
                MattressDetail.extra,
                MattressDetail.cons_planned,
                MattressDetail.cons_actual,
                MattressDetail.cons_real,
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
                Mattresses.item_type.in_(['AS', 'MS'])
            ).order_by(
                Mattresses.fabric_type, Mattresses.sequence_number
            ).all()

            if not mattresses:
                return {"success": False, "message": "No mattresses found for this order"}, 404

            result = []
            for mattress, layers, layers_a, extra, cons_planned, cons_actual, cons_real, marker_name, phase_status  in mattresses:
                result.append({
                    "mattress": mattress.mattress,
                    "phase_status": phase_status,
                    "fabric_type": mattress.fabric_type,
                    "fabric_code": mattress.fabric_code,
                    "fabric_color": mattress.fabric_color,
                    "dye_lot": mattress.dye_lot,
                    "item_type": mattress.item_type,
                    "spreading_method": mattress.spreading_method,
                    "layers": layers if layers is not None else "",
                    "layers_a": layers_a if layers_a is not None else "",
                    "marker_name": marker_name if marker_name is not None else "",  # Ensure empty if no value
                    "allowance": extra if extra is not None else 0,
                    "cons_planned": cons_planned if cons_planned is not None else "",
                    "cons_actual": cons_actual if cons_actual is not None else "",
                    "cons_real": cons_real if cons_real is not None else "",

                    "table_id": mattress.table_id,
                    "row_id": mattress.row_id,
                    "sequence_number": mattress.sequence_number
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
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
                    print(f"⚠️ Deadlock detected, retrying delete for {mattress_name} (attempt {attempt + 1})...")
                    time.sleep(retry_delay)
                    continue

                print(f"❌ Error deleting mattress {mattress_name}: {e}")
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

            day_filter = request.args.get('day', None)

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
                Mattresses.created_at,
                MattressMarker.marker_name,
                MattressMarker.marker_length,
                MattressMarker.marker_width,
                MattressDetail.layers,
                MattressDetail.cons_planned,
                MattressDetail.length_mattress,
                CollarettoDetail.usable_width,
                # Adding left join on mattress_kanban
                db.func.coalesce(MattressKanban.day, 'Not Assigned').label('day'),
                db.func.coalesce(MattressKanban.shift, 'Not Assigned').label('shift'),
                db.func.coalesce(MattressKanban.position, 0).label('position')
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
             .outerjoin(MattressMarker, MattressPhase.mattress_id == MattressMarker.mattress_id) \
             .join(MattressDetail, MattressPhase.mattress_id == MattressDetail.mattress_id) \
             .outerjoin(MattressKanban, MattressPhase.mattress_id == MattressKanban.mattress_id) \
             .outerjoin(CollarettoDetail, MattressPhase.mattress_id == CollarettoDetail.mattress_id) \
             .filter(MattressPhase.active == True) \
             .filter(MattressPhase.status.in_(["0 - NOT SET", "1 - TO LOAD", "2 - ON SPREAD", "3 - TO CUT", "4 - ON CUT"]))

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
                    "marker_length": row.marker_length or row.length_mattress,
                    "width": row.marker_width or row.usable_width,
                    "layers": row.layers,
                    "consumption": row.cons_planned,
                    "sizes": "; ".join(size_dict.get(row.mattress_id, [])),
                    "total_pcs": total_pcs,
                    "created_at": row.created_at.strftime('%Y-%m-%d %H:%M:%S'),
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
        day = data.get('day', 'today')
        shift = data.get('shift', '1shift')
        operator = data.get('operator', 'Unknown')

        if not new_device:
            return {"success": False, "message": "Device is required"}, 400

        try:
            # Get all mattress phases
            all_phases = db.session.query(MattressPhase).filter_by(mattress_id=mattress_id).all()
            if not all_phases:
                return {"success": False, "message": "Mattress phases not found"}, 404

            # Deactivate current active phases
            for phase in all_phases:
                if phase.active:
                    phase.active = False

            if new_device == "SP0":
                # ✅ Activate "0 - NOT SET"
                not_set = next((p for p in all_phases if p.status == "0 - NOT SET"), None)
                if not_set:
                    not_set.active = True
                    not_set.device = "SP0"
                    if operator:
                        not_set.operator = operator

                # ❌ Remove Kanban entry
                kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if kanban:
                    db.session.delete(kanban)

            else:
                # ✅ Activate "1 - TO LOAD"
                to_load = next((p for p in all_phases if p.status == "1 - TO LOAD"), None)
                if to_load:
                    to_load.active = True
                    to_load.device = new_device
                    if operator:
                        to_load.operator = operator

                # 🔁 Insert or update Kanban
                kanban = db.session.query(MattressKanban).filter_by(mattress_id=mattress_id).first()
                if not kanban:
                    max_pos = db.session.query(db.func.max(MattressKanban.position)).filter_by(day=day, shift=shift).scalar() or 0
                    kanban = MattressKanban(
                        mattress_id=mattress_id,
                        day=day,
                        shift=shift,
                        position=max_pos + 1
                    )
                    db.session.add(kanban)
                else:
                    kanban.day = day
                    kanban.shift = shift

            db.session.commit()
            return {"success": True, "message": "Phase, device, kanban, and operator updated"}, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@mattress_api.route('/update_position/<int:mattress_id>', methods=['PUT'])
class UpdateKanbanPositionResource(Resource):
    def put(self, mattress_id):
        data = request.get_json()
        new_position = data.get('position')
        day = data.get('day')
        shift = data.get('shift')

        if new_position is None or not day or not shift:
            return {"success": False, "message": "Missing parameters (position, day, shift)"}, 400

        try:
            # Get all entries for the same day and shift, excluding the one being moved
            kanban_entries = db.session.query(MattressKanban).filter(
                MattressKanban.day == day,
                MattressKanban.shift == shift,
                MattressKanban.mattress_id != mattress_id
            ).order_by(MattressKanban.position).all()

            # Insert the mattress at the correct position
            new_entries = kanban_entries[:new_position] + [mattress_id] + kanban_entries[new_position:]

            for idx, entry in enumerate(new_entries):
                if isinstance(entry, int):
                    # Update the moved mattress
                    target = db.session.query(MattressKanban).filter_by(mattress_id=entry).first()
                    if target:
                        target.position = idx
                else:
                    entry.position = idx

            db.session.commit()
            return {"success": True, "message": "Position updated"}, 200

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

@mattress_api.route('/update_status/<int:mattress_id>', methods=['PUT'])
class UpdateMattressStatusResource(Resource):
    """Update the status of a mattress"""

    @mattress_api.doc(params={'mattress_id': 'ID of the mattress to update'})
    def put(self, mattress_id):
        """Update the status of a mattress to a new value"""
        data = request.get_json()
        new_status = data.get('status')
        operator = data.get('operator', 'Unknown')
        device = data.get('device')  # Get device from request

        if not new_status:
            return {"success": False, "message": "Status is required"}, 400

        try:
            # Get all mattress phases
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

            db.session.commit()
            return {"success": True, "message": f"Status updated to '{new_status}'"}, 200

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