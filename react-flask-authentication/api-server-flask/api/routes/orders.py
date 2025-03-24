from flask import Blueprint, request
from flask_restx import Namespace, Resource
from api.models import OrderLinesView

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
