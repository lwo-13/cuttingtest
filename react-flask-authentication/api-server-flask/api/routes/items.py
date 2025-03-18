from flask import Blueprint, jsonify
from flask_restx import Namespace, Resource
from api.models import ZalliItemsView

zalli_bp = Blueprint("zalli", __name__)
zalli_api = Namespace("zalli", description="Zalli Items API")

@zalli_api.route("/items")
class ZalliItemsResource(Resource):
    def get(self):
        """Fetch all items from the Zalli view"""
        try:
            items = ZalliItemsView.query.all()
            return jsonify([item.to_dict() for item in items])
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
