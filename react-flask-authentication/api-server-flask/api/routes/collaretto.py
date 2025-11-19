from flask import Blueprint, request, jsonify
from api.models import db, Collaretto, CollarettoDetail, Mattresses, MattressDetail, MattressPhase, OrderLinesView, MattressProductionCenter
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
            # Get optional filtering parameters
            cutting_room = request.args.get('cutting_room')
            destination = request.args.get('destination')

            # Base query for collaretto rows linked to this order
            query = Collaretto.query.filter_by(order_commessa=order_commessa, item_type='CA')

            # Apply production center filtering if provided
            if cutting_room or destination:
                query = query.join(
                    MattressProductionCenter, Collaretto.table_id == MattressProductionCenter.table_id
                )
                if cutting_room:
                    query = query.filter(MattressProductionCenter.cutting_room == cutting_room)
                if destination:
                    query = query.filter(MattressProductionCenter.destination == destination)

            collaretto_rows = query.all()

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
                        "rolls_actual": detail.rolls_actual,
                        "total_collaretto": detail.total_collaretto,
                        "cons_planned": detail.cons_planned,
                        "cons_actual": detail.cons_actual,
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
                    existing_collaretto_detail.pcs_seam = float(detail.get('pcs_seam')) if detail.get('pcs_seam') is not None else None
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

@collaretto_api.route('/delete_by_row_id/<string:row_id>', methods=['DELETE'])
class DeleteCollarettoByRowId(Resource):
    def delete(self, row_id):
        """Delete collaretto by row_id - more reliable than collaretto name"""
        def delete_operation():
            # ✅ Check if the collaretto exists by row_id
            collaretto = Collaretto.query.filter_by(row_id=row_id).first()

            if not collaretto:
                return {"success": True, "message": f"Collaretto with row_id {row_id} not found or already deleted"}

            collaretto_name = collaretto.collaretto  # Store for logging
            print(f"🔎 Found collaretto: {collaretto_name} (row_id: {row_id}), deleting attached mattress...")

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

            return {"success": True, "message": f"Deleted collaretto {collaretto_name} (row_id: {row_id})"}

        try:
            # Execute delete with deadlock retry
            result = retry_on_deadlock(delete_operation, max_retries=5, delay=0.5)
            return jsonify(result)

        except Exception as e:
            db.session.rollback()
            error_msg = str(e)
            print(f"❌ Error deleting collaretto by row_id {row_id}: {error_msg}")

            # Check if it's a deadlock error and provide user-friendly message
            if '1205' in error_msg or 'deadlock' in error_msg.lower():
                return jsonify({"success": False, "message": "Database is busy, please try again in a moment."})
            else:
                return jsonify({"success": False, "message": error_msg})

@collaretto_api.route('/get_weft_by_order/<order_id>', methods=['GET'])
class GetWeftByOrder(Resource):
    def get(self, order_id):
        try:
            # Get optional filtering parameters
            cutting_room = request.args.get('cutting_room')
            destination = request.args.get('destination')

            # Base query for weft collaretto rows linked to this order
            query = Collaretto.query.filter_by(order_commessa=order_id, item_type='CW')

            # Apply production center filtering if provided
            if cutting_room or destination:
                query = query.join(
                    MattressProductionCenter, Collaretto.table_id == MattressProductionCenter.table_id
                )
                if cutting_room:
                    query = query.filter(MattressProductionCenter.cutting_room == cutting_room)
                if destination:
                    query = query.filter(MattressProductionCenter.destination == destination)

            wefts = query.all()

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
                        "rolls_actual": detail.rolls_actual,
                        "cons_planned": detail.cons_planned,
                        "cons_actual": detail.cons_actual,
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
            # Get optional filtering parameters
            cutting_room = request.args.get('cutting_room')
            destination = request.args.get('destination')

            # Base query for bias collaretto rows linked to this order
            query = Collaretto.query.filter_by(order_commessa=order_id, item_type='CB')

            # Apply production center filtering if provided
            if cutting_room or destination:
                query = query.join(
                    MattressProductionCenter, Collaretto.table_id == MattressProductionCenter.table_id
                )
                if cutting_room:
                    query = query.filter(MattressProductionCenter.cutting_room == cutting_room)
                if destination:
                    query = query.filter(MattressProductionCenter.destination == destination)

            biases = query.all()

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
                        "rolls_actual": detail.rolls_actual,
                        "cons_planned": detail.cons_planned,
                        "cons_actual": detail.cons_actual,
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


