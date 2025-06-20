from flask import Blueprint, jsonify
from flask_restx import Namespace, Resource
from api.models import db, Mattresses, MattressMarker
from collections import defaultdict
from sqlalchemy import text

navision_bp = Blueprint('navision', __name__)
navision_api = Namespace('navision', description="Width Validation & Navision Integration")



def fetch_handling_units_from_view():
    """Fetch handling units from View_PickedHandlingUnits with width > 0"""
    try:
        query = text("""
        SELECT
            [Entry No_],
            [Item No_],
            [Description],
            [Bin Code],
            [Quantity],
            [Unit of Measure Code],
            [Width],
            [Length],
            [Status],
            [Order Commessa],
            [HU No_],
            [Batch_Dye lot]
        FROM [View_PickedHandlingUnits]
        WHERE [Width] > 0 AND [Width] IS NOT NULL
        """)

        result = db.session.execute(query)
        rows = result.fetchall()

        # Convert to list of dictionaries
        handling_units = []
        for row in rows:
            handling_units.append({
                'entry_no': row[0],
                'item_no': row[1],
                'description': row[2],
                'bin_code': row[3],
                'quantity': float(row[4]) if row[4] else 0.0,
                'unit_of_measure_code': row[5],
                'width': float(row[6]) if row[6] else 0.0,
                'length': float(row[7]) if row[7] else 0.0,
                'status': row[8],
                'order_commessa': row[9],
                'hu_no': row[10],
                'batch_dye_lot': row[11]
            })

        return handling_units

    except Exception:
        return None

@navision_api.route('/test')
class NavisionTest(Resource):
    def get(self):
        """Test endpoint to verify Navision API is working"""
        try:
            handling_units = fetch_handling_units_from_view()
            if handling_units is not None:
                connection_status = "success"
                count = len(handling_units)
            else:
                connection_status = "failed"
                count = 0
        except Exception as e:
            connection_status = f"error: {str(e)}"
            count = 0

        return {
            "success": True,
            "message": "Navision API is working",
            "view_connection": connection_status,
            "handling_units_count": count,
            "timestamp": "2025-01-18"
        }, 200

@navision_api.route('/handling_units')
class HandlingUnits(Resource):
    def get(self):
        """Fetch all picked handling units with width > 0 from View_PickedHandlingUnits"""
        try:
            handling_units = fetch_handling_units_from_view()

            if handling_units is None:
                return {
                    "success": False,
                    "message": "Failed to fetch handling units from View_PickedHandlingUnits",
                    "instructions": "Check database connection and view access"
                }, 500

            return {
                "success": True,
                "data": handling_units,
                "count": len(handling_units),
                "source": "View_PickedHandlingUnits"
            }, 200

        except Exception as e:
            return {
                "success": False,
                "message": f"Error fetching handling units: {str(e)}"
            }, 500

