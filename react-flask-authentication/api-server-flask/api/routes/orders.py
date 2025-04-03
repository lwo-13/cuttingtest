from flask import Blueprint, request
from flask_restx import Namespace, Resource
from api.models import db, OrderLinesView, OrderRatio

# ✅ Create Blueprint and API instance
orders_bp = Blueprint('orders', __name__)
orders_api = Namespace('orders', description="Order Management")

@orders_api.route('/order_lines')
class OrderLines(Resource):
    def get(self):
        try:
            # Optionally filter by order_commessa if provided as a query parameter.
            order_commessa = request.args.get('order_commessa')
            query = OrderLinesView.query
            if order_commessa:
                query = query.filter_by(order_commessa=order_commessa)
            
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

@orders_api.route('/sync_all_ratios')
class SyncAllRatios(Resource):
    def post(self):
        try:

            # Step 1: Get all orders that start with 25
            order_lines = OrderLinesView.query.filter(OrderLinesView.order_commessa.startswith("25")).all()

            # Step 2: Group by order_commessa
            grouped = {}
            for line in order_lines:
                if line.order_commessa not in grouped:
                    grouped[line.order_commessa] = []
                grouped[line.order_commessa].append(line)

            # Step 3: Sync each group
            for order_commessa, lines in grouped.items():
                total_qty = sum(line.quantity for line in lines if line.quantity)

                for line in lines:
                    size = line.size
                    qty = line.quantity or 0
                    real_ratio = qty / total_qty if total_qty else 0

                    ratio = OrderRatio.query.get((order_commessa, size))
                    if not ratio:
                        ratio = OrderRatio(
                            order_commessa=order_commessa,
                            size=size,
                            theoretical_ratio=0.0  # to be filled later
                        )

                    ratio.quantity = qty
                    ratio.real_ratio = real_ratio
                    db.session.add(ratio)

            db.session.commit()
            return {"success": True, "msg": "All ratios synced for orders starting with '25'"}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
        
@orders_api.route('/ratios/todo')
class GetRatiosToDo(Resource):
    def get(self):
        try:
            # Get all order_commessa where any theoretical_ratio is NULL or 0
            from sqlalchemy import or_

            incomplete_orders = (
                db.session.query(OrderRatio.order_commessa)
                .filter(or_(OrderRatio.theoretical_ratio == 0.0, OrderRatio.theoretical_ratio == None))
                .distinct()
                .all()
            )

            commesse_list = [row.order_commessa for row in incomplete_orders]

            return {"success": True, "orders": commesse_list}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@orders_api.route('/ratios/<string:order_commessa>')
class GetOrderRatios(Resource):
    def get(self, order_commessa):
        try:
            ratios = OrderRatio.query.filter_by(order_commessa=order_commessa).all()
            data = [r.to_dict() for r in ratios]

            return {"success": True, "data": data}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
               
@orders_api.route('/ratios/update')
class UpdateOrderRatios(Resource):
    def patch(self):
        try:
            payload = request.get_json()
            ratios = payload.get("data", [])

            for row in ratios:
                ratio = OrderRatio.query.get((row["order_commessa"], row["size"]))
                if ratio:
                    ratio.theoretical_ratio = row["theoretical_ratio"]

            db.session.commit()
            return {"success": True, "msg": "Ratios updated"}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500