# ===== LOGISTIC VIEW ENDPOINTS =====

@collaretto_api.route('/logistic/orders_by_production_center/<string:production_center>', methods=['GET'])
class GetOrdersByProductionCenter(Resource):
    def get(self, production_center):
        """Get all order IDs that have collaretto tables assigned to a specific production center (PXE3)"""
        try:
            # Query distinct order IDs that have collaretto tables assigned to this production center
            orders = db.session.query(
                Collaretto.order_commessa
            ).join(
                MattressProductionCenter, Collaretto.table_id == MattressProductionCenter.table_id
            ).filter(
                MattressProductionCenter.production_center == production_center,
                MattressProductionCenter.table_type.in_(['ALONG', 'WEFT', 'BIAS'])
            ).distinct().all()

            result = [{"order_commessa": order.order_commessa} for order in orders]

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching orders by production center: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/along_by_order/<string:order_commessa>', methods=['GET'])
class GetLogisticAlongByOrder(Resource):
    def get(self, order_commessa):
        """Get along collaretto tables for an order filtered by PXE3 production center"""
        try:
            print(f"🔍 Fetching along collaretto for order: {order_commessa}")

            # First check if we have any along collaretto for this order (ordered by bagno, then sequence_number)
            along_collaretto = Collaretto.query.filter_by(
                order_commessa=order_commessa,
                item_type='CA'
            ).order_by(Collaretto.dye_lot, Collaretto.sequence_number).all()

            print(f"🔍 Found {len(along_collaretto)} along collaretto records")

            if not along_collaretto:
                return {"success": True, "data": []}, 200

            # Group by table_id and check for PXE3 production center
            tables = {}
            for collaretto in along_collaretto:
                # Check if this table has PXE3 production center assignment
                prod_center = MattressProductionCenter.query.filter_by(
                    table_id=collaretto.table_id,
                    production_center='PXE3',
                    table_type='ALONG'
                ).first()

                if not prod_center:
                    continue  # Skip if not assigned to PXE3

                table_id = collaretto.table_id
                print(f"🔍 Found PXE3 along table: {table_id}")

                # Initialize table if not exists
                if table_id not in tables:
                    tables[table_id] = {
                        "id": table_id,
                        "fabricType": collaretto.fabric_type,
                        "fabricCode": collaretto.fabric_code,
                        "fabricColor": collaretto.fabric_color,
                        "dyeLot": collaretto.dye_lot,
                        "productionCenter": prod_center.production_center,
                        "cuttingRoom": prod_center.cutting_room,
                        "destination": prod_center.destination,
                        "alongExtra": "3",  # Default value
                        "rows": []
                    }

                # Get collaretto details for this specific collaretto record
                details = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).all()

                for detail in details:
                    # Get bagno from collaretto dye_lot
                    bagno = collaretto.dye_lot or ""

                    # Extract collaretto ID suffix (e.g., "CA-02-001" from "Z12-378867-CA-02-001")
                    collaretto_id_suffix = ""
                    if collaretto.collaretto:
                        parts = collaretto.collaretto.split('-')
                        if len(parts) >= 3:
                            # Take the last 3 parts (CA-02-001)
                            collaretto_id_suffix = '-'.join(parts[-3:])

                    tables[table_id]["rows"].append({
                        "id": collaretto.row_id,
                        "collarettoId": collaretto_id_suffix,
                        "pieces": detail.pieces,
                        "usableWidth": detail.usable_width,
                        "theoreticalConsumption": detail.gross_length,
                        "collarettoWidth": detail.roll_width,
                        "scrapRoll": detail.scrap_rolls,
                        "rolls": detail.rolls_planned,
                        "rollsActual": detail.rolls_actual or "",
                        "actualRolls": detail.rolls_actual or "",  # New field for actual rolls
                        "totalCollaretto": detail.total_collaretto,
                        "consPlanned": detail.cons_planned,
                        "consActual": detail.cons_actual or "",
                        "bagno": bagno,
                        "sizes": detail.applicable_sizes
                    })

            result_tables = list(tables.values())

            return {"success": True, "data": result_tables}, 200

        except Exception as e:
            print(f"❌ Error fetching logistic along by order: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/weft_by_order/<string:order_commessa>', methods=['GET'])
class GetLogisticWeftByOrder(Resource):
    def get(self, order_commessa):
        """Get weft collaretto tables for an order filtered by PXE3 production center"""
        try:
            print(f"🔍 Fetching weft collaretto for order: {order_commessa}")

            # First check if we have any weft collaretto for this order (ordered by bagno, then sequence_number)
            weft_collaretto = Collaretto.query.filter_by(
                order_commessa=order_commessa,
                item_type='CW'
            ).order_by(Collaretto.dye_lot, Collaretto.sequence_number).all()

            print(f"🔍 Found {len(weft_collaretto)} weft collaretto records")

            if not weft_collaretto:
                return {"success": True, "data": []}, 200

            # Group by table_id and check for PXE3 production center
            tables = {}
            for collaretto in weft_collaretto:
                # Check if this table has PXE3 production center assignment
                prod_center = MattressProductionCenter.query.filter_by(
                    table_id=collaretto.table_id,
                    production_center='PXE3',
                    table_type='WEFT'
                ).first()

                if not prod_center:
                    continue  # Skip if not assigned to PXE3

                table_id = collaretto.table_id
                print(f"🔍 Found PXE3 weft table: {table_id}")

                # Initialize table if not exists
                if table_id not in tables:
                    tables[table_id] = {
                        "id": table_id,
                        "fabricType": collaretto.fabric_type,
                        "fabricCode": collaretto.fabric_code,
                        "fabricColor": collaretto.fabric_color,
                        "dyeLot": collaretto.dye_lot,
                        "productionCenter": prod_center.production_center,
                        "cuttingRoom": prod_center.cutting_room,
                        "destination": prod_center.destination,
                        "spreading": "AUTOMATIC",  # Default value
                        "weftExtra": "3",  # Default value
                        "rows": []
                    }

                # Get collaretto details for this specific collaretto record
                details = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).all()

                for detail in details:
                    # Get bagno from collaretto dye_lot
                    bagno = collaretto.dye_lot or ""

                    # Extract collaretto ID suffix (e.g., "CA-02-001" from "Z12-378867-CA-02-001")
                    collaretto_id_suffix = ""
                    if collaretto.collaretto:
                        parts = collaretto.collaretto.split('-')
                        if len(parts) >= 3:
                            # Take the last 3 parts (CW-02-001)
                            collaretto_id_suffix = '-'.join(parts[-3:])

                    # Get panels from mattress_details.layers if available
                    panels = detail.rolls_planned  # Default fallback
                    if detail.mattress_id:
                        mattress_detail = MattressDetail.query.filter_by(mattress_id=detail.mattress_id).first()
                        if mattress_detail and mattress_detail.layers:
                            panels = mattress_detail.layers

                    tables[table_id]["rows"].append({
                        "id": collaretto.row_id,
                        "collarettoId": collaretto_id_suffix,
                        "pieces": detail.pieces,
                        "usableWidth": detail.usable_width,
                        "pcsSeamtoSeam": detail.pcs_seam,
                        "rewoundWidth": detail.gross_length,  # Use gross_length as rewound width
                        "collarettoWidth": detail.roll_width,  # Use roll_width as collaretto width
                        "scrapRoll": detail.scrap_rolls,
                        "rolls": detail.rolls_planned,
                        "rollsActual": detail.rolls_actual or "",
                        "actualRolls": detail.rolls_actual or "",  # New field for actual rolls
                        "panels": panels,  # Use mattress_details.layers if available
                        "consPlanned": detail.cons_planned,
                        "consActual": detail.cons_actual or "",
                        "bagno": bagno,
                        "sizes": detail.applicable_sizes
                    })

            result_tables = list(tables.values())

            return {"success": True, "data": result_tables}, 200

        except Exception as e:
            print(f"❌ Error fetching logistic weft by order: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/bias_by_order/<string:order_commessa>', methods=['GET'])
class GetLogisticBiasByOrder(Resource):
    def get(self, order_commessa):
        """Get bias collaretto tables for an order filtered by PXE3 production center"""
        try:
            print(f"🔍 Fetching bias collaretto for order: {order_commessa}")

            # First check if we have any bias collaretto for this order (ordered by bagno, then sequence_number)
            bias_collaretto = Collaretto.query.filter_by(
                order_commessa=order_commessa,
                item_type='CB'
            ).order_by(Collaretto.dye_lot, Collaretto.sequence_number).all()

            print(f"🔍 Found {len(bias_collaretto)} bias collaretto records")

            if not bias_collaretto:
                return {"success": True, "data": []}, 200

            # Group by table_id and check for PXE3 production center
            tables = {}
            for collaretto in bias_collaretto:
                # Check if this table has PXE3 production center assignment
                prod_center = MattressProductionCenter.query.filter_by(
                    table_id=collaretto.table_id,
                    production_center='PXE3',
                    table_type='BIAS'
                ).first()

                if not prod_center:
                    continue  # Skip if not assigned to PXE3

                table_id = collaretto.table_id
                print(f"🔍 Found PXE3 bias table: {table_id}")

                # Initialize table if not exists
                if table_id not in tables:
                    tables[table_id] = {
                        "id": table_id,
                        "fabricType": collaretto.fabric_type,
                        "fabricCode": collaretto.fabric_code,
                        "fabricColor": collaretto.fabric_color,
                        "dyeLot": collaretto.dye_lot,
                        "productionCenter": prod_center.production_center,
                        "cuttingRoom": prod_center.cutting_room,
                        "destination": prod_center.destination,
                        "biasExtra": "3",  # Default value
                        "rows": []
                    }

                # Get collaretto details for this specific collaretto record
                details = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).all()

                for detail in details:
                    # Get bagno from collaretto dye_lot
                    bagno = collaretto.dye_lot or ""

                    # Extract collaretto ID suffix (e.g., "CA-02-001" from "Z12-378867-CA-02-001")
                    collaretto_id_suffix = ""
                    if collaretto.collaretto:
                        parts = collaretto.collaretto.split('-')
                        if len(parts) >= 3:
                            # Take the last 3 parts (CB-02-001)
                            collaretto_id_suffix = '-'.join(parts[-3:])

                    tables[table_id]["rows"].append({
                        "id": collaretto.row_id,
                        "collarettoId": collaretto_id_suffix,
                        "pieces": detail.pieces,
                        "usableWidth": detail.usable_width,
                        "pcsSeam": detail.pcs_seam,
                        "rollWidth": detail.roll_width,
                        "scrapRolls": detail.scrap_rolls,
                        "rolls": detail.rolls_planned,
                        "rollsPlanned": detail.rolls_planned,
                        "rollsActual": detail.rolls_actual or "",
                        "consPlanned": detail.cons_planned,
                        "consActual": detail.cons_actual or "",
                        "bagno": bagno,
                        "sizes": detail.applicable_sizes
                    })

            result_tables = list(tables.values())

            return {"success": True, "data": result_tables}, 200

        except Exception as e:
            print(f"❌ Error fetching logistic bias by order: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/collaretos_by_order/<string:order_commessa>', methods=['GET'])
class GetCollarettosByOrder(Resource):
    def get(self, order_commessa):
        """Get all collaretos (CA, CW, CB) for an order filtered by PXE3 production center, grouped by destination"""
        try:
            print(f"🔍 Fetching collaretos for order: {order_commessa}")

            # Query all collaretos for this order with item_type CA, CW, or CB
            collaretos = Collaretto.query.filter(
                Collaretto.order_commessa == order_commessa,
                Collaretto.item_type.in_(['CA', 'CW', 'CB'])
            ).all()

            print(f"🔍 Found {len(collaretos)} total collaretos")

            if not collaretos:
                return {"success": True, "data": []}, 200

            # Group by destination
            destination_groups = {}

            for collaretto in collaretos:
                # Check if this collaretto is assigned to PXE3
                prod_center = MattressProductionCenter.query.filter_by(
                    table_id=collaretto.table_id
                ).first()

                if prod_center and prod_center.production_center == 'PXE3':
                    destination = prod_center.destination or 'N/A'

                    if destination not in destination_groups:
                        # Determine the type label
                        type_label = 'Along'
                        if collaretto.item_type == 'CW':
                            type_label = 'Weft'
                        elif collaretto.item_type == 'CB':
                            type_label = 'Bias'

                        destination_groups[destination] = {
                            "destination": destination,
                            "fabricType": collaretto.fabric_type,
                            "fabricCode": collaretto.fabric_code,
                            "fabricColor": collaretto.fabric_color,
                            "dyeLot": collaretto.dye_lot,
                            "productionCenter": prod_center.production_center,
                            "cuttingRoom": prod_center.cutting_room,
                            "itemType": collaretto.item_type,
                            "typeLabel": type_label,
                            "tableIds": [collaretto.table_id],
                            "count": 1
                        }
                    else:
                        # Increment count and add table_id if not already present
                        destination_groups[destination]["count"] += 1
                        if collaretto.table_id not in destination_groups[destination]["tableIds"]:
                            destination_groups[destination]["tableIds"].append(collaretto.table_id)

            # Convert to list
            result = list(destination_groups.values())

            print(f"🔍 Found {len(result)} destinations with collaretos for PXE3")

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching collaretos by order: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/batches_by_destination/<string:order_commessa>/<string:destination>', methods=['GET'])
class GetBatchesByDestination(Resource):
    def get(self, order_commessa, destination):
        """Get batches (bagno) grouped for a specific order and destination"""
        try:
            print(f"🔍 Fetching batches for order: {order_commessa}, destination: {destination}")

            # Get all collaretos for this order and destination
            collaretos = db.session.query(Collaretto).join(
                MattressProductionCenter,
                Collaretto.table_id == MattressProductionCenter.table_id
            ).filter(
                Collaretto.order_commessa == order_commessa,
                MattressProductionCenter.destination == destination,
                MattressProductionCenter.production_center == 'PXE3'
            ).all()

            if not collaretos:
                return {"success": True, "data": []}, 200

            # Group by bagno (dye_lot)
            batches = {}
            for collaretto in collaretos:
                bagno = collaretto.dye_lot or "NO_BAGNO"

                if bagno not in batches:
                    # Get production center info
                    prod_center = MattressProductionCenter.query.filter_by(
                        table_id=collaretto.table_id
                    ).first()

                    batches[bagno] = {
                        "bagno": bagno,
                        "count": 0,
                        "tableIds": [],
                        "itemType": collaretto.item_type,
                        "fabricType": collaretto.fabric_type,
                        "fabricCode": collaretto.fabric_code,
                        "fabricColor": collaretto.fabric_color,
                        "destination": prod_center.destination if prod_center else "",
                        "productionCenter": prod_center.production_center if prod_center else "",
                        "cuttingRoom": prod_center.cutting_room if prod_center else ""
                    }

                batches[bagno]["count"] += 1
                if collaretto.table_id not in batches[bagno]["tableIds"]:
                    batches[bagno]["tableIds"].append(collaretto.table_id)

            # Convert to list and add type labels
            type_labels = {
                'CA': 'Along',
                'CW': 'Weft',
                'CB': 'Bias'
            }

            result = []
            for batch in batches.values():
                batch['typeLabel'] = type_labels.get(batch['itemType'], batch['itemType'])
                result.append(batch)

            # Sort by bagno
            result.sort(key=lambda x: x['bagno'])

            print(f"🔍 Found {len(result)} batches for destination {destination}")

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching batches by destination: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/collaretto_details_by_batch/<string:order_commessa>/<string:destination>/<string:bagno>', methods=['GET'])
class GetCollarettoDetailsByBatch(Resource):
    def get(self, order_commessa, destination, bagno):
        """Get detailed collaretto information filtered by order, destination, and bagno"""
        try:
            print(f"🔍 Fetching collaretto details for order={order_commessa}, destination={destination}, bagno={bagno}")

            # First, get all collaretos for this order and bagno
            collaretos_for_order = Collaretto.query.filter_by(
                order_commessa=order_commessa,
                dye_lot=bagno
            ).all()

            if not collaretos_for_order:
                return {"success": False, "msg": "No collaretos found for this order and bagno"}, 404

            # Get table_ids from these collaretos
            table_ids_from_collaretos = [c.table_id for c in collaretos_for_order]

            # Filter by production center and destination
            prod_centers = MattressProductionCenter.query.filter(
                MattressProductionCenter.table_id.in_(table_ids_from_collaretos),
                MattressProductionCenter.production_center == 'PXE3',
                MattressProductionCenter.destination == destination
            ).all()

            if not prod_centers:
                return {"success": False, "msg": "No production centers found for this destination"}, 404

            table_ids = [pc.table_id for pc in prod_centers]

            # Get all collaretos for these filtered table_ids
            collaretos = Collaretto.query.filter(
                Collaretto.table_id.in_(table_ids),
                Collaretto.order_commessa == order_commessa,
                Collaretto.dye_lot == bagno
            ).order_by(Collaretto.sequence_number).all()

            if not collaretos:
                return {"success": False, "msg": "No collaretos found for this batch"}, 404

            # Get the first collaretto to extract common info
            first_collaretto = collaretos[0]

            # Get production center info from the first collaretto
            prod_center = MattressProductionCenter.query.filter_by(table_id=first_collaretto.table_id).first()

            # Get the style name from the order
            order_style = None
            order_line = OrderLinesView.query.filter_by(order_commessa=order_commessa).first()
            if order_line:
                order_style = order_line.style

            # Build rows data
            rows = []
            for collaretto in collaretos:
                # Get detail for this collaretto
                detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()

                if not detail:
                    continue

                # Get mattress info - all collaretos should have a linked mattress
                mattress_info = None
                mattress = None

                if detail.mattress_id:
                    mattress = Mattresses.query.filter_by(id=detail.mattress_id).first()

                # If no mattress_id, try to find mattress by matching table_id and order
                if not mattress:
                    mattress = Mattresses.query.filter_by(
                        table_id=collaretto.table_id,
                        order_commessa=collaretto.order_commessa
                    ).first()

                if mattress:
                    mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress.id).first()
                    mattress_info = {
                        "mattressName": mattress.mattress,
                        "panels": mattress_detail.layers if mattress_detail else None
                    }

                row_data = {
                    "rowId": collaretto.row_id,
                    "collarettoId": collaretto.collaretto,
                    "sequenceNumber": collaretto.sequence_number,
                    "pieces": detail.pieces,
                    "usableWidth": detail.usable_width,
                    "grossLength": detail.gross_length,
                    "rollWidth": detail.roll_width,
                    "pcsSeam": detail.pcs_seam,
                    "scrapRolls": detail.scrap_rolls,
                    "rollsPlanned": detail.rolls_planned,
                    "rollsActual": detail.rolls_actual,
                    "consPlanned": detail.cons_planned,
                    "consActual": detail.cons_actual,
                    "extra": detail.extra,
                    "totalCollaretto": detail.total_collaretto,
                    "applicableSizes": detail.applicable_sizes,
                    "mattressInfo": mattress_info
                }

                rows.append(row_data)

            # Determine type label
            type_label = 'Along'
            if first_collaretto.item_type == 'CW':
                type_label = 'Weft'
            elif first_collaretto.item_type == 'CB':
                type_label = 'Bias'

            result = {
                "orderCommessa": first_collaretto.order_commessa,
                "style": order_style,
                "itemType": first_collaretto.item_type,
                "typeLabel": type_label,
                "fabricType": first_collaretto.fabric_type,
                "fabricCode": first_collaretto.fabric_code,
                "fabricColor": first_collaretto.fabric_color,
                "dyeLot": first_collaretto.dye_lot,
                "productionCenter": prod_center.production_center if prod_center else None,
                "cuttingRoom": prod_center.cutting_room if prod_center else None,
                "destination": prod_center.destination if prod_center else None,
                "rows": rows
            }

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching collaretto details by batch: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/collaretto_details/<string:table_id>', methods=['GET'])
class GetCollarettoDetails(Resource):
    def get(self, table_id):
        """Get detailed collaretto information for editing and printing"""
        try:
            print(f"🔍 Fetching collaretto details for table_id: {table_id}")

            # Get all collaretos for this table_id
            collaretos = Collaretto.query.filter_by(table_id=table_id).order_by(Collaretto.sequence_number).all()

            if not collaretos:
                return {"success": False, "msg": "No collaretos found for this table"}, 404

            # Get production center info
            prod_center = MattressProductionCenter.query.filter_by(table_id=table_id).first()

            # Get the first collaretto to extract common info
            first_collaretto = collaretos[0]

            # Build rows data
            rows = []
            for collaretto in collaretos:
                # Get detail for this collaretto
                detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()

                if not detail:
                    continue

                # Get mattress info if this is a weft or bias collaretto
                mattress_info = None
                if detail.mattress_id:
                    mattress = Mattresses.query.filter_by(id=detail.mattress_id).first()
                    if mattress:
                        mattress_detail = MattressDetail.query.filter_by(mattress_id=mattress.id).first()
                        mattress_info = {
                            "mattressName": mattress.mattress,
                            "panels": mattress_detail.layers if mattress_detail else None
                        }

                row_data = {
                    "rowId": collaretto.row_id,
                    "collarettoId": collaretto.collaretto,
                    "sequenceNumber": collaretto.sequence_number,
                    "pieces": detail.pieces,
                    "usableWidth": detail.usable_width,
                    "grossLength": detail.gross_length,
                    "rollWidth": detail.roll_width,
                    "pcsSeam": detail.pcs_seam,
                    "scrapRolls": detail.scrap_rolls,
                    "rollsPlanned": detail.rolls_planned,
                    "rollsActual": detail.rolls_actual,
                    "consPlanned": detail.cons_planned,
                    "consActual": detail.cons_actual,
                    "extra": detail.extra,
                    "totalCollaretto": detail.total_collaretto,
                    "applicableSizes": detail.applicable_sizes,
                    "mattressInfo": mattress_info
                }

                rows.append(row_data)

            # Determine type label
            type_label = 'Along'
            if first_collaretto.item_type == 'CW':
                type_label = 'Weft'
            elif first_collaretto.item_type == 'CB':
                type_label = 'Bias'

            result = {
                "tableId": table_id,
                "orderCommessa": first_collaretto.order_commessa,
                "itemType": first_collaretto.item_type,
                "typeLabel": type_label,
                "fabricType": first_collaretto.fabric_type,
                "fabricCode": first_collaretto.fabric_code,
                "fabricColor": first_collaretto.fabric_color,
                "dyeLot": first_collaretto.dye_lot,
                "productionCenter": prod_center.production_center if prod_center else None,
                "cuttingRoom": prod_center.cutting_room if prod_center else None,
                "destination": prod_center.destination if prod_center else None,
                "rows": rows
            }

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching collaretto details: {e}")
            return {"success": False, "msg": str(e)}, 500


