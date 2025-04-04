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
        
@orders_api.route('/order_lines/without_ratios')
class OrdersWithoutRatios(Resource):
    def get(self):
        try:
            all_orders = db.session.query(OrderLinesView.order_commessa)\
                .filter(OrderLinesView.order_commessa.like('25%')).distinct().all()
            all_orders_set = {row[0] for row in all_orders}

            existing_orders = db.session.query(OrderRatio.order_commessa).distinct().all()
            existing_orders_set = {row[0] for row in existing_orders}

            orders_to_do = list(all_orders_set - existing_orders_set)

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