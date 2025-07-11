from flask import Blueprint, request, jsonify
from api.models import db, Collaretto, CollarettoDetail, Mattresses, MattressDetail, MattressPhase, OrderLinesView
from flask_restx import Namespace, Resource
from datetime import datetime
import math
import time
from sqlalchemy.exc import OperationalError

collaretto_bp = Blueprint('collaretto_bp', __name__)
collaretto_api = Namespace('collaretto', description="Collaretto Management")

def validate_applicable_sizes(applicable_sizes, order_commessa):
    """
    Validate that the applicable_sizes string contains only valid sizes for the given order.

    Args:
        applicable_sizes (str): Dash-separated sizes like "S-M-L" or None/empty for ALL
        order_commessa (str): Order number to validate against

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not applicable_sizes or applicable_sizes.strip() == '':
        return True, None  # Empty means ALL, which is always valid

    try:
        # Get valid sizes for this order
        order_sizes = db.session.query(OrderLinesView.size)\
            .filter_by(order_commessa=order_commessa)\
            .distinct().all()

        valid_sizes = {size[0] for size in order_sizes if size[0]}

        if not valid_sizes:
            return False, f"No sizes found for order {order_commessa}"

        # Parse the applicable_sizes string
        requested_sizes = set(size.strip() for size in applicable_sizes.split('-') if size.strip())

        # Check if all requested sizes are valid
        invalid_sizes = requested_sizes - valid_sizes
        if invalid_sizes:
            return False, f"Invalid sizes for order {order_commessa}: {', '.join(invalid_sizes)}. Valid sizes: {', '.join(sorted(valid_sizes))}"

        return True, None

    except Exception as e:
        return False, f"Error validating sizes: {str(e)}"

def retry_on_deadlock(func, max_retries=3, delay=1):
    """Retry function on deadlock errors"""
    for attempt in range(max_retries):
        try:
            return func()
        except OperationalError as e:
            # Check if it's a deadlock error (SQL Server error 1205)
            if '1205' in str(e) or 'deadlock' in str(e).lower():
                if attempt < max_retries - 1:
                    print(f"Deadlock detected, retrying in {delay * (attempt + 1)} seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay * (attempt + 1))  # Exponential backoff
                    continue
                else:
                    raise Exception(f"Operation failed after {max_retries} attempts due to deadlock")
            else:
                raise
        except Exception as e:
            raise
    return None

@collaretto_api.route('/add_along_row')
class CollarettoAlong(Resource):
    def post(self):
        data = request.get_json()
        try:
            # ✅ Extract Collaretto level data
            collaretto_name = data.get('collaretto')
            row_id = data.get('row_id')
            applicable_sizes = data.get('applicable_sizes')  # Get applicable_sizes from frontend

            # Validate applicable_sizes if provided
            if applicable_sizes and applicable_sizes != 'ALL':
                is_valid, error_msg = validate_applicable_sizes(applicable_sizes, data.get('order_commessa'))
                if not is_valid:
                    return jsonify({"success": False, "message": error_msg})

            # ✅ Check if collaretto exists
            existing_collaretto = Collaretto.query.filter_by(row_id=row_id).first()

            if existing_collaretto:
                print(f"🔄 Updating existing collaretto: {collaretto_name}")
                existing_collaretto.order_commessa = data.get('order_commessa')
                existing_collaretto.fabric_type = data.get('fabric_type')
                existing_collaretto.fabric_code = data.get('fabric_code')
                existing_collaretto.fabric_color = data.get('fabric_color')
                existing_collaretto.dye_lot = data.get('dye_lot')
                existing_collaretto.item_type = data.get('item_type')
                existing_collaretto.updated_at = datetime.now()
                existing_collaretto.table_id = data.get('table_id')
                existing_collaretto.row_id = data.get('row_id')
                existing_collaretto.sequence_number = data.get('sequence_number')
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
                    table_id=data.get('table_id'),
                    row_id=data.get('row_id'),
                    sequence_number=data.get('sequence_number'),
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
                existing_detail.applicable_sizes = applicable_sizes if applicable_sizes != 'ALL' else None
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
                    applicable_sizes=applicable_sizes if applicable_sizes != 'ALL' else None,
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
            collaretto_rows = Collaretto.query.filter_by(order_commessa=order_commessa, item_type='CA').all()

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
                    "table_id": collaretto.table_id,
                    "row_id": collaretto.row_id,
                    "sequence_number": collaretto.sequence_number,
                    "details": {
                        "pieces": detail.pieces,
                        "usable_width": detail.usable_width,
                        "gross_length": detail.gross_length,
                        "roll_width": detail.roll_width,
                        "scrap_rolls": detail.scrap_rolls,
                        "rolls_planned": detail.rolls_planned,
                        "total_collaretto": detail.total_collaretto,
                        "cons_planned": detail.cons_planned,
                        "extra": detail.extra,  # ✅ Moved inside details
                        "applicable_sizes": detail.applicable_sizes  # ✅ Return applicable_sizes
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
        spreading = data.get('spreading', 'AUTOMATIC')  # Get spreading info from frontend

        table_id = data.get('table_id')
        row_id = data.get('row_id')
        sequence_number = data.get('sequence_number')

        details = data.get('details', [])
        applicable_sizes = data.get('applicable_sizes')  # Get applicable_sizes from frontend

        try:
            # Validate applicable_sizes if provided
            if applicable_sizes and applicable_sizes != 'ALL':
                is_valid, error_msg = validate_applicable_sizes(applicable_sizes, order_commessa)
                if not is_valid:
                    return jsonify({"success": False, "message": error_msg})
            new_mattress_created = False
            # ✅ Determine item_type based on spreading
            mattress_item_type = 'MSW' if spreading == 'MANUAL' else 'ASW'

            # ✅ Check if mattress already exists
            existing_mattress = Mattresses.query.filter_by(row_id=row_id).first()
            if existing_mattress:
                print(f"🔄 Updating existing mattress: {mattress_name}")
                existing_mattress.mattress = mattress_name  # ✅ Update mattress name
                existing_mattress.order_commessa = order_commessa
                existing_mattress.fabric_type = fabric_type
                existing_mattress.fabric_code = fabric_code
                existing_mattress.fabric_color = fabric_color
                existing_mattress.dye_lot = dye_lot
                existing_mattress.item_type = mattress_item_type  # ✅ Use dynamic item_type
                existing_mattress.spreading_method='FACE UP'
                existing_mattress.table_id=table_id
                existing_mattress.row_id=row_id
                existing_mattress.sequence_number=sequence_number
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
                    item_type=mattress_item_type,  # ✅ Use dynamic item_type
                    spreading_method='FACE UP',
                    table_id=table_id,
                    row_id=row_id,
                    sequence_number=sequence_number,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(existing_mattress)
                db.session.flush()
                new_mattress_created = True
            
            # ✅ If new mattress, insert default MattressPhases
            if new_mattress_created:
                print(f"➕ Inserting default MattressPhases for mattress_id {existing_mattress.id}")
                phases = [
                    MattressPhase(mattress_id=existing_mattress.id, status="0 - NOT SET", active=True, operator=data.get("operator"), created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="1 - TO LOAD", active=False, created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="2 - ON SPREAD", active=False, created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="5 - COMPLETED", active=False, created_at=datetime.now(), updated_at=datetime.now())
                ]
                db.session.add_all(phases)

            # ✅ Loop through details - update or insert MattressDetail
            for detail in details:
                existing_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()

                if existing_detail:
                    print(f"🔄 Updating existing mattress_detail for mattress_id {existing_mattress.id}")
                    existing_detail.layers = detail.get('panels_planned') or 0
                    existing_detail.length_mattress = detail.get('rewound_width') or 0
                    existing_detail.cons_planned = detail.get('cons_planned') or 0
                    existing_detail.extra = 0
                    existing_detail.updated_at = datetime.now()
                    db.session.flush()
                else:
                    print(f"➕ Creating new mattress_detail for mattress_id {existing_mattress.id}")
                    new_detail = MattressDetail(
                        mattress_id=existing_mattress.id,
                        layers=detail.get('panels_planned') or 0,
                        length_mattress=detail.get('rewound_width') or 0,
                        cons_planned=detail.get('cons_planned') or 0,
                        extra=0,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.session.add(new_detail)

            # ✅ Check if collaretto exists
            existing_collaretto = Collaretto.query.filter_by(row_id=data.get('row_id')).first()
            if existing_collaretto:
                print(f"🔄 Updating existing collaretto: {collaretto_name}")
                existing_collaretto.order_commessa = order_commessa
                existing_collaretto.fabric_type = fabric_type
                existing_collaretto.fabric_code = fabric_code
                existing_collaretto.fabric_color = fabric_color
                existing_collaretto.dye_lot = dye_lot
                existing_collaretto.item_type = item_type
                existing_collaretto.updated_at = datetime.now()
                existing_collaretto.table_id = table_id
                existing_collaretto.row_id = row_id
                existing_collaretto.sequence_number = sequence_number
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
                    updated_at=datetime.now(),
                    table_id = table_id,
                    row_id = row_id,
                    sequence_number = sequence_number
                )
                db.session.add(existing_collaretto)
                db.session.flush()  # ✅ Get collaretto.id

            for detail in details:
                existing_collaretto_detail = CollarettoDetail.query.filter_by(
                    collaretto_id=existing_collaretto.id,
                    mattress_id=existing_mattress.id
                ).first()

                if existing_collaretto_detail:
                    print(f"🔄 Updating existing collaretto_detail for collaretto_id {existing_collaretto.id}")
                    existing_collaretto_detail.pieces = detail.get('pieces')
                    existing_collaretto_detail.usable_width = detail.get('usable_width')
                    existing_collaretto_detail.gross_length = detail.get('gross_length')
                    existing_collaretto_detail.pcs_seam = int(detail.get('pcs_seam')) if detail.get('pcs_seam') is not None else None
                    existing_collaretto_detail.roll_width = detail.get('roll_width')
                    existing_collaretto_detail.scrap_rolls = detail.get('scrap_rolls')
                    existing_collaretto_detail.rolls_planned = detail.get('rolls_planned')
                    existing_collaretto_detail.cons_planned = detail.get('cons_planned')
                    existing_collaretto_detail.extra = detail.get('extra')
                    existing_collaretto_detail.applicable_sizes = applicable_sizes if applicable_sizes != 'ALL' else None
                    existing_collaretto_detail.updated_at = datetime.now()
                    db.session.flush()

                    # Update bagno_ready in the connected mattress_details
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                    if mattress_detail:
                        mattress_detail.bagno_ready = detail.get('bagno_ready', False)
                        mattress_detail.updated_at = datetime.now()
                else:
                    print(f"➕ Inserting new collaretto_detail for collaretto_id {existing_collaretto.id}")
                    new_detail = CollarettoDetail(
                        collaretto_id=existing_collaretto.id,
                        mattress_id=existing_mattress.id,  # ✅ Store mattress_id
                        pieces=detail.get('pieces'),
                        usable_width=detail.get('usable_width'),
                        gross_length=detail.get('gross_length'),
                        pcs_seam=detail.get('pcs_seam'),
                        roll_width=detail.get('roll_width'),
                        scrap_rolls=detail.get('scrap_rolls'),
                        rolls_planned=detail.get('rolls_planned'),
                        cons_planned=detail.get('cons_planned'),
                        extra=detail.get('extra'),
                        applicable_sizes=applicable_sizes if applicable_sizes != 'ALL' else None,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.session.add(new_detail)

                    # Update bagno_ready in the connected mattress_details
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                    if mattress_detail:
                        mattress_detail.bagno_ready = detail.get('bagno_ready', False)
                        mattress_detail.updated_at = datetime.now()

            db.session.commit()
            return jsonify({"success": True, "message": "Collaretto Weft Row saved successfully"})

        except Exception as e:
            db.session.rollback()
            print("❌ Error saving collaretto weft row:", e)
            return jsonify({"success": False, "message": str(e)})

@collaretto_api.route('/delete_weft_bias/<string:collaretto_name>', methods=['DELETE'])
class DeleteWeft(Resource):
    def delete(self, collaretto_name):
        def delete_operation():
            # ✅ Check if the collaretto exists
            collaretto = Collaretto.query.filter_by(collaretto=collaretto_name).first()
            if not collaretto:
                return {"success": False, "message": "Weft not found"}

            print(f"🔎 Found weft: {collaretto_name}, deleting attached mattress...")

            # ✅ Fetch ONE mattress_id from collaretto_details
            detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()
            if detail and detail.mattress_id:
                mattress = Mattresses.query.get(detail.mattress_id)
                if mattress:
                    print(f"🗑️ Deleting mattress: {mattress.mattress}")
                    db.session.delete(mattress)  # ✅ CASCADE takes care of MattressDetails and Phases

            # ✅ Delete the collaretto itself (cascade handles collaretto_details)
            db.session.delete(collaretto)

            db.session.commit()
            return {"success": True, "message": f"{collaretto_name} and linked mattress deleted successfully"}

        try:
            # Execute delete with deadlock retry
            result = retry_on_deadlock(delete_operation, max_retries=5, delay=0.5)
            return jsonify(result)

        except Exception as e:
            db.session.rollback()
            error_msg = str(e)
            print(f"❌ Error deleting weft {collaretto_name}: {error_msg}")

            # Check if it's a deadlock error and provide user-friendly message
            if '1205' in error_msg or 'deadlock' in error_msg.lower():
                return jsonify({"success": False, "message": "Database is busy, please try again in a moment."})
            else:
                return jsonify({"success": False, "message": error_msg})
        
@collaretto_api.route('/get_weft_by_order/<order_id>', methods=['GET'])
class GetWeftByOrder(Resource):
    def get(self, order_id):
        try:
            # ✅ Fetch all Collaretto Weft rows (item_type = 'CW') for the order
            wefts = Collaretto.query.filter_by(order_commessa=order_id, item_type='CW').all()

            if not wefts:
                return jsonify({"success": False, "message": "No Collaretto Weft found for this order", "data": []})

            result = []
            for weft in wefts:
                # ✅ Get the first collaretto_detail linked to this weft
                detail = CollarettoDetail.query.filter_by(collaretto_id=weft.id).first()
                if not detail:
                    continue  # Skip if no detail exists

                # ✅ Fetch mattress_id from collaretto_detail
                mattress_id = detail.mattress_id

                # ✅ Fetch the corresponding MattressDetail (rewound_width, panels_planned, and bagno_ready are here)
                mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()

                # ✅ Fetch the corresponding Mattress to get item_type for spreading determination
                mattress = Mattresses.query.filter_by(id=mattress_id).first()

                # ✅ Fetch phase_status from active MattressPhase
                phase_status = None
                if mattress_id:
                    active_phase = MattressPhase.query.filter_by(mattress_id=mattress_id, active=True).first()
                    if active_phase:
                        phase_status = active_phase.status

                # ✅ Determine spreading from mattress item_type
                spreading = "MANUAL" if mattress and mattress.item_type == "MSW" else "AUTOMATIC"

                result.append({
                    "collaretto": weft.collaretto,
                    "fabric_type": weft.fabric_type,
                    "fabric_code": weft.fabric_code,
                    "fabric_color": weft.fabric_color,
                    "dye_lot": weft.dye_lot,
                    "table_id": weft.table_id,
                    "row_id": weft.row_id,
                    "sequence_number": weft.sequence_number,
                    "phase_status": phase_status,
                    "spreading": spreading,  # ✅ Add spreading information
                    "details": {
                        "pieces": detail.pieces,
                        "usable_width": detail.usable_width,
                        "gross_length": detail.gross_length,
                        "pcs_seam": detail.pcs_seam,
                        "roll_width": detail.roll_width,
                        "scrap_rolls": detail.scrap_rolls,
                        "rolls_planned": detail.rolls_planned,
                        "cons_planned": detail.cons_planned,
                        "extra": detail.extra,
                        "applicable_sizes": detail.applicable_sizes,  # ✅ Return applicable_sizes
                        "bagno_ready": mattress_detail.bagno_ready if mattress_detail else False,
                        # ✅ Pull these from MattressDetail
                        "rewound_width": mattress_detail.length_mattress if mattress_detail else None,
                        "panels_planned": mattress_detail.layers if mattress_detail else None
                    }
                })

            return jsonify({"success": True, "data": result})

        except Exception as e:
            print(f"❌ Error fetching weft by order: {e}")
            return jsonify({"success": False, "message": str(e)})
        
@collaretto_api.route('/add_bias_row', methods=['POST'])
class CollarettoBias(Resource):
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

        table_id = data.get('table_id')
        row_id = data.get('row_id')
        sequence_number = data.get('sequence_number')

        details = data.get('details', [])
        applicable_sizes = data.get('applicable_sizes')  # Get applicable_sizes from frontend

        try:
            # Validate applicable_sizes if provided
            if applicable_sizes and applicable_sizes != 'ALL':
                is_valid, error_msg = validate_applicable_sizes(applicable_sizes, order_commessa)
                if not is_valid:
                    return jsonify({"success": False, "message": error_msg})
            new_mattress_created = False

            existing_mattress = Mattresses.query.filter_by(row_id=row_id).first()
            if existing_mattress:
                print(f"🔄 Updating existing mattress: {mattress_name}")
                existing_mattress.order_commessa = order_commessa
                existing_mattress.fabric_type = fabric_type
                existing_mattress.fabric_code = fabric_code
                existing_mattress.fabric_color = fabric_color
                existing_mattress.dye_lot = dye_lot
                existing_mattress.item_type = 'MSB'
                existing_mattress.spreading_method = 'FACE UP'
                existing_mattress.table_id = table_id
                existing_mattress.row_id = row_id
                existing_mattress.sequence_number = sequence_number
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
                    item_type='MSB',
                    spreading_method='FACE UP',
                    table_id=table_id,
                    row_id=row_id,
                    sequence_number=sequence_number,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(existing_mattress)
                db.session.flush()
                new_mattress_created = True

            if new_mattress_created:
                print(f"➕ Inserting default MattressPhases for mattress_id {existing_mattress.id}")
                phases = [
                    MattressPhase(mattress_id=existing_mattress.id, status="0 - NOT SET", active=True, operator=data.get("operator"), created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="1 - TO LOAD", active=False, created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="2 - ON SPREAD", active=False, created_at=datetime.now(), updated_at=datetime.now()),
                    MattressPhase(mattress_id=existing_mattress.id, status="5 - COMPLETED", active=False, created_at=datetime.now(), updated_at=datetime.now())
                ]
                db.session.add_all(phases)

            # Mattress Detail
            for detail in details:
                existing_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()

                if existing_detail:
                    print(f"🔄 Updating existing mattress_detail for mattress_id {existing_mattress.id}")
                    existing_detail.layers = detail.get('panels_planned') or 0
                    existing_detail.length_mattress = detail.get('panel_length') or 0
                    existing_detail.cons_planned = detail.get('cons_planned') or 0
                    existing_detail.extra = 0
                    existing_detail.updated_at = datetime.now()
                    db.session.flush()
                else:
                    print(f"➕ Creating new mattress_detail for mattress_id {existing_mattress.id}")
                    new_detail = MattressDetail(
                        mattress_id=existing_mattress.id,
                        layers=detail.get('panels_planned') or 0,
                        length_mattress=detail.get('panel_length') or 0,
                        cons_planned=detail.get('cons_planned') or 0,
                        extra=0,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.session.add(new_detail)

            # Collaretto CB
            existing_collaretto = Collaretto.query.filter_by(row_id=row_id).first()
            if existing_collaretto:
                print(f"🔄 Updating existing collaretto: {collaretto_name}")
                existing_collaretto.order_commessa = order_commessa
                existing_collaretto.fabric_type = fabric_type
                existing_collaretto.fabric_code = fabric_code
                existing_collaretto.fabric_color = fabric_color
                existing_collaretto.dye_lot = dye_lot
                existing_collaretto.item_type = item_type
                existing_collaretto.updated_at = datetime.now()
                existing_collaretto.table_id = table_id
                existing_collaretto.row_id = row_id
                existing_collaretto.sequence_number = sequence_number
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
                    updated_at=datetime.now(),
                    table_id=table_id,
                    row_id=row_id,
                    sequence_number=sequence_number
                )
                db.session.add(existing_collaretto)
                db.session.flush()

            for detail in details:
                existing_coll_detail = CollarettoDetail.query.filter_by(
                    collaretto_id=existing_collaretto.id,
                    mattress_id=existing_mattress.id
                ).first()

                if existing_coll_detail:
                    print(f"🔄 Updating existing collaretto_detail for collaretto_id {existing_collaretto.id}")
                    existing_coll_detail.pieces = detail.get('pieces')
                    existing_coll_detail.usable_width = detail.get('total_width')  # renamed field
                    existing_coll_detail.gross_length = detail.get('gross_length')
                    existing_coll_detail.pcs_seam = float(detail.get('pcs_seam')) if detail.get('pcs_seam') is not None else None
                    existing_coll_detail.roll_width = detail.get('roll_width')
                    existing_coll_detail.scrap_rolls = detail.get('scrap_rolls')
                    existing_coll_detail.rolls_planned = detail.get('rolls_planned')
                    existing_coll_detail.cons_planned = detail.get('cons_planned')
                    existing_coll_detail.extra = detail.get('extra')
                    existing_coll_detail.applicable_sizes = applicable_sizes if applicable_sizes != 'ALL' else None
                    existing_coll_detail.updated_at = datetime.now()
                    db.session.flush()

                    # Update bagno_ready in the connected mattress_details
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                    if mattress_detail:
                        mattress_detail.bagno_ready = detail.get('bagno_ready', False)
                        mattress_detail.updated_at = datetime.now()
                else:
                    print(f"➕ Inserting new collaretto_detail for collaretto_id {existing_collaretto.id}")
                    new_detail = CollarettoDetail(
                        collaretto_id=existing_collaretto.id,
                        mattress_id=existing_mattress.id,
                        pieces=detail.get('pieces'),
                        usable_width=detail.get('total_width'),
                        gross_length=detail.get('gross_length'),
                        pcs_seam=detail.get('pcs_seam'),
                        roll_width=detail.get('roll_width'),
                        scrap_rolls=detail.get('scrap_rolls'),
                        rolls_planned=detail.get('rolls_planned'),
                        cons_planned=detail.get('cons_planned'),
                        extra=detail.get('extra'),
                        applicable_sizes=applicable_sizes if applicable_sizes != 'ALL' else None,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.session.add(new_detail)

                    # Update bagno_ready in the connected mattress_details
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=existing_mattress.id).first()
                    if mattress_detail:
                        mattress_detail.bagno_ready = detail.get('bagno_ready', False)
                        mattress_detail.updated_at = datetime.now()

            db.session.commit()
            return jsonify({"success": True, "message": "Collaretto Bias Row saved successfully"})

        except Exception as e:
            db.session.rollback()
            print("❌ Error saving collaretto bias row:", e)
            return jsonify({"success": False, "message": str(e)})

@collaretto_api.route('/get_bias_by_order/<order_id>', methods=['GET'])
class GetBiasByOrder(Resource):
    def get(self, order_id):
        try:
            # ✅ Fetch all Collaretto Bias rows (item_type = 'CB') for the order
            biases = Collaretto.query.filter_by(order_commessa=order_id, item_type='CB').all()

            if not biases:
                return jsonify({"success": False, "message": "No Collaretto Bias found for this order", "data": []})

            result = []
            for bias in biases:
                # ✅ Get the first collaretto_detail linked to this bias
                detail = CollarettoDetail.query.filter_by(collaretto_id=bias.id).first()
                if not detail:
                    continue  # Skip if no detail exists

                # ✅ Fetch mattress_id from collaretto_detail
                mattress_id = detail.mattress_id

                # ✅ Fetch the corresponding MattressDetail (rewound_width, panels_planned, and bagno_ready are here)
                mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress_id).first()

                # Now length_mattress directly stores the panel length
                panel_length = mattress_detail.length_mattress if mattress_detail else None

                # ✅ Fetch phase_status from active MattressPhase
                phase_status = None
                if mattress_id:
                    active_phase = MattressPhase.query.filter_by(mattress_id=mattress_id, active=True).first()
                    if active_phase:
                        phase_status = active_phase.status

                result.append({
                    "collaretto": bias.collaretto,
                    "fabric_type": bias.fabric_type,
                    "fabric_code": bias.fabric_code,
                    "fabric_color": bias.fabric_color,
                    "dye_lot": bias.dye_lot,
                    "table_id": bias.table_id,
                    "row_id": bias.row_id,
                    "sequence_number": bias.sequence_number,
                    "phase_status": phase_status,
                    "details": {
                        "pieces": detail.pieces,
                        "total_width": detail.usable_width,
                        "gross_length": detail.gross_length,
                        "pcs_seam": detail.pcs_seam,
                        "roll_width": detail.roll_width,
                        "scrap_rolls": detail.scrap_rolls,
                        "rolls_planned": detail.rolls_planned,
                        "cons_planned": detail.cons_planned,
                        "extra": detail.extra if detail.extra is not None else 0,  # ✅ Add extra field, default to 0 if null
                        "applicable_sizes": detail.applicable_sizes,  # ✅ Return applicable_sizes
                        "bagno_ready": mattress_detail.bagno_ready if mattress_detail else False,
                        # ✅ Pull these from MattressDetail
                        "panel_length": panel_length,
                        "panels_planned": mattress_detail.layers if mattress_detail else None
                    }
                })

            return jsonify({"success": True, "data": result})

        except Exception as e:
            print(f"❌ Error fetching bias by order: {e}")
            return jsonify({"success": False, "message": str(e)})


