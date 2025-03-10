from flask import Blueprint, request, jsonify
from api.models import Mattresses, db, MattressPhase, MattressDetail, MattressMarker, MarkerHeader
from flask_restx import Namespace, Resource

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
                    MattressPhase(mattress_id=mattress_id, status="0 - NOT SET", active=True),
                    MattressPhase(mattress_id=mattress_id, status="1 - TO LOAD", active=False),
                    MattressPhase(mattress_id=mattress_id, status="2 - COMPLETED", active=False),
                ]
                db.session.add_all(phases)

                db.session.commit()
                print(f"✅ Mattress Added (ID: {mattress_id})")

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
                MattressDetail.layers  # Fetch only the `layers` column
            ).outerjoin(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).filter(
                Mattresses.order_commessa == order_commessa
            ).all()

            if not mattresses:
                return {"success": False, "message": "No mattresses found for this order"}, 404

            result = []
            for mattress, layers in mattresses:
                result.append({
                    "mattress": mattress.mattress,
                    "fabric_type": mattress.fabric_type,
                    "fabric_code": mattress.fabric_code,
                    "fabric_color": mattress.fabric_color,
                    "dye_lot": mattress.dye_lot,
                    "item_type": mattress.item_type,
                    "spreading_method": mattress.spreading_method,
                    "layers": layers  # Include `layers` from `mattress_details`
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
        """Fetch only active PHASE first, then filter 'TO LOAD' status."""
        try:
            query = db.session.query(
                MattressPhase.mattress_id,
                MattressPhase.status,
                MattressPhase.device,
                MattressPhase.operator,
                Mattresses.mattress,
                Mattresses.order_commessa,
                Mattresses.fabric_type
            ).join(Mattresses, MattressPhase.mattress_id == Mattresses.id) \
            .filter(MattressPhase.active == True) \
            .filter(MattressPhase.status.in_(["TO LOAD"])) \
            .all()

            result = [
                {
                    "id": row.mattress_id,
                    "mattress": row.mattress,
                    "status": row.status,
                    "device": row.device if row.device else "SP0",  # Default to SP0 if device is missing
                    "operator": row.operator,
                    "order_commessa": row.order_commessa,
                    "fabric_type": row.fabric_type,
                }
                for row in query
            ]

            return {"success": True, "data": result}, 200
        except Exception as e:
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