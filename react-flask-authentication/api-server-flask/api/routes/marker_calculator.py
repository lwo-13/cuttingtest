from flask import Blueprint, request, jsonify
from api.models import MarkerCalculatorData, MarkerCalculatorMarker, MarkerCalculatorQuantity, db
from flask_restx import Namespace, Resource
from sqlalchemy.exc import IntegrityError, OperationalError
import time
import traceback

marker_calculator_bp = Blueprint('marker_calculator_bp', __name__)
marker_calculator_api = Namespace('marker_calculator', description="Marker Calculator Data Management")

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

def generate_marker_name(marker_data, style):
    """Generate a marker name based on style and quantities"""
    quantities = marker_data.get('quantities', {})

    # Filter out zero quantities and build the name
    non_zero_quantities = []
    for size, qty in quantities.items():
        try:
            qty_value = int(qty) if qty != '' else 0
            if qty_value > 0:
                non_zero_quantities.append(f"{qty_value}{size}")
        except (ValueError, TypeError):
            continue

    # Build the marker name (matching client-side behavior - no index suffix)
    if non_zero_quantities:
        quantities_str = "".join(non_zero_quantities)
        return f"{style}-{quantities_str}"
    else:
        # Return empty string if no quantities (matching client-side behavior)
        return ""

@marker_calculator_api.route('/save', methods=['POST'])
class SaveCalculatorData(Resource):
    def post(self):
        """Save calculator data for a specific table and order"""
        try:
            data = request.get_json()

            # Validate required fields
            required_fields = ['order_commessa', 'tab_number', 'selected_baseline', 'markers']
            for field in required_fields:
                if field not in data:
                    return {"success": False, "message": f"Missing required field: {field}"}, 400

            order_commessa = data['order_commessa']
            tab_number = data['tab_number']
            selected_baseline = data['selected_baseline']
            style = data.get('style', 'STYLE')  # Default to 'STYLE' if not provided
            markers_data = data['markers']

            # Check if calculator data already exists for this order and tab
            existing_data = MarkerCalculatorData.query.filter_by(
                order_commessa=order_commessa,
                tab_number=tab_number
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
                    order_commessa=order_commessa,
                    tab_number=tab_number,
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
            for index, marker_data in enumerate(markers_data):
                marker_name = marker_data.get('marker_name', '').strip()

                # Use default name if empty - generate based on style and quantities
                if not marker_name:
                    marker_name = generate_marker_name(marker_data, style)

                marker = MarkerCalculatorMarker(
                    calculator_data_id=calculator_data.id,
                    marker_name=marker_name,
                    marker_width=marker_data.get('marker_width'),
                    layers=marker_data.get('layers', 1)
                )
                db.session.add(marker)
                db.session.flush()  # Get marker ID

                # Save quantities for this marker
                quantities = marker_data.get('quantities', {})
                for size, quantity in quantities.items():
                    # Save all quantities (including zeros) for completeness
                    try:
                        quantity_value = int(quantity) if quantity != '' else 0
                        quantity_record = MarkerCalculatorQuantity(
                            marker_id=marker.id,
                            size=size,
                            quantity=quantity_value
                        )
                        db.session.add(quantity_record)
                    except (ValueError, TypeError):
                        # Skip invalid quantity values
                        continue

            def commit_operation():
                db.session.commit()
                return calculator_data

            # Execute commit with deadlock retry
            result_data = retry_on_deadlock(commit_operation)

            return {
                "success": True,
                "message": "Calculator data saved successfully",
                "data": result_data.to_dict()
            }, 200

        except IntegrityError as e:
            db.session.rollback()
            return {"success": False, "message": f"Database integrity error: {str(e)}"}, 400
        except Exception as e:
            db.session.rollback()
            error_msg = str(e)
            print(f"Error saving calculator data: {error_msg}")
            print(traceback.format_exc())

            # Check if it's a deadlock error and provide user-friendly message
            if '1205' in error_msg or 'deadlock' in error_msg.lower():
                return {"success": False, "message": "Database is busy, please try again in a moment."}, 503
            else:
                return {"success": False, "message": f"Error saving calculator data: {error_msg}"}, 500

@marker_calculator_api.route('/load/<order_commessa>', methods=['GET'])
class LoadCalculatorData(Resource):
    def get(self, order_commessa):
        """Load calculator data for all tabs of a specific order"""
        try:
            # Find all calculator data for this order
            calculator_data_list = MarkerCalculatorData.query.filter_by(
                order_commessa=order_commessa
            ).all()

            if not calculator_data_list:
                return {
                    "success": True,
                    "message": "No calculator data found",
                    "data": {}
                }, 200

            # Build response with data organized by tab
            tabs_data = {}

            for calculator_data in calculator_data_list:
                # Build markers for this tab
                markers = []
                for marker in calculator_data.markers:
                    quantities = {}
                    for quantity in marker.quantities:
                        quantities[quantity.size] = quantity.quantity

                    markers.append({
                        "id": marker.id,
                        "marker_name": marker.marker_name,
                        "marker_width": marker.marker_width,
                        "layers": marker.layers,
                        "quantities": quantities
                    })

                # Store tab data
                tabs_data[calculator_data.tab_number] = {
                    "id": calculator_data.id,
                    "order_commessa": calculator_data.order_commessa,
                    "tab_number": calculator_data.tab_number,
                    "selected_baseline": calculator_data.selected_baseline,
                    "markers": markers,
                    "created_at": calculator_data.created_at.isoformat() if calculator_data.created_at else None,
                    "updated_at": calculator_data.updated_at.isoformat() if calculator_data.updated_at else None
                }

            return {
                "success": True,
                "message": "Calculator data loaded successfully",
                "data": tabs_data
            }, 200

        except Exception as e:
            print(f"Error loading calculator data: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "message": f"Error loading calculator data: {str(e)}"}, 500

@marker_calculator_api.route('/delete/<order_commessa>/<tab_number>', methods=['DELETE'])
class DeleteCalculatorData(Resource):
    def delete(self, order_commessa, tab_number):
        """Delete calculator data for a specific order and tab"""
        try:
            calculator_data = MarkerCalculatorData.query.filter_by(
                order_commessa=order_commessa,
                tab_number=tab_number
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
