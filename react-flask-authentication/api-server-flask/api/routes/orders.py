from flask import Blueprint, request
from flask_restx import Namespace, Resource
from sqlalchemy import text
from api.models import db, OrderLinesView, OrderRatio, ProductionCenter, OrderComments, StyleComments, StyleSettings, ProdOrderComponentView, OrderProductionCenter, OrderAudit, NavBom
import uuid

# ✅ Create Blueprint and API instance
orders_bp = Blueprint('orders', __name__)
orders_api = Namespace('orders', description="Order Management")

@orders_api.route('/order_lines')
class OrderLines(Resource):
    def get(self):
        try:
            # Optionally filter by order_commessa if provided as a query parameter.
            order_commessa = request.args.get('order_commessa')
            min_order_prefix = request.args.get('min_prefix', '24')  # Default to '24' if not specified

            query = OrderLinesView.query

            # Apply order_commessa filter if provided
            if order_commessa:
                query = query.filter_by(order_commessa=order_commessa)
            else:
                # Filter for orders that start with numbers 24 and onwards
                # Use LIKE to filter for orders that start with digits 2-9
                query = query.filter(
                    (OrderLinesView.order_commessa.like('2%') & (OrderLinesView.order_commessa >= min_order_prefix)) |
                    OrderLinesView.order_commessa.like('3%') |
                    OrderLinesView.order_commessa.like('4%') |
                    OrderLinesView.order_commessa.like('5%') |
                    OrderLinesView.order_commessa.like('6%') |
                    OrderLinesView.order_commessa.like('7%') |
                    OrderLinesView.order_commessa.like('8%') |
                    OrderLinesView.order_commessa.like('9%')
                )

            # Fetch order lines sorted by 'order_commessa'
            data = query.order_by(OrderLinesView.order_commessa).all()

            # Convert results to dictionary format
            data_list = [row.to_dict() for row in data]

            return {
                "success": True,
                "data": data_list
            }, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/order_lines/without_ratios', methods=['GET'])
class OrdersWithoutRatios(Resource):
    def get(self):
        try:
            # Step 1: Get all orders starting with '25' and their styles
            all_order_pairs = db.session.query(
                OrderLinesView.order_commessa,
                OrderLinesView.style
            ).filter(
                OrderLinesView.order_commessa.like('25%')
            ).distinct().all()  # Ex: [('25ABC', 'STYLE1'), ('25DEF', 'STYLE2')]

            all_orders_dict = {
                order_commessa: style
                for order_commessa, style in all_order_pairs
                if order_commessa and style
            }

            # Step 2: Get orders that already have ratios
            existing_orders = db.session.query(OrderRatio.order_commessa).distinct().all()
            existing_orders_set = {row[0] for row in existing_orders}

            # Step 3: Subtract to find orders still needing ratios
            orders_to_do = [
                {"id": oc, "style": st}
                for oc, st in all_orders_dict.items()
                if oc not in existing_orders_set
            ]

            return {"success": True, "orders": orders_to_do}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/ratios/update')
class UpdateOrderRatios(Resource):
    def patch(self):
        try:
            payload = request.get_json()
            ratios = payload.get("data", [])

            for row in ratios:
                ratio = OrderRatio(
                    order_commessa=row["order_commessa"],
                    size=row["size"],
                    theoretical_ratio=row["theoretical_ratio"]
                )
                db.session.merge(ratio)  # Insert or update

            db.session.commit()
            return {"success": True, "msg": "Ratios inserted/updated"}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/order_lines/without_ratios/count', methods=['GET'])
class OrdersWithoutRatiosCount(Resource):
    def get(self):
        try:
            # All order_commessa starting with '25'
            all_order_ids = db.session.query(OrderLinesView.order_commessa).filter(
                OrderLinesView.order_commessa.like('25%')
            ).distinct().all()
            all_order_set = {row[0] for row in all_order_ids}

            # All order_commessa that already have ratios
            existing_ratios = db.session.query(OrderRatio.order_commessa).distinct().all()
            existing_ratio_set = {row[0] for row in existing_ratios}

            # Difference = those missing
            missing_ratio_count = len(all_order_set - existing_ratio_set)

            return {"success": True, "count": missing_ratio_count}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/order_lines/styles', methods=['GET'])
