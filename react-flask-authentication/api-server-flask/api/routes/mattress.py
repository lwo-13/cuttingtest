from flask import Blueprint, request, jsonify
from api.models import Mattresses, db, MattressPhase
from flask_restx import Namespace, Resource

mattress_bp = Blueprint('mattress_bp', __name__)
mattress_api = Namespace('mattress', description="Mattress Management")


@mattress_api.route('/add_mattress_row')
class MattressResource(Resource):
    def post(self):
        try:
            data = request.get_json()

            # ✅ Validate required fields
            required_fields = ["mattress", "order_commessa", "fabric_type", "fabric_code", "fabric_color", 
                               "dye_lot", "item_type", "spreading_method"]
            for field in required_fields:
                if field not in data or not data[field]:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400

            # ✅ Check if the mattress already exists
            existing_mattress = Mattresses.query.filter_by(mattress=data["mattress"]).first()

            if existing_mattress:
                print(f"🔄 Updating existing mattress: {data['mattress']}")

                # ✅ Update existing mattress instead of inserting a new one
                existing_mattress.order_commessa = data["order_commessa"]
                existing_mattress.fabric_type = data["fabric_type"]
                existing_mattress.fabric_code = data["fabric_code"]
                existing_mattress.fabric_color = data["fabric_color"]
                existing_mattress.dye_lot = data["dye_lot"]
                existing_mattress.item_type = data["item_type"]
                existing_mattress.spreading_method = data["spreading_method"]

                db.session.commit()

                return {"success": True, "message": "Mattress updated successfully", "data": existing_mattress.to_dict()}, 200

            # ✅ Insert a new mattress only if it does not exist
            print(f"➕ Inserting new mattress: {data['mattress']}")
            new_mattress = Mattresses(**data)
            db.session.add(new_mattress)
            db.session.commit()

            # ✅ Add status phases: NOT SET (Active), PLANNED (Inactive), COMPLETED (Inactive)
            phases = [
                MattressPhase(mattress_id=new_mattress.id, status="0 - NOT SET", active=True),
                MattressPhase(mattress_id=new_mattress.id, status="1 - TO LOAD", active=False),
                MattressPhase(mattress_id=new_mattress.id, status="2 - COMPLETED", active=False),
            ]

            print(phases)
            db.session.add_all(phases)
            db.session.commit()

            return {
                "success": True,
                "message": "Mattress added successfully with phases",
                "data": new_mattress.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()  # ✅ Rollback transaction on error
            print(f"❌ Exception: {str(e)}")
            return {"success": False, "message": str(e)}, 500


@ mattress_api.route('/get_by_order/<string:order_commessa>')
class MattressByOrder(Resource):
    def get(self, order_commessa):
        try:
            print(f"🔍 Fetching mattresses for order: {order_commessa}")
            mattresses = Mattresses.query.filter(Mattresses.order_commessa == order_commessa).all()

            if not mattresses:
                print("⚠️ No mattresses found in database")
                return {"success": True, "data": []}, 200  # ✅ Return empty list instead of 404

            print(f"✅ Found {len(mattresses)} mattresses in database")
            return {"success": True, "data": [m.to_dict() for m in mattresses]}, 200

        except Exception as e:
            print(f"❌ Error fetching mattresses: {str(e)}")
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

