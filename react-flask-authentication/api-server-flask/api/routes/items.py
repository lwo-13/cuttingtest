from flask import Blueprint, jsonify
from flask_restx import Namespace, Resource
from api.models import ZalliItemsView, ItemDescriptions

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

@zalli_api.route("/get_brand/<string:style_code>")
class ZalliGetBrandResource(Resource):
    def get(self, style_code):
        """Fetch the brand by style_code (item_no)"""
        try:
            item = ZalliItemsView.query.filter_by(item_no=style_code).first()
            if item:
                return {"success": True, "brand": item.brand}
            else:
                return {"success": False, "msg": "Style not found"}
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@zalli_api.route("/item-descriptions")
class ItemDescriptionsResource(Resource):
    def get(self):
        """Fetch all distinct Item Descriptions (Code and Description)"""
        try:
            # Query distinct values as specified in the SQL
            items = ItemDescriptions.query.filter(
                ItemDescriptions.Code.isnot(None),
                ItemDescriptions.Description.isnot(None)
            ).distinct().all()

            return {
                "success": True,
                "data": [item.to_dict() for item in items]
            }
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500