class OrderLineStyles(Resource):
    def get(self):
        try:
            # Query distinct styles from order lines
            styles = db.session.query(OrderLinesView.style)\
                .filter(OrderLinesView.style.isnot(None))\
                .distinct()\
                .all()

            # Flatten the result
            style_list = [s[0] for s in styles if s[0]]

            return {"success": True, "styles": style_list}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/ratios/<string:order_commessa>', methods=['GET'])
class GetOrderRatios(Resource):
    def get(self, order_commessa):
        try:
            ratios = OrderRatio.query.filter_by(order_commessa=order_commessa).all()
            if not ratios:
                return [], 200  # Return empty list if no data found

            result = [
                {
                    "size": r.size,
                    "percentage": r.theoretical_ratio
                } for r in ratios
            ]

            return result, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/production_center/save', methods=['POST'])
class SaveProductionCenter(Resource):
    def post(self):
        try:
            data = request.get_json()
            order_commessa = data.get('order_commessa')
            production_center = data.get('production_center')
            cutting_room = data.get('cutting_room')
            destination = data.get('destination') or None  # ✅ Convert empty string to None

            if not order_commessa or not production_center or not cutting_room:
                return {"success": False, "msg": "Missing required fields."}, 400

            existing = db.session.query(ProductionCenter).filter_by(order_commessa=order_commessa).first()

            if existing:
                existing.production_center = production_center
                existing.cutting_room = cutting_room
                existing.destination = destination  # ✅ handles null correctly
            else:
                new_entry = ProductionCenter(
                    order_commessa=order_commessa,
                    production_center=production_center,
                    cutting_room=cutting_room,
                    destination=destination
                )
                db.session.add(new_entry)

            db.session.commit()
            return {"success": True}, 200

        except Exception as e:
            db.session.rollback()
            print("❌ Error in /production_center/save:", e)
            return {"success": False, "msg": str(e)}, 500