@navision_api.route('/width_validation')
class WidthValidation(Resource):
    def get(self):
        """Compare planned vs actual widths - notify planners when Specula measurements differ from planned widths"""
        try:
            # Step 1: Fetch Navision Handling Unit data
            navision_data = fetch_handling_units_from_view()

            if navision_data is None:
                # Use test data for development if view is not accessible
                navision_data = [
                    {
                        "width": 150.0,
                        "item_no": "TEST001",
                        "description": "Test Fabric 1",
                        "order_commessa": "24TEST001"
                    },
                    {
                        "width": 140.0,
                        "item_no": "TEST002",
                        "description": "Test Fabric 2",
                        "order_commessa": "24TEST002"
                    }
                ]
                data_source = "test_data"
            else:
                data_source = "View_PickedHandlingUnits"

            # Step 2: Group Navision data by order_commessa
            navision_by_order = defaultdict(list)
            for unit in navision_data:
                order_commessa = unit.get('order_commessa')
                width = unit.get('width')
                item_no = unit.get('item_no')
                description = unit.get('description')

                if order_commessa and width:
                    navision_by_order[order_commessa].append({
                        'width': float(width),
                        'item_no': item_no,
                        'description': description,
                        'entry_no': unit.get('entry_no'),
                        'bin_code': unit.get('bin_code'),
                        'quantity': unit.get('quantity', 0),
                        'unit_of_measure_code': unit.get('unit_of_measure_code'),
                        'length': unit.get('length', 0),
                        'status': unit.get('status'),
                        'hu_no': unit.get('hu_no'),
                        'batch_dye_lot': unit.get('batch_dye_lot')
                    })

            # Step 3: Fetch cutting room mattress width data with bagno information
            # Let's check all possible bagno fields to find where it's actually stored
            mattress_query = db.session.query(
                Mattresses.order_commessa,
                MattressMarker.marker_width,
                Mattresses.mattress,
                Mattresses.fabric_code,
                Mattresses.fabric_color,
                Mattresses.dye_lot,  # Check if bagno is here
                Mattresses.id  # Get mattress ID to join with details
            ).join(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).filter(
                Mattresses.order_commessa.in_(list(navision_by_order.keys()))
            ).all()



            # Step 4: Group cutting room data by order_commessa
            cutting_room_by_order = defaultdict(list)
            for row in mattress_query:
                cutting_room_by_order[row.order_commessa].append({
                    'width': float(row.marker_width),
                    'mattress': row.mattress,
                    'fabric_code': row.fabric_code,
                    'fabric_color': row.fabric_color,
                    'bagno': row.dye_lot  # Store bagno for matching
                })

            # Step 5: Compare and generate width change notifications
            # Only include orders that have BOTH planned (cutting room) AND actual (Navision) widths
            validation_results = []

            for order_commessa in navision_by_order.keys():
                # Only process orders that have cutting room data (planned widths)
                if order_commessa not in cutting_room_by_order:
                    continue  # Skip orders without cutting room planning

                navision_widths = [item['width'] for item in navision_by_order[order_commessa]]
                cutting_room_widths = [item['width'] for item in cutting_room_by_order[order_commessa]]

                # Get unique widths for comparison
                navision_unique = sorted(list(set(navision_widths)))  # Actual widths (from Specula)
                cutting_room_unique = sorted(list(set(cutting_room_widths)))  # Planned widths

                # Determine status - focus on actionable changes for planners
                if set(navision_unique) == set(cutting_room_unique):
                    status = "no_change"
                    priority = 3
                else:
                    # Will be updated after width_changes analysis
                    status = "width_changed"
                    priority = 1

                # Calculate width differences - Match by BAGNO (last 4 digits of HU No vs mattress bagno)
                # This gives us the exact correlation between planned mattresses and measured handling units
                width_changes = []

                # Helper function to extract last 4 digits from Navision batch/dye lot
                def extract_bagno_from_navision_batch(batch_dye_lot):
                    if not batch_dye_lot:
                        return None
                    # Extract last 4 digits from Navision batch/dye lot
                    batch_str = str(batch_dye_lot)
                    if len(batch_str) >= 4:
                        return batch_str[-4:]
                    return batch_str

                # Helper function to extract bagno digits from mattress bagno
                def extract_bagno_from_mattress(bagno):
                    if not bagno:
                        return None
                    # Users often write only last 4 digits, so extract them
                    bagno_str = str(bagno)
                    if len(bagno_str) >= 4:
                        return bagno_str[-4:]
                    return bagno_str

                # Group mattresses by bagno for comparison
                mattresses_by_bagno = defaultdict(list)
                for item in cutting_room_by_order[order_commessa]:
                    bagno = extract_bagno_from_mattress(item['bagno'])
                    if bagno:
                        mattresses_by_bagno[bagno].append(item)

                # Group Navision handling units by bagno (last 4 digits of batch/dye lot)
                navision_by_bagno = defaultdict(list)
                for item in navision_by_order[order_commessa]:
                    bagno = extract_bagno_from_navision_batch(item['batch_dye_lot'])
                    if bagno:
                        navision_by_bagno[bagno].append(item)

                # For each bagno in mattresses, find matching handling units and compare widths
                for bagno in mattresses_by_bagno.keys():
                    if bagno not in navision_by_bagno:
                        # This bagno has no Specula measurements - skip
                        continue

                    # Get planned widths for this bagno
                    planned_items = mattresses_by_bagno[bagno]
                    planned_widths = [item['width'] for item in planned_items]
                    planned_unique = sorted(list(set(planned_widths)))

                    # Get actual widths for this bagno
                    actual_items = navision_by_bagno[bagno]
                    actual_widths = [item['width'] for item in actual_items]

                    # Get fabric info for context
                    fabric_codes = list(set([item['fabric_code'] for item in planned_items]))
                    fabric_code = fabric_codes[0] if fabric_codes else 'Unknown'

                    # Compare each planned width against actual widths for this bagno
                    for planned_width in planned_unique:
                        # Count how many measurements match the planned width exactly
                        exact_matches = [w for w in actual_widths if w == planned_width]
                        total_measurements = len(actual_widths)
                        non_matching = total_measurements - len(exact_matches)

                        # Calculate percentage of measurements that match planned width
                        match_percentage = len(exact_matches) / total_measurements if total_measurements > 0 else 0

                        # Determine severity based on cutting room manager's workflow:
                        # - 1-2 rolls different: WARNING (can create new mattresses/markers)
                        # - Majority different: ERROR (requires planner action)

                        if match_percentage < 0.5:
                            # CRITICAL ERROR: Majority of measurements don't match planned width
                            severity = "error"
                            from collections import Counter
                            width_counts = Counter(actual_widths)
                            most_common_actual = width_counts.most_common(1)[0][0]
                            difference = most_common_actual - planned_width
                            actual_width_for_message = most_common_actual

                        elif non_matching > 0 and non_matching <= 2:
                            # WARNING: Only 1-2 rolls different (cutting room can handle)
                            severity = "warning"
                            # Find the different width(s)
                            different_widths = [w for w in actual_widths if w != planned_width]
                            from collections import Counter
                            different_width_counts = Counter(different_widths)
                            most_common_different = different_width_counts.most_common(1)[0][0] if different_widths else planned_width
                            difference = most_common_different - planned_width
                            actual_width_for_message = most_common_different

                        elif non_matching > 2:
                            # ERROR: More than 2 rolls different (requires planner attention)
                            severity = "error"
                            from collections import Counter
                            width_counts = Counter(actual_widths)
                            most_common_actual = width_counts.most_common(1)[0][0]
                            difference = most_common_actual - planned_width
                            actual_width_for_message = most_common_actual
                        else:
                            # All measurements match - no issue
                            continue

                        # Get mattress names for context
                        mattress_names = [item['mattress'] for item in planned_items if item['width'] == planned_width]

                        # Create appropriate message based on severity
                        if severity == "warning":
                            message = f'Bagno {bagno} ({fabric_code}): {non_matching} roll(s) measured {actual_width_for_message}cm instead of planned {planned_width}cm - Consider creating new mattresses/markers'
                        else:
                            message = f'Bagno {bagno} ({fabric_code}): {non_matching}/{total_measurements} measurements don\'t match planned {planned_width}cm - Requires planner review'

                        width_changes.append({
                            'planned': planned_width,
                            'actual': actual_width_for_message,
                            'difference': round(difference, 1),
                            'fabric_code': fabric_code,
                            'bagno': bagno,
                            'mattresses': mattress_names,
                            'severity': severity,  # "warning" or "error"
                            'match_percentage': round(match_percentage * 100, 1),
                            'total_measurements': total_measurements,
                            'matching_measurements': len(exact_matches),
                            'non_matching_measurements': non_matching,
                            'message': message
                        })



                # Update status based on severity of width changes
                if width_changes:
                    # Check if any changes are errors (not just warnings)
                    has_errors = any(change.get('severity') == 'error' for change in width_changes)
                    has_warnings = any(change.get('severity') == 'warning' for change in width_changes)

                    if has_errors:
                        status = "width_error"
                        priority = 1  # High priority - requires planner action
                    elif has_warnings:
                        status = "width_warning"
                        priority = 2  # Medium priority - cutting room can handle
                    else:
                        status = "width_changed"
                        priority = 1
                elif set(navision_unique) != set(cutting_room_unique):
                    # Fallback for any other width differences
                    status = "width_changed"
                    priority = 1

                # Note: We don't care about Navision widths that aren't planned in mattresses
                # Those are irrelevant to the planner for this order

                # Generate batch summary - ONLY for bagnos that are planned in mattresses
                batch_summary = {}

                # Only process Navision items that match planned mattress bagnos
                for planned_bagno in mattresses_by_bagno.keys():
                    if planned_bagno in navision_by_bagno:
                        # Process all Navision items for this planned bagno
                        for item in navision_by_bagno[planned_bagno]:
                            batch = item.get('batch_dye_lot', 'Unknown Batch')
                            width = item['width']
                            bin_code = item.get('bin_code', 'Unknown Location')
                            hu_no = item.get('hu_no', 'Unknown HU')
                            quantity = item.get('quantity', 0)

                            if batch not in batch_summary:
                                batch_summary[batch] = {
                                    'batch': batch,
                                    'bagno': planned_bagno,  # Add the matched bagno for reference
                                    'widths': [],
                                    'locations': set(),
                                    'handling_units': set(),
                                    'total_quantity': 0,
                                    'measurements_count': 0
                                }

                            batch_summary[batch]['widths'].append(width)
                            batch_summary[batch]['locations'].add(bin_code)
                            batch_summary[batch]['handling_units'].add(hu_no)
                            batch_summary[batch]['total_quantity'] += quantity
                            batch_summary[batch]['measurements_count'] += 1

                # Convert sets to lists and calculate averages
                for batch_info in batch_summary.values():
                    batch_info['locations'] = list(batch_info['locations'])
                    batch_info['handling_units'] = list(batch_info['handling_units'])
                    batch_info['avg_width'] = round(sum(batch_info['widths']) / len(batch_info['widths']), 1)
                    batch_info['width_range'] = f"{min(batch_info['widths'])}-{max(batch_info['widths'])}" if len(set(batch_info['widths'])) > 1 else str(batch_info['widths'][0])
                    # Fix floating point precision errors in total_quantity
                    batch_info['total_quantity'] = round(batch_info['total_quantity'], 2)

                # Filter Navision items to only show measurements for planned bagnos
                planned_navision_items = []
                for planned_bagno in mattresses_by_bagno.keys():
                    if planned_bagno in navision_by_bagno:
                        planned_navision_items.extend(navision_by_bagno[planned_bagno])

                # Only include orders with width warnings or errors (skip "no_change")
                if status in ["width_warning", "width_error", "width_changed"]:
                    validation_results.append({
                        'order_commessa': order_commessa,
                        'planned_widths': cutting_room_unique,  # What planners expected
                        'actual_widths': navision_unique,       # What Specula measured
                        'status': status,
                        'priority': priority,
                        'width_changes': width_changes,
                        'batch_summary': list(batch_summary.values()),  # Who measured what where (planned bagnos only)
                        'navision_items': planned_navision_items,  # Only measurements for planned bagnos
                        'cutting_room_items': cutting_room_by_order[order_commessa]
                    })

            # Sort results by priority (width changes first) and then by order_commessa
            validation_results.sort(key=lambda x: (x['priority'], x['order_commessa']))

            return {
                "success": True,
                "data": validation_results,
                "summary": {
                    "total_orders_with_both_data": len(validation_results),
                    "width_changes": len([r for r in validation_results if r['status'] == 'width_changed']),
                    "no_changes": len([r for r in validation_results if r['status'] == 'no_change']),
                    "total_navision_orders": len(navision_by_order),
                    "orders_without_cutting_plan": len(navision_by_order) - len(validation_results)
                },
                "data_source": data_source,
                "workflow_note": "Showing orders where Specula measurements differ from planned widths"
            }, 200

        except Exception as e:
            return {
                "success": False,
                "message": f"Error performing width validation: {str(e)}"
            }, 500

