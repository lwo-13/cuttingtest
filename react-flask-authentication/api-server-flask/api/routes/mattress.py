from flask import Blueprint, request, jsonify
from api.models import Mattresses, db
from flask_restx import Namespace, Resource

mattress_bp = Blueprint('mattress_bp', __name__)
mattress_api = Namespace('mattress', description="Mattress Management")


@ mattress_api.route('/add_mattress_row')
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

            # ✅ Create a new mattress instance
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

            # ✅ Save to database
            db.session.add(new_mattress)
            db.session.commit()

            return {"success": True, "message": "Mattress added successfully", "data": new_mattress.to_dict()}, 201

        except Exception as e:
            return {"success": False, "message": str(e)}, 500