@orders_api.route('/production_center/get/<string:order_commessa>', methods=['GET'])
class GetProductionCenter(Resource):
    def get(self, order_commessa):
        try:
            record = db.session.query(ProductionCenter).filter_by(order_commessa=order_commessa).first()
            if record:
                return {
                    "success": True,
                    "data": {
                        "production_center": record.production_center,
                        "cutting_room": record.cutting_room,
                        "destination": record.destination
                    }
                }, 200
            else:
                return {"success": True, "data": None}, 200  # Still a success, just empty
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/comments/save', methods=['POST'])
class SaveOrderComment(Resource):
    def post(self):
        try:
            data = request.get_json()
            order_commessa = data.get('order_commessa')
            combination_id = data.get('combination_id')
            comment_text = data.get('comment_text', '').strip()

            if not order_commessa:
                return {"success": False, "msg": "order_commessa is required"}, 400

            # Find existing comment or create new one
            existing_comment = db.session.query(OrderComments).filter_by(
                order_commessa=order_commessa,
                combination_id=combination_id
            ).first()

            if comment_text:  # If there's actual comment text
                if existing_comment:
                    existing_comment.comment_text = comment_text
                else:
                    new_comment = OrderComments(
                        order_commessa=order_commessa,
                        combination_id=combination_id,
                        comment_text=comment_text
                    )
                    db.session.add(new_comment)
            else:  # If comment is empty, delete the record
                if existing_comment:
                    db.session.delete(existing_comment)
                # If no existing comment and empty text, do nothing

            db.session.commit()
            return {"success": True, "msg": "Comment saved successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print("❌ Error in /comments/save:", e)
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/comments/get/<string:order_commessa>', methods=['GET'])
@orders_api.route('/comments/get/<string:order_commessa>/<string:combination_id>', methods=['GET'])
class GetOrderComment(Resource):
    def get(self, order_commessa, combination_id=None):
        try:
            if combination_id:
                comment = db.session.query(OrderComments).filter_by(
                    order_commessa=order_commessa,
                    combination_id=combination_id
                ).first()
            else:
                # For backward compatibility, get comment without combination_id
                comment = db.session.query(OrderComments).filter_by(
                    order_commessa=order_commessa,
                    combination_id=None
                ).first()

            if comment:
                return {
                    "success": True,
                    "data": comment.to_dict()
                }, 200
            else:
                return {"success": True, "data": None}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/comments/get_all/<string:order_commessa>', methods=['GET'])
class GetAllOrderComments(Resource):
    def get(self, order_commessa):
        """Get all comments for an order (all production center combinations)"""
        try:
            comments = db.session.query(OrderComments).filter_by(
                order_commessa=order_commessa
            ).all()

            result = []
            for comment in comments:
                comment_data = comment.to_dict()
                # Add production center info if combination_id exists
                if comment.combination_id:
                    combination = db.session.query(OrderProductionCenter).filter_by(
                        combination_id=comment.combination_id
                    ).first()
                    if combination:
                        comment_data['production_center_info'] = {
                            'production_center': combination.production_center,
                            'cutting_room': combination.cutting_room,
                            'destination': combination.destination
                        }
                result.append(comment_data)

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/style_comments/save', methods=['POST'])
class SaveStyleComment(Resource):
    def post(self):
        try:
            data = request.get_json(force=True)
            style = data.get('style')
            comment_text = data.get('comment_text', '').strip()

            if not style:
                return {"success": False, "msg": "style is required"}, 400

            # Find existing comment or create new one
            existing_comment = db.session.query(StyleComments).filter_by(style=style).first()

            if comment_text:  # If there's actual comment text
                if existing_comment:
                    existing_comment.comment_text = comment_text
                else:
                    new_comment = StyleComments(
                        style=style,
                        comment_text=comment_text
                    )
                    db.session.add(new_comment)
            else:  # If comment is empty, delete the record
                if existing_comment:
                    db.session.delete(existing_comment)
                # If no existing comment and empty text, do nothing

            db.session.commit()
            return {"success": True, "msg": "Style comment saved successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print("❌ Error in /style_comments/save:", e)
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/style_comments/get/<string:style>', methods=['GET'])
class GetStyleComment(Resource):
    def get(self, style):
        try:
            comment = db.session.query(StyleComments).filter_by(style=style).first()
            if comment:
                return {
                    "success": True,
                    "data": comment.to_dict()
                }, 200
            else:
                return {"success": True, "data": None}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/style_settings/save', methods=['POST'])
class SaveStyleSettings(Resource):
    def post(self):
        try:
            data = request.get_json()
            style = data.get('style')
            max_pieces_in_package = data.get('max_pieces_in_package')

            if not style:
                return {"success": False, "msg": "style is required"}, 400

            # Find existing settings or create new one
            existing_settings = db.session.query(StyleSettings).filter_by(style=style).first()

            if existing_settings:
                existing_settings.max_pieces_in_package = max_pieces_in_package
            else:
                new_settings = StyleSettings(
                    style=style,
                    max_pieces_in_package=max_pieces_in_package
                )
                db.session.add(new_settings)

            db.session.commit()
            return {"success": True, "msg": "Style settings saved successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print("❌ Error in /style_settings/save:", e)
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/style_settings/get/<string:style>', methods=['GET'])
class GetStyleSettings(Resource):
    def get(self, style):
        try:
            settings = db.session.query(StyleSettings).filter_by(style=style).first()
            if settings:
                return {
                    "success": True,
                    "data": settings.to_dict()
                }, 200
            else:
                return {"success": True, "data": None}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/comments/get_combined/<string:order_commessa>', methods=['GET'])
class GetCombinedComments(Resource):
    def get(self, order_commessa):
        try:
            # Get order comment
            order_comment = db.session.query(OrderComments).filter_by(order_commessa=order_commessa).first()

            # Get style for this order
            order_line = db.session.query(OrderLinesView).filter_by(order_commessa=order_commessa).first()
            style_comment = None

            if order_line and order_line.style:
                style_comment = db.session.query(StyleComments).filter_by(style=order_line.style).first()

            return {
                "success": True,
                "data": {
                    "order_comment": order_comment.to_dict() if order_comment else None,
                    "style_comment": style_comment.to_dict() if style_comment else None,
                    "style": order_line.style if order_line else None
                }
            }, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/collaretto_consumption/<string:style>/<string:fabric_code>')
class GetCollarettoConsumption(Resource):
    def get(self, style, fabric_code):
        try:


            try:
                from api.models import Collaretto, CollarettoDetail, OrderLinesView, MattressSize, Mattresses, MattressDetail

                # First, find orders that have the specified style
                orders_with_style = db.session.query(OrderLinesView.order_commessa).filter_by(style=style).distinct().all()
                order_commessas_with_style = [o[0] for o in orders_with_style if o[0]]

                if not order_commessas_with_style:
                    return {
                        "success": True,
                        "data": {},
                        "debug_info": f"No orders found with style: {style}"
                    }, 200

                # Find collaretto records that match both the style (via orders) and fabric
                # Limit to 5 most recent records based on order_commessa (assuming higher order numbers are newer)
                matching_collarettos = Collaretto.query.filter(
                    Collaretto.order_commessa.in_(order_commessas_with_style),
                    Collaretto.fabric_code == fabric_code
                ).order_by(Collaretto.order_commessa.desc()).limit(5).all()

                if not matching_collarettos:
                    return {
                        "success": True,
                        "data": {},
                        "debug_info": f"No collaretto records found for style: {style}, fabric: {fabric_code}"
                    }, 200

                # Process all matching collaretto records and group by bagno
                collaretto_records = []
                bagno_groups = {}  # Group records by bagno
                total_pieces = 0
                total_consumption = 0
                total_length = 0

                for collaretto in matching_collarettos:
                    detail = CollarettoDetail.query.filter_by(collaretto_id=collaretto.id).first()

                    if detail:
                        pieces = float(detail.pieces) if detail.pieces else 0
                        cons_planned = float(detail.cons_planned) if detail.cons_planned else 0
                        gross_length = float(detail.gross_length) if detail.gross_length else 0

                        # Get the bagno from the mattress (bagno is stored in the dye_lot field)
                        bagno = None
                        if detail.mattress_id:
                            mattress = Mattresses.query.get(detail.mattress_id)
                            if mattress:
                                bagno = mattress.dye_lot

                        # Group by bagno for summing pieces
                        if bagno not in bagno_groups:
                            bagno_groups[bagno] = {
                                'bagno': bagno,
                                'total_pieces': 0,
                                'total_consumption': 0,
                                'records': []
                            }

                        bagno_groups[bagno]['total_pieces'] += pieces
                        bagno_groups[bagno]['total_consumption'] += cons_planned

                        roll_width_value = float(detail.roll_width) if detail.roll_width else 0

                        record_data = {
                            'order_commessa': collaretto.order_commessa,
                            'collaretto_id': collaretto.id,
                            'fabric_type': collaretto.fabric_type or 'N/A',
                            'item_type': collaretto.item_type,  # Add item_type for grain direction
                            'pieces': pieces,
                            'usable_width': float(detail.usable_width) if detail.usable_width else 0,
                            'gross_length': gross_length,
                            'cons_planned': cons_planned,
                            'pcs_seam': float(detail.pcs_seam) if detail.pcs_seam else 0,
                            'collarettoWidth': roll_width_value,  # Use frontend field name
                            'consumption_per_piece': round(cons_planned / pieces, 4) if pieces > 0 else 0,
                            'bagno': bagno,
                            'mattress_id': detail.mattress_id,
                            'applicable_sizes': detail.applicable_sizes  # Add the stored applicable sizes
                        }
                        bagno_groups[bagno]['records'].append(record_data)
                        collaretto_records.append(record_data)

                        # Add to totals for averages
                        total_pieces += pieces
                        total_consumption += cons_planned
                        total_length += gross_length

                if not collaretto_records:
                    return {
                        "success": True,
                        "data": {},
                        "debug_info": f"Collaretto records found but no valid details"
                    }, 200

                # Calculate averages
                avg_consumption_per_piece = round(total_consumption / total_pieces, 4) if total_pieces > 0 else 0
                avg_length = round(total_length / len(collaretto_records), 2) if collaretto_records else 0
                avg_pieces = round(total_pieces / len(collaretto_records), 1) if collaretto_records else 0

                # Get planned quantities for each bagno from mattress sizes
                bagno_planned_quantities = {}
                for bagno in bagno_groups.keys():
                    if bagno:
                        # Find mattresses with this bagno (dye_lot)
                        bagno_mattresses = Mattresses.query.filter_by(dye_lot=bagno).all()
                        bagno_planned = {}

                        for mattress in bagno_mattresses:
                            # Get sizes for this mattress
                            mattress_sizes = MattressSize.query.filter_by(mattress_id=mattress.id).all()
                            for size_record in mattress_sizes:
                                size = size_record.size
                                planned_qty = float(size_record.pcs_planned) if size_record.pcs_planned else 0
                                bagno_planned[size] = bagno_planned.get(size, 0) + planned_qty

                        bagno_planned_quantities[bagno] = bagno_planned

                # Add bagno grouping info to each record for frontend matching
                for record in collaretto_records:
                    bagno = record['bagno']
                    if bagno in bagno_groups:
                        record['bagno_info'] = {
                            'bagno': bagno,
                            'total_pieces_in_bagno': bagno_groups[bagno]['total_pieces'],
                            'pieces_to_match': bagno_groups[bagno]['total_pieces'],  # Use total for matching
                            'mattress_id': record['mattress_id'],
                            'individual_pieces': record['pieces'],  # Keep individual record pieces for reference
                            'planned_quantities': bagno_planned_quantities.get(bagno, {})  # Add planned quantities for this bagno
                        }

                # Build the result with all records and statistics
                result_data = {
                    'style': style,
                    'fabric_code': fabric_code,
                    'fabric_type': collaretto_records[0]['fabric_type'],
                    'description': f"Collaretto - {collaretto_records[0]['fabric_type']}",
                    'total_records': len(collaretto_records),
                    'bagno_groups': bagno_groups,  # Include bagno grouping info
                    'statistics': {
                        'total_pieces': total_pieces,
                        'total_consumption': round(total_consumption, 2),
                        'avg_consumption_per_piece': avg_consumption_per_piece,
                        'avg_length': avg_length,
                        'avg_pieces': avg_pieces
                    },
                    'records': collaretto_records
                }

            except Exception as e:
                print(f"⚠️ Error fetching collaretto details: {str(e)}")
                return {
                    "success": False,
                    "msg": f"Error fetching collaretto data: {str(e)}"
                }, 500

            return {
                "success": True,
                "data": result_data
            }, 200

        except Exception as e:
            print(f"❌ Error fetching collaretto consumption: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "msg": str(e)}, 500

# New Order-Level Production Center Management Endpoints

@orders_api.route('/production_center_combinations/get/<string:order_commessa>', methods=['GET'])
class GetOrderProductionCenterCombinations(Resource):
    def get(self, order_commessa):
        """Get all production center combinations for an order"""
        try:
            combinations = db.session.query(OrderProductionCenter).filter_by(
                order_commessa=order_commessa,
                is_active=True
            ).order_by(OrderProductionCenter.created_at).all()

            result = []
            for combo in combinations:
                result.append({
                    "combination_id": combo.combination_id,
                    "production_center": combo.production_center,
                    "cutting_room": combo.cutting_room,
                    "destination": combo.destination
                })

            return {"success": True, "data": result}, 200

        except Exception as e:
            print(f"❌ Error fetching production center combinations: {str(e)}")
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/production_center_combinations/save', methods=['POST'])
class SaveOrderProductionCenterCombinations(Resource):
    def post(self):
        """Save production center combinations for an order"""
        try:
            data = request.get_json()
            order_commessa = data.get('order_commessa')
            combinations = data.get('combinations', [])

            if not order_commessa:
                return {"success": False, "msg": "order_commessa is required"}, 400

            if not combinations:
                return {"success": False, "msg": "At least one combination is required"}, 400

            # First, delete old inactive combinations to keep database clean
            deleted_inactive = db.session.query(OrderProductionCenter).filter_by(
                order_commessa=order_commessa,
                is_active=False
            ).delete()

            if deleted_inactive > 0:
                print(f"🧹 Cleaned up {deleted_inactive} inactive combinations for order {order_commessa}")

            # Deactivate existing active combinations
            db.session.query(OrderProductionCenter).filter_by(
                order_commessa=order_commessa,
                is_active=True
            ).update({"is_active": False})

            # Add new combinations
            for combo in combinations:
                combination_id = combo.get('combination_id') or str(uuid.uuid4())

                # Check if combination already exists
                existing = db.session.query(OrderProductionCenter).filter_by(
                    order_commessa=order_commessa,
                    combination_id=combination_id
                ).first()

                if existing:
                    # Reactivate and update existing combination
                    existing.production_center = combo.get('production_center')
                    existing.cutting_room = combo.get('cutting_room')
                    existing.destination = combo.get('destination')
                    existing.is_active = True
                else:
                    # Create new combination
                    new_combo = OrderProductionCenter(
                        order_commessa=order_commessa,
                        combination_id=combination_id,
                        production_center=combo.get('production_center'),
                        cutting_room=combo.get('cutting_room'),
                        destination=combo.get('destination'),
                        is_active=True
                    )
                    db.session.add(new_combo)

            db.session.commit()
            return {"success": True, "msg": "Production center combinations saved successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error saving production center combinations: {str(e)}")
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/production_center_combinations/delete/<string:order_commessa>/<string:combination_id>', methods=['DELETE'])
class DeleteOrderProductionCenterCombination(Resource):
    def delete(self, order_commessa, combination_id):
        """Delete a specific production center combination"""
        try:
            combination = db.session.query(OrderProductionCenter).filter_by(
                order_commessa=order_commessa,
                combination_id=combination_id
            ).first()

            if not combination:
                return {"success": False, "msg": "Combination not found"}, 404

            # Always hard delete the combination - frontend handles table cleanup
            db.session.delete(combination)

            db.session.commit()
            return {"success": True, "msg": "Combination deleted successfully"}, 200

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error deleting production center combination: {str(e)}")
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/audit/<string:order_commessa>')
class OrderAuditInfo(Resource):
    def get(self, order_commessa):
        """Get audit information for an order"""
        try:
            audit_record = OrderAudit.get_by_order(order_commessa)

            if not audit_record:
                return {"success": False, "msg": "No audit record found for this order"}, 404

            return {"success": True, "data": audit_record.to_dict()}, 200

        except Exception as e:
            print(f"❌ Error fetching audit info for order {order_commessa}: {str(e)}")
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/audit/update')
class UpdateOrderAudit(Resource):
    def post(self):
        """Create or update audit record for an order"""
        try:
            data = request.get_json()
            order_commessa = data.get('order_commessa')
            username = data.get('username')

            if not order_commessa:
                return {"success": False, "msg": "order_commessa is required"}, 400

            if not username:
                return {"success": False, "msg": "username is required"}, 400

            # Create or update audit record
            audit_record = OrderAudit.create_or_update(order_commessa, username)

            return {"success": True, "data": audit_record.to_dict()}, 200

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error updating audit record: {str(e)}")
            return {"success": False, "msg": str(e)}, 500


@orders_api.route('/bom/<string:order_number>')
class OrderBom(Resource):
    def get(self, order_number):
        """Get BOM (Bill of Materials) data for a specific order"""
        try:
            print(f"🔍 Fetching BOM data for order: {order_number}")

            # Check if nav_bom table exists
            table_exists = db.session.execute(text("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'nav_bom'
            """)).scalar()

            if not table_exists:
                print("⚠️ nav_bom table does not exist")
                return {
                    "success": True,
                    "data": [],
                    "message": f"BOM table not found. No BOM data available for order {order_number}"
                }, 200

            # Query nav_bom table for the specified order number
            bom_data = NavBom.query.filter_by(shortcut_dimension_2_code=order_number).all()

            print(f"📋 Found {len(bom_data)} BOM records for order {order_number}")

            if not bom_data:
                return {
                    "success": True,
                    "data": [],
                    "message": f"No BOM data found for order {order_number}"
                }, 200

            # Convert to dictionary format
            bom_list = [item.to_dict() for item in bom_data]

            return {
                "success": True,
                "data": bom_list,
                "order_number": order_number
            }, 200

        except Exception as e:
            print(f"❌ Error fetching BOM data for order {order_number}: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "msg": str(e)}, 500
