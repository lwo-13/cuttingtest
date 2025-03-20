from flask import Blueprint, request, jsonify
from api.models import db, Collaretto, CollarettoDetail, Mattresses
from flask_restx import Namespace, Resource
from datetime import datetime

collaretto_bp = Blueprint('collaretto_bp', __name__)
collaretto_api = Namespace('collaretto', description="Collaretto Management")

@collaretto_api.route('/add_along_row')
class CollarettoAlong(Resource):
    def post(self):
        data = request.get_json()
        try:
            # ✅ Extract Collaretto level data
            collaretto_name = data.get('collaretto')

            # ✅ Check if collaretto exists
            existing_collaretto = Collaretto.query.filter_by(collaretto=collaretto_name).first()

            if existing_collaretto:
                print(f"🔄 Updating existing collaretto: {collaretto_name}")
                existing_collaretto.order_commessa = data.get('order_commessa')
                existing_collaretto.fabric_type = data.get('fabric_type')
                existing_collaretto.fabric_code = data.get('fabric_code')
                existing_collaretto.fabric_color = data.get('fabric_color')
                existing_collaretto.dye_lot = data.get('dye_lot')
                existing_collaretto.item_type = data.get('item_type')
                existing_collaretto.updated_at = datetime.now()
                db.session.flush()
            else:
                print(f"➕ Creating new collaretto: {collaretto_name}")
                existing_collaretto = Collaretto(
                    collaretto=collaretto_name,
                    order_commessa=data.get('order_commessa'),
                    fabric_type=data.get('fabric_type'),
                    fabric_code=data.get('fabric_code'),
                    fabric_color=data.get('fabric_color'),
                    dye_lot=data.get('dye_lot'),
                    item_type=data.get('item_type'),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(existing_collaretto)
                db.session.flush()

            # ✅ Process the detail (only 1 per collaretto)
            detail_data = data.get('details', [])[0]  # Since it's always one
            existing_detail = CollarettoDetail.query.filter_by(collaretto_id=existing_collaretto.id).first()

            if existing_detail:
                print(f"🔄 Updating existing collaretto detail for {collaretto_name}")
                existing_detail.mattress_id = detail_data.get('mattress_id')
                existing_detail.pieces = detail_data.get('pieces')
                existing_detail.usable_width = detail_data.get('usable_width')
                existing_detail.roll_width = detail_data.get('roll_width')
                existing_detail.gross_length = detail_data.get('gross_length')
                existing_detail.scrap_rolls = detail_data.get('scrap_rolls')
                existing_detail.rolls_planned = detail_data.get('rolls_planned')
                existing_detail.rolls_actual = detail_data.get('rolls_actual')
                existing_detail.cons_planned = detail_data.get('cons_planned')
                existing_detail.cons_actual = detail_data.get('cons_actual')
                existing_detail.extra = detail_data.get('extra')
                existing_detail.total_collaretto = detail_data.get('total_collaretto')
                existing_detail.updated_at = datetime.now()
            else:
                print(f"➕ Inserting new collaretto detail for {collaretto_name}")
                detail_row = CollarettoDetail(
                    collaretto_id=existing_collaretto.id,
                    mattress_id=detail_data.get('mattress_id'),
                    pieces=detail_data.get('pieces'),
                    usable_width=detail_data.get('usable_width'),
                    roll_width=detail_data.get('roll_width'),
                    gross_length=detail_data.get('gross_length'),
                    scrap_rolls=detail_data.get('scrap_rolls'),
                    rolls_planned=detail_data.get('rolls_planned'),
                    rolls_actual=detail_data.get('rolls_actual'),
                    cons_planned=detail_data.get('cons_planned'),
                    cons_actual=detail_data.get('cons_actual'),
                    extra=detail_data.get('extra'),
                    total_collaretto=detail_data.get('total_collaretto'),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(detail_row)

            db.session.commit()

            return jsonify({"success": True, "message": f"Along Row {collaretto_name} saved successfully."})

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {str(e)}")
            return jsonify({"success": False, "message": "Failed to save along row.", "error": str(e)})
        
@collaretto_api.route('/delete/<string:collaretto_name>')
class DeleteCollaretto(Resource):
    def delete(self, collaretto_name):
        try:
            # ✅ Find the collaretto
            collaretto = Collaretto.query.filter_by(collaretto=collaretto_name).first()

            if not collaretto:
                print(f"⚠️ Collaretto {collaretto_name} not found")
                return jsonify({"success": False, "message": f"Collaretto {collaretto_name} not found."})

            # ✅ Delete the collaretto (details get deleted automatically with CASCADE)
            db.session.delete(collaretto)
            db.session.commit()

            print(f"🗑️ Deleted Collaretto: {collaretto_name}")
            return jsonify({"success": True, "message": f"Collaretto {collaretto_name} deleted successfully."})

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error deleting collaretto: {str(e)}")
            return jsonify({"success": False, "message": "Failed to delete collaretto.", "error": str(e)})
        
@collaretto_api.route('/get_by_order/<string:order_commessa>')
class GetCollarettoByOrder(Resource):
    def get(self, order_commessa):
        try:
            # ✅ Fetch collaretto rows linked to this order
            collaretto_rows = Collaretto.query.filter_by(order_commessa=order_commessa).all()

            if not collaretto_rows:
                return jsonify({"success": True, "data": []})  # ✅ No collaretto, still return success

            response_data = []
            for collaretto in collaretto_rows:
                # ✅ Find the detail row linked to this collaretto
                detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()

                if not detail:
                    continue  # Skip collaretto if no details found

                response_data.append({
                    "collaretto": collaretto.collaretto,
                    "fabric_type": collaretto.fabric_type,
                    "fabric_code": collaretto.fabric_code,
                    "fabric_color": collaretto.fabric_color,
                    "dye_lot": collaretto.dye_lot,
                    "details": {
                        "pieces": detail.pieces,
                        "usable_width": detail.usable_width,
                        "gross_length": detail.gross_length,
                        "roll_width": detail.roll_width,
                        "scrap_rolls": detail.scrap_rolls,
                        "rolls_planned": detail.rolls_planned,
                        "total_collaretto": detail.total_collaretto,
                        "cons_planned": detail.cons_planned,
                        "extra": detail.extra  # ✅ Moved inside details
                    }
                })

            return jsonify({"success": True, "data": response_data})

        except Exception as e:
            print(f"❌ Error fetching collaretto by order: {str(e)}")
            return jsonify({"success": False, "message": "Failed to fetch collaretto data.", "error": str(e)})

@collaretto_api.route('/add_weft_row', methods=['POST'])
class CollarettoWeft(Resource):
    def post(self):
        data = request.get_json()

        collaretto_name = data.get('collaretto')
        mattress_name = data.get('mattress')
        order_commessa = data.get('order_commessa')
        fabric_type = data.get('fabric_type')
        fabric_code = data.get('fabric_code')
        fabric_color = data.get('fabric_color')
        dye_lot = data.get('dye_lot')
        item_type = data.get('item_type')
        details = data.get('details', [])
            
        try:
            # ✅ Check if mattress already exists
            existing_mattress = Mattresses.query.filter_by(mattress=mattress_name).first()
            if existing_mattress:
                print(f"🔄 Updating existing mattress: {mattress_name}")
                existing_mattress.order_commessa = order_commessa
                existing_mattress.fabric_type = fabric_type
                existing_mattress.fabric_code = fabric_code
                existing_mattress.fabric_color = fabric_color
                existing_mattress.dye_lot = dye_lot
                existing_mattress.item_type = 'PLOCE'
                existing_mattress.updated_at = datetime.now()
                db.session.flush()
            else:
                print(f"➕ Creating new mattress: {mattress_name}")
                existing_mattress = Mattresses(
                    mattress=mattress_name,
                    order_commessa=order_commessa,
                    fabric_type=fabric_type,
                    fabric_code=fabric_code,
                    fabric_color=fabric_color,
                    dye_lot=dye_lot,
                    item_type='PLOCE',
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(existing_mattress)
                db.session.flush()  # ✅ Get mattress.id

            # ✅ Check if collaretto exists
            existing_collaretto = Collaretto.query.filter_by(collaretto=collaretto_name).first()
            if existing_collaretto:
                print(f"🔄 Updating existing collaretto: {collaretto_name}")
                existing_collaretto.order_commessa = order_commessa
                existing_collaretto.fabric_type = fabric_type
                existing_collaretto.fabric_code = fabric_code
                existing_collaretto.fabric_color = fabric_color
                existing_collaretto.dye_lot = dye_lot
                existing_collaretto.item_type = item_type
                existing_collaretto.updated_at = datetime.now()
                db.session.flush()
            else:
                print(f"➕ Creating new collaretto: {collaretto_name}")
                existing_collaretto = Collaretto(
                    collaretto=collaretto_name,
                    order_commessa=order_commessa,
                    fabric_type=fabric_type,
                    fabric_code=fabric_code,
                    fabric_color=fabric_color,
                    dye_lot=dye_lot,
                    item_type=item_type,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(existing_collaretto)
                db.session.flush()  # ✅ Get collaretto.id
            
# ✅ CREATE MATTRESS_DETAILS
# ✅ CREATE MATTRESS_PHASES

            # ✅ Process the details and link mattress_id TAKE INTO CONISDERATION IF DETIASL EXIST OR NOT
            for detail in details:
                new_detail = CollarettoDetail(
                    collaretto_id=existing_collaretto.id,
                    mattress_id=existing_mattress.id,  # ✅ Store mattress_id
                    pieces=detail.get('pieces'),
                    usable_width=detail.get('usable_width'),
                    gross_length=detail.get('gross_length'),
                    panel_length=detail.get('panel_length'),
                    roll_width=detail.get('roll_width'),
                    scrap_rolls=detail.get('scrap_rolls'),
                    rolls_planned=detail.get('rolls_planned'),
                    rolls_actual=detail.get('rolls_actual'),
                    panels_planned=detail.get('panels_planned'),
                    cons_planned=detail.get('cons_planned'),
                    cons_actual=detail.get('cons_actual'),
                    extra=detail.get('extra'),
                )
                db.session.add(new_detail)

            db.session.commit()
            return jsonify({"success": True, "message": "Collaretto Weft Row saved successfully"})

        except Exception as e:
            db.session.rollback()
            print("❌ Error saving collaretto weft row:", e)
            return jsonify({"success": False, "message": str(e)})