@collaretto_api.route('/logistic/update_collaretto_details', methods=['PUT'])
class UpdateCollarettoDetails(Resource):
    def put(self):
        """Update collaretto details from the configuration screen"""
        try:
            data = request.get_json()
            rows = data.get('rows', [])

            print(f"🔄 Updating {len(rows)} collaretto rows")

            for row in rows:
                row_id = row.get('rowId')

                # Find the collaretto by row_id
                collaretto = Collaretto.query.filter_by(row_id=row_id).first()

                if not collaretto:
                    print(f"⚠️ Collaretto not found for row_id: {row_id}")
                    continue

                # Get the detail
                detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()

                if not detail:
                    print(f"⚠️ Detail not found for collaretto_id: {collaretto.id}")
                    continue

                # Update detail fields
                detail.pieces = row.get('pieces', detail.pieces)
                detail.usable_width = row.get('usableWidth', detail.usable_width)
                detail.gross_length = row.get('grossLength', detail.gross_length)
                detail.roll_width = row.get('rollWidth', detail.roll_width)
                detail.pcs_seam = row.get('pcsSeam', detail.pcs_seam)
                detail.scrap_rolls = row.get('scrapRolls', detail.scrap_rolls)
                detail.rolls_planned = row.get('rollsPlanned', detail.rolls_planned)

                # Convert rolls_actual to float if it's a string
                rolls_actual_value = row.get('rollsActual', detail.rolls_actual)
                if rolls_actual_value == '' or rolls_actual_value is None:
                    detail.rolls_actual = None
                else:
                    detail.rolls_actual = float(rolls_actual_value) if isinstance(rolls_actual_value, str) else rolls_actual_value

                detail.cons_planned = row.get('consPlanned', detail.cons_planned)
                detail.extra = row.get('extra', detail.extra)
                detail.applicable_sizes = row.get('applicableSizes', detail.applicable_sizes)

                # Calculate total_collaretto if not provided or if it's null
                # Formula: total_collaretto = pieces * gross_length
                total_collaretto_from_request = row.get('totalCollaretto')
                if total_collaretto_from_request is not None and total_collaretto_from_request != '':
                    detail.total_collaretto = total_collaretto_from_request
                elif detail.pieces and detail.gross_length:
                    detail.total_collaretto = detail.pieces * detail.gross_length
                    print(f"📐 Calculated total_collaretto: {detail.pieces} * {detail.gross_length} = {detail.total_collaretto}")
                else:
                    detail.total_collaretto = None

                # Calculate cons_actual based on item type
                # Get the collaretto to check item_type
                item_type = collaretto.item_type if collaretto else None

                print(f"🔍 Calculating cons_actual for item_type={item_type}")
                print(f"   rolls_actual={detail.rolls_actual}, pieces={detail.pieces}, pcs_seam={detail.pcs_seam}")
                print(f"   gross_length={detail.gross_length}, extra={detail.extra}")

                if detail.rolls_actual and detail.rolls_actual > 0:
                    if item_type == 'CA':
                        # Along: cons_actual = total_collaretto / rolls_actual
                        if detail.total_collaretto and detail.total_collaretto > 0:
                            detail.cons_actual = round(detail.total_collaretto / detail.rolls_actual, 2)
                            print(f"✅ Along cons_actual = {detail.total_collaretto} / {detail.rolls_actual} = {detail.cons_actual}")
                        else:
                            detail.cons_actual = None
                            print(f"⚠️ cons_actual set to None (missing total_collaretto)")
                    elif item_type in ['CW', 'CB']:
                        # Weft/Bias: cons_actual = panels_actual * rewoundWidth
                        # panels_actual = (pieces * (1 + extra/100)) / (rolls_actual * pcs_seam)
                        # rewoundWidth is stored in MattressDetail.length_mattress

                        # Fetch rewoundWidth from MattressDetail
                        rewound_width = None
                        if detail.mattress_id:
                            mattress_detail = MattressDetail.query.filter_by(mattress_id=detail.mattress_id).first()
                            if mattress_detail:
                                rewound_width = mattress_detail.length_mattress

                        print(f"   rewound_width from mattress={rewound_width}")

                        if detail.pieces and detail.pcs_seam and rewound_width:
                            extra_percent = (detail.extra or 0) / 100
                            panels_calculation = (detail.pieces * (1 + extra_percent)) / (detail.rolls_actual * detail.pcs_seam)

                            # Apply rounding logic: if decimal > 0.15, ceil, else floor
                            decimal_part = panels_calculation - int(panels_calculation)
                            panels_actual = int(panels_calculation) + 1 if decimal_part > 0.15 else int(panels_calculation)

                            # Use rewoundWidth from MattressDetail and round to 2 decimals
                            detail.cons_actual = round(panels_actual * rewound_width, 2)
                            print(f"✅ Weft/Bias panels_actual = {panels_actual}, cons_actual = {panels_actual} * {rewound_width} = {detail.cons_actual}")
                        else:
                            detail.cons_actual = None
                            print(f"⚠️ cons_actual set to None (missing pieces, pcs_seam, or rewound_width)")
                    else:
                        detail.cons_actual = None
                        print(f"⚠️ Unknown item_type: {item_type}")
                else:
                    detail.cons_actual = None
                    print(f"⚠️ cons_actual set to None (missing or zero rolls_actual)")

                detail.updated_at = datetime.now()

            db.session.commit()
            print("✅ Collaretto details updated successfully")

            return {"success": True, "message": "Collaretto details updated successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error updating collaretto details: {e}")
            return {"success": False, "msg": str(e)}, 500

