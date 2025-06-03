from flask import Blueprint, request, jsonify
from api.models import MarkerCalculatorData, MarkerCalculatorMarker, MarkerCalculatorQuantity, db
from flask_restx import Namespace, Resource
from sqlalchemy.exc import IntegrityError
import traceback

marker_calculator_bp = Blueprint('marker_calculator_bp', __name__)
marker_calculator_api = Namespace('marker_calculator', description="Marker Calculator Data Management")

@marker_calculator_api.route('/save', methods=['POST'])
class SaveCalculatorData(Resource):
    def post(self):
        """Save calculator data for a specific table and order"""
        try:
            data = request.get_json()
            print(f"Received data: {data}")  # Debug log

            # Validate required fields
            required_fields = ['table_id', 'order_commessa', 'selected_baseline', 'markers']
            for field in required_fields:
                if field not in data:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400

            table_id = data['table_id']
            order_commessa = data['order_commessa']
            selected_baseline = data['selected_baseline']
            markers_data = data['markers']

            # Check if calculator data already exists for this table and order
            existing_data = MarkerCalculatorData.query.filter_by(
                table_id=table_id,
                order_commessa=order_commessa
            ).first()

            if existing_data:
                # Update existing data
                existing_data.selected_baseline = selected_baseline
                calculator_data = existing_data
                
                # Delete existing markers and quantities
                for marker in existing_data.markers:
                    db.session.delete(marker)
            else:
                # Create new calculator data
                calculator_data = MarkerCalculatorData(
                    table_id=table_id,
                    order_commessa=order_commessa,
                    selected_baseline=selected_baseline
                )
                db.session.add(calculator_data)

            # Flush to get the ID
            db.session.flush()

            # Check for duplicate marker names before saving
            marker_names = [marker_data.get('marker_name', '').strip() for marker_data in markers_data]
            marker_names = [name for name in marker_names if name]  # Remove empty names

            if len(marker_names) != len(set(name.lower() for name in marker_names)):
                return {"success": False, "message": "Duplicate marker names are not allowed within the same calculator"}, 400

            # Save markers and quantities
            print(f"Processing {len(markers_data)} markers")  # Debug log
            for index, marker_data in enumerate(markers_data):
                marker_name = marker_data.get('marker_name', '').strip()

                # Use default name if empty
                if not marker_name:
                    marker_name = f"Marker {index + 1}"

                print(f"Saving marker: {marker_name}, layers: {marker_data.get('layers', 1)}")  # Debug log

                marker = MarkerCalculatorMarker(
                    calculator_data_id=calculator_data.id,
                    marker_name=marker_name,
                    layers=marker_data.get('layers', 1)
                )
                db.session.add(marker)
                db.session.flush()  # Get marker ID

                # Save quantities for this marker
                quantities = marker_data.get('quantities', {})
                print(f"Saving quantities for {marker_name}: {quantities}")  # Debug log
                for size, quantity in quantities.items():
                    # Save all quantities (including zeros) for completeness
                    try:
                        quantity_value = int(quantity) if quantity != '' else 0
                        print(f"  - Size {size}: {quantity_value}")  # Debug log
                        quantity_record = MarkerCalculatorQuantity(
                            marker_id=marker.id,
                            size=size,
                            quantity=quantity_value
                        )
                        db.session.add(quantity_record)
                    except (ValueError, TypeError):
                        print(f"  - Skipping invalid quantity for size {size}: {quantity}")  # Debug log
                        continue

            db.session.commit()
            
            return {
                "success": True,
                "message": "Calculator data saved successfully",
                "data": calculator_data.to_dict()
            }, 200

        except IntegrityError as e:
            db.session.rollback()
            return {"success": False, "message": f"Database integrity error: {str(e)}"}, 400
        except Exception as e:
            db.session.rollback()
            print(f"Error saving calculator data: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "message": f"Error saving calculator data: {str(e)}"}, 500

@marker_calculator_api.route('/load/<table_id>/<order_commessa>', methods=['GET'])
class LoadCalculatorData(Resource):
    def get(self, table_id, order_commessa):
        """Load calculator data for a specific table and order"""
        try:
            # Find calculator data
            calculator_data = MarkerCalculatorData.query.filter_by(
                table_id=table_id,
                order_commessa=order_commessa
            ).first()

            if not calculator_data:
                return {
                    "success": True,
                    "message": "No calculator data found",
                    "data": None
                }, 200

            # Build response with markers and quantities
            markers = []
            for marker in calculator_data.markers:
                quantities = {}
                for quantity in marker.quantities:
                    quantities[quantity.size] = quantity.quantity

                markers.append({
                    "id": marker.id,
                    "marker_name": marker.marker_name,
                    "layers": marker.layers,
                    "quantities": quantities
                })

            response_data = {
                "id": calculator_data.id,
                "table_id": calculator_data.table_id,
                "order_commessa": calculator_data.order_commessa,
                "selected_baseline": calculator_data.selected_baseline,
                "markers": markers,
                "created_at": calculator_data.created_at.isoformat() if calculator_data.created_at else None,
                "updated_at": calculator_data.updated_at.isoformat() if calculator_data.updated_at else None
            }

            return {
                "success": True,
                "message": "Calculator data loaded successfully",
                "data": response_data
            }, 200

        except Exception as e:
            print(f"Error loading calculator data: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "message": f"Error loading calculator data: {str(e)}"}, 500

@marker_calculator_api.route('/delete/<table_id>/<order_commessa>', methods=['DELETE'])
class DeleteCalculatorData(Resource):
    def delete(self, table_id, order_commessa):
        """Delete calculator data for a specific table and order"""
        try:
            calculator_data = MarkerCalculatorData.query.filter_by(
                table_id=table_id,
                order_commessa=order_commessa
            ).first()

            if not calculator_data:
                return {
                    "success": False,
                    "message": "Calculator data not found"
                }, 404

            db.session.delete(calculator_data)
            db.session.commit()

            return {
                "success": True,
                "message": "Calculator data deleted successfully"
            }, 200

        except Exception as e:
            db.session.rollback()
            print(f"Error deleting calculator data: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "message": f"Error deleting calculator data: {str(e)}"}, 500

@marker_calculator_api.route('/test', methods=['GET'])
class TestCalculatorTables(Resource):
    def get(self):
        """Test if calculator tables exist and are accessible"""
        try:
            # Try to query the tables to see if they exist
            calculator_count = MarkerCalculatorData.query.count()
            marker_count = MarkerCalculatorMarker.query.count()
            quantity_count = MarkerCalculatorQuantity.query.count()

            return {
                "success": True,
                "message": "Calculator tables are accessible",
                "data": {
                    "calculator_data_count": calculator_count,
                    "marker_count": marker_count,
                    "quantity_count": quantity_count
                }
            }, 200

        except Exception as e:
            print(f"Error testing calculator tables: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "message": f"Error testing calculator tables: {str(e)}"}, 500