@navision_api.route('/width_validation/count')
class WidthValidationCount(Resource):
    def get(self):
        """Get count of width changes requiring planner attention for badge notifications"""
        try:
            # Fetch validation data
            navision_data = fetch_handling_units_from_view()

            if navision_data is None:
                return {"success": True, "count": 0}, 200

            # Group Navision data by order_commessa
            navision_by_order = defaultdict(list)
            for unit in navision_data:
                order_commessa = unit.get('order_commessa')
                width = unit.get('width')
                if order_commessa and width:
                    navision_by_order[order_commessa].append(float(width))

            # Fetch cutting room data
            mattress_query = db.session.query(
                Mattresses.order_commessa,
                MattressMarker.marker_width
            ).join(
                MattressMarker, Mattresses.id == MattressMarker.mattress_id
            ).filter(
                Mattresses.order_commessa.in_(list(navision_by_order.keys()))
            ).all()

            # Group cutting room data
            cutting_room_by_order = defaultdict(list)
            for row in mattress_query:
                cutting_room_by_order[row.order_commessa].append(float(row.marker_width))

            # Count width changes requiring planner attention
            width_change_count = 0
            for order_commessa in navision_by_order.keys():
                # Only count orders that have cutting room data (planned widths)
                if order_commessa not in cutting_room_by_order:
                    continue

                navision_widths = list(set(navision_by_order[order_commessa]))
                cutting_room_widths = list(set(cutting_room_by_order[order_commessa]))

                # Count as width change if actual differs from planned
                if set(navision_widths) != set(cutting_room_widths):
                    width_change_count += 1

            return {"success": True, "count": width_change_count}, 200

        except Exception as e:
            return {"success": False, "count": 0, "error": str(e)}, 500

# Basic Flask route for fallback
@navision_bp.route('/width_validation_basic')
def width_validation_basic():
    return jsonify({
        "success": True,
        "data": [
            {
                "order_commessa": "24TEST001",
                "navision_widths": [150.0],
                "cutting_room_widths": [150.0],
                "status": "match",
                "navision_items": [{"width": 150.0, "item_no": "TEST001", "description": "Test Fabric"}],
                "cutting_room_items": [{"width": 150.0, "mattress": "M001", "fabric_code": "FC001", "fabric_color": "Blue"}]
            }
        ],
        "summary": {
            "total_orders": 1,
            "matches": 1,
            "mismatches": 0,
            "missing_navision": 0,
            "missing_cutting_room": 0
        },
        "data_source": "basic_flask_route"
    })
