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