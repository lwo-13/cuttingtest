from flask import Blueprint, request
from flask_restx import Namespace, Resource
from api.models import db, MarkerHeader, MarkerLine, MarkerLineRotation, MattressMarker
from sqlalchemy import func
import json
import xml.etree.ElementTree as ET
import os
import logging

# Create Blueprint and API instance
markers_bp = Blueprint('markers', __name__)
markers_api = Namespace('markers', description="Marker Management")

# ===================== Marker Headers ==========================
@markers_api.route('/marker_headers', methods=['GET'])
class MarkerHeaders(Resource):
    def get(self):
        try:
            headers = MarkerHeader.query.filter_by(status='ACTIVE').all()
            result = []
            for header in headers:
                # Check if marker is being used in any mattresses
                usage_count = db.session.query(func.count(MattressMarker.id)).filter(
                    MattressMarker.marker_id == header.id
                ).scalar()

                result.append({
                    "id": header.id,
                    "marker_name": header.marker_name,
                    "marker_width": header.marker_width,
                    "marker_length": header.marker_length,
                    "fabric_code": header.fabric_code,
                    "fabric_type": header.fabric_type,
                    "efficiency": header.efficiency,
                    "total_pcs": header.total_pcs,
                    "creation_type": header.creation_type,
                    "model": header.model,
                    "variant": header.variant,
                    "usage_count": usage_count
                })

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

# ===================== Marker Headers Paginated ==========================
@markers_api.route('/marker_headers_paginated', methods=['GET'])
class MarkerHeadersPaginated(Resource):
    def get(self):
        """Fetch marker headers with pagination support for improved performance.

        Query parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 500, max: 1000)
        - search: Search term for filtering
        """
        try:
            print(f"[DEBUG] Marker API called with page={request.args.get('page')}, per_page={request.args.get('per_page')}, search={request.args.get('search')}")
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 500, type=int), 999999)  # No practical limit - fetch all markers
            search_term = request.args.get('search', '', type=str).strip()

            # Base query for ALL markers (ACTIVE and NOT ACTIVE)
            query = MarkerHeader.query

            # Add search filtering if search term provided
            if search_term:
                search_filter = f"%{search_term.lower()}%"
                query = query.filter(
                    db.or_(
                        MarkerHeader.marker_name.ilike(search_filter),
                        MarkerHeader.fabric_code.ilike(search_filter),
                        MarkerHeader.fabric_type.ilike(search_filter),
                        MarkerHeader.model.ilike(search_filter),
                        MarkerHeader.variant.ilike(search_filter)
                    )
                )

            # Get total count for pagination
            total_count = query.count()
            print(f"[DEBUG] Total count: {total_count}")

            # Get paginated results ordered by creation date (newest first)
            headers = query.order_by(
                MarkerHeader.id.desc()  # Order by ID descending (newest first)
            ).offset((page - 1) * per_page).limit(per_page).all()
            print(f"[DEBUG] Found {len(headers)} headers")

            # Optimized usage count calculation - batch query to avoid N+1 problem
            marker_ids = [header.id for header in headers]
            usage_counts = {}

            if marker_ids:
                try:
                    print(f"[DEBUG] Checking usage for {len(marker_ids)} markers")

                    # First, let's check if there are any mattress markers at all
                    total_mattress_markers = db.session.query(func.count(MattressMarker.id)).scalar()
                    print(f"[DEBUG] Total mattress markers in database: {total_mattress_markers}")

                    # SQL Server-compatible approach: Use a subquery instead of large IN clause
                    # Create a temporary table-like structure using VALUES
                    if len(marker_ids) > 1000:
                        # For very large lists, process in batches to avoid SQL Server limits
                        print(f"[DEBUG] Processing {len(marker_ids)} markers in batches")
                        usage_counts = {}
                        batch_size = 500

                        for i in range(0, len(marker_ids), batch_size):
                            batch_ids = marker_ids[i:i + batch_size]
                            print(f"[DEBUG] Processing batch {i//batch_size + 1}: {len(batch_ids)} markers")

                            batch_results = db.session.query(
                                MattressMarker.marker_id,
                                func.count(MattressMarker.id).label('usage_count')
                            ).filter(
                                MattressMarker.marker_id.in_(batch_ids)
                            ).group_by(MattressMarker.marker_id).all()

                            # Add batch results to main dictionary
                            for marker_id, count in batch_results:
                                usage_counts[marker_id] = count

                        print(f"[DEBUG] Loaded usage counts for {len(usage_counts)} markers from batches")
                    else:
                        # For smaller lists, use the original approach
                        usage_results = db.session.query(
                            MattressMarker.marker_id,
                            func.count(MattressMarker.id).label('usage_count')
                        ).filter(
                            MattressMarker.marker_id.in_(marker_ids)
                        ).group_by(MattressMarker.marker_id).all()

                        usage_counts = {marker_id: count for marker_id, count in usage_results}
                        print(f"[DEBUG] Loaded usage counts for {len(usage_counts)} markers")

                except Exception as e:
                    print(f"[WARNING] Usage count query failed: {e}")
                    import traceback
                    traceback.print_exc()
                    # Continue without usage counts if query fails
                    usage_counts = {}

            # Build result with optimized usage count lookup
            result = []
            for header in headers:
                # Get usage count from pre-calculated dictionary (defaults to 0)
                usage_count = usage_counts.get(header.id, 0)

                result.append({
                    "id": header.id,
                    "marker_name": header.marker_name,
                    "marker_width": header.marker_width,
                    "marker_length": header.marker_length,
                    "fabric_code": header.fabric_code,
                    "fabric_type": header.fabric_type,
                    "efficiency": header.efficiency,
                    "total_pcs": header.total_pcs,
                    "creation_type": header.creation_type,
                    "model": header.model,
                    "variant": header.variant,
                    "status": header.status,  # Add status field
                    "usage_count": usage_count
                })

            print(f"[DEBUG] Built result with {len(result)} items")

            # Calculate pagination metadata
            total_pages = (total_count + per_page - 1) // per_page
            has_next = page < total_pages
            has_prev = page > 1

            pagination_info = {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }

            return {
                "success": True,
                "data": result,
                "pagination": pagination_info
            }, 200

        except Exception as e:
            print(f"[ERROR] Exception in marker_headers_paginated: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"Database error: {str(e)}"}, 500

# ===================== Marker Headers Planning ==========================
@markers_api.route('/marker_headers_planning', methods=['GET'])
class MarkerHeadersPlanning(Resource):
    def normalize_size(self, size):
        """
        Normalize size format to handle different formatting between order sizes and marker sizes.
        Examples:
        - "3-4" -> "3_4"
        - "4-5" -> "4_5"
        - "S" -> "S" (unchanged)
        - "3_4" -> "3_4" (unchanged)
        """
        if not size:
            return size
        # Replace hyphens with underscores for consistency
        return size.replace('-', '_')

    def get(self):
        try:
            selected_style = request.args.get('style')  # 🔍 Get style from query parameters
            sizes_param = request.args.get('sizes')
            order_commessa = request.args.get('order_commessa')  # 🔍 Get order commessa for previously selected markers

            if not selected_style:
                return {"success": False, "msg": "Missing required style parameter"}, 400

            # Convert comma-separated sizes into a clean set and normalize them
            allowed_sizes = set()
            if sizes_param:
                raw_sizes = set(size.strip() for size in sizes_param.split(',') if size.strip())
                allowed_sizes = set(self.normalize_size(size) for size in raw_sizes)

            # ✅ Fetch ACTIVE markers matching the style
            active_headers = MarkerHeader.query.filter(
                MarkerHeader.status == 'ACTIVE',
                MarkerHeader.model.ilike(f"%{selected_style}%")  # Case-insensitive search
            ).all()

            # ✅ Fetch previously selected markers for this order (even if NOT ACTIVE)
            previously_selected_headers = []
            if order_commessa:
                # Get marker IDs that are used in mattresses for this order
                from api.models import Mattresses, MattressMarker
                used_marker_ids = db.session.query(MattressMarker.marker_id).join(
                    Mattresses, MattressMarker.mattress_id == Mattresses.id
                ).filter(
                    Mattresses.order_commessa == order_commessa
                ).distinct().all()

                if used_marker_ids:
                    marker_ids = [row.marker_id for row in used_marker_ids]
                    previously_selected_headers = MarkerHeader.query.filter(
                        MarkerHeader.id.in_(marker_ids),
                        MarkerHeader.status == 'NOT ACTIVE',  # Only get NOT ACTIVE ones (ACTIVE ones are already included above)
                        MarkerHeader.model.ilike(f"%{selected_style}%")
                    ).all()

            # Combine both lists and remove duplicates
            all_headers = active_headers + previously_selected_headers

            result = []

            for header in all_headers:
                # ✅ Fetch Marker Lines for the current header
                marker_lines = MarkerLine.query.filter_by(marker_header_id=header.id).all()

                # ✅ Extract sizes used in this marker and normalize them
                raw_marker_sizes = set(line.size for line in marker_lines)
                marker_sizes = set(self.normalize_size(size) for size in raw_marker_sizes)

                # ✅ If sizes were provided, skip this marker if it uses a size not in the list
                if allowed_sizes and not marker_sizes.issubset(allowed_sizes):
                    continue

                # ✅ Store size quantities in a dictionary
                size_quantities = {line.size: line.pcs_on_layer for line in marker_lines}

                # ✅ Append full marker data
                result.append({
                    "id": header.id,  # Include the marker ID
                    "marker_name": header.marker_name,
                    "marker_width": header.marker_width,
                    "marker_length": header.marker_length,
                    "fabric_type": header.fabric_type,  # Include fabric type for filtering
                    "efficiency": header.efficiency,
                    "size_quantities": size_quantities
                })

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@markers_api.route('/by-style-and-sizes')
class MarkersByStyleAndSizes(Resource):
    def normalize_size(self, size):
        """
        Normalize size format to handle different formatting between order sizes and marker sizes.
        Examples:
        - "3-4" -> "3_4"
        - "4-5" -> "4_5"
        - "S" -> "S" (unchanged)
        - "3_4" -> "3_4" (unchanged)
        """
        if not size:
            return size
        # Replace hyphens with underscores for consistency
        return size.replace('-', '_')

    def post(self):
        """Get markers for a specific style with matching size quantities and width range"""
        try:
            data = request.get_json()
            style = data.get('style')
            size_quantities = data.get('size_quantities')
            requested_width = data.get('requested_width')  # Optional width filter

            if not style or not size_quantities:
                return {"success": False, "message": "Style and size_quantities are required"}, 400

            # Parse the size quantities if it's a string
            if isinstance(size_quantities, str):
                try:
                    size_quantities = json.loads(size_quantities)
                except:
                    return {"success": False, "message": "Invalid size_quantities format"}, 400

            # Query markers that match the style
            query = MarkerHeader.query.filter(
                MarkerHeader.marker_name.like(f'{style}%')
            )

            # Add width filter for decimal variations (e.g., 160, 160.1, 160.2, ..., 160.9)
            if requested_width:
                base_width = int(requested_width)  # Get the integer part (e.g., 160)
                query = query.filter(
                    MarkerHeader.marker_width >= base_width,
                    MarkerHeader.marker_width < base_width + 1
                )

            markers = query.all()

            result = []
            for marker in markers:
                # Get the marker's size quantities and normalize the size keys
                marker_sizes = {}
                for size_detail in marker.marker_sizes:
                    normalized_size = self.normalize_size(size_detail.size)
                    marker_sizes[normalized_size] = size_detail.quantity

                # Normalize request sizes as well
                normalized_request_sizes = {}
                for size, qty in size_quantities.items():
                    normalized_size = self.normalize_size(size)
                    normalized_request_sizes[normalized_size] = qty

                # Compare size quantities (only check if marker has the same sizes with non-zero quantities)
                request_sizes = {k: v for k, v in normalized_request_sizes.items() if v > 0}
                marker_nonzero_sizes = {k: v for k, v in marker_sizes.items() if v > 0}

                # Check if the marker has exactly the same sizes with quantities > 0
                if set(request_sizes.keys()) == set(marker_nonzero_sizes.keys()):
                    result.append({
                        "id": marker.id,
                        "marker_name": marker.marker_name,
                        "marker_width": marker.marker_width,
                        "marker_length": marker.marker_length,
                        "efficiency": marker.efficiency,
                        "size_quantities": marker_sizes
                    })

            return {
                "success": True,
                "data": result
            }, 200

        except Exception as e:
            return {"success": False, "message": f"Error fetching markers for style and sizes: {str(e)}"}, 500


@markers_api.route('/<int:marker_id>/size-quantities')
class MarkerSizeQuantities(Resource):
    def get(self, marker_id):
        """Get size quantities for a specific marker"""
        try:
            # Get marker lines for this marker
            marker_lines = MarkerLine.query.filter_by(marker_header_id=marker_id).all()

            if not marker_lines:
                return {"success": False, "message": "Marker not found or has no size data"}, 404

            # Build size quantities dictionary
            size_quantities = {}
            for line in marker_lines:
                size_quantities[line.size] = int(line.pcs_on_layer)

            return {
                "success": True,
                "data": size_quantities
            }, 200

        except Exception as e:
            return {"success": False, "message": f"Error fetching marker size quantities: {str(e)}"}, 500

# ===================== Import Marker ==========================
@markers_api.route('/import_marker', methods=['POST'])
class ImportMarker(Resource):
    def post(self):
        try:
            if 'file' not in request.files:
                return {"success": False, "msg": "No file uploaded"}, 400

            file = request.files['file']
            if file.filename == '':
                return {"success": False, "msg": "No selected file"}, 400

            updated_data = json.loads(request.form.get('updatedData', '[]'))
            has_edits = request.form.get('hasEdits', 'false') == 'true'

            tree = ET.parse(file)
            root = tree.getroot()

            # Extract <Marker> Data
            marker_elem = root.find('Marker')
            full_marker_name = marker_elem.attrib.get('Name', '').replace('\\', '/').upper()
            marker_name = os.path.splitext(os.path.basename(full_marker_name))[0]

            creation_type = request.form.get('creationType', '').upper()

            # Extract <Fabric> Data
            fabric_elem = root.find('Fabric')
            marker_type = fabric_elem.attrib.get('MarkerType', '').upper()
            fabric_code = fabric_elem.attrib.get('Code', '').upper()
            fabric_type = fabric_elem.attrib.get('Type', '').upper()
            constraint_file = fabric_elem.attrib.get('ConstraintFile', '').upper()

            # Extract <WidthDescription> Data
            width_elem = root.find('WidthDescription')
            marker_width = float(width_elem.find('Width').attrib.get('Value', 0).replace(',', '.'))
            marker_length = float(width_elem.find('Length').attrib.get('Value', 0).replace(',', '.'))
            efficiency = float(width_elem.find('Efficiency').attrib.get('Value', 0).replace(',', '.'))
            meters_by_variants = float(width_elem.find('MetersByVariants').attrib.get('Value', 0).replace(',', '.'))

            # Check if marker with same name already exists
            existing_marker = MarkerHeader.query.filter_by(marker_name=marker_name).first()

            replacement_message = ""
            if existing_marker:
                # If new marker length is higher or equal, reject
                if marker_length >= existing_marker.marker_length:
                    return {
                        "success": False,
                        "msg": f"Marker '{marker_name}' already exists with better or equal length ({existing_marker.marker_length:.1f}cm vs {marker_length:.1f}cm)"
                    }, 409
                # If new marker length is lower, set existing marker to NOT ACTIVE and proceed
                else:
                    existing_marker.status = 'NOT ACTIVE'
                    db.session.add(existing_marker)
                    replacement_message = f" (Previous marker with length {existing_marker.marker_length:.1f}cm was set to NOT ACTIVE)"

            # Extract <Tolerances> Data
            tolerances_elem = root.find('Tolerances')
            global_spacing = float(tolerances_elem.find('GlobalSpacing').attrib.get('Value', 0).replace(',', '.'))

            fabric_edges = tolerances_elem.find('FabricEdges')
            spacing_top = float(fabric_edges.find('Top').attrib.get('Value', 0).replace(',', '.'))
            spacing_bottom = float(fabric_edges.find('Bottom').attrib.get('Value', 0).replace(',', '.'))
            spacing_right = float(fabric_edges.find('Right').attrib.get('Value', 0).replace(',', '.'))
            spacing_left = float(fabric_edges.find('Left').attrib.get('Value', 0).replace(',', '.'))

            # Extract <Statistics> Data
            statistics_elem = tolerances_elem.find('Statistics')
            perimeter = float(statistics_elem.find('Perimeter').attrib.get('Value', 0).replace(',', '.'))
            lines = float(statistics_elem.find('Lines').attrib.get('Value', '0').replace(',', '.'))
            curves = float(statistics_elem.find('Curves').attrib.get('Value', 0).replace(',', '.'))
            area = float(statistics_elem.find('Area').attrib.get('Value', 0).replace(',', '.'))
            angles = int(statistics_elem.find('Angles').attrib.get('Value', 0))
            notches = int(statistics_elem.find('Notches').attrib.get('Value', 0))
            cut_perimeter = float(statistics_elem.find('CutPerimeter').attrib.get('Value', 0).replace(',', '.'))
            total_pieces = int(sum(float(line.get('qty', 0)) for line in updated_data))

            # Extract <MarkerContent> - Important for model and variant
            marker_content = root.find('.//MarkerContent')
            model = ''
            variant = ''

            if marker_content is not None:
                variants = marker_content.findall('NewVariant')

                # Extract the model and variant for the first variant as the default
                first_variant = variants[0] if variants else None
                if first_variant:
                    model = first_variant.find('Model').attrib.get('Value', '').strip()
                    variant = first_variant.find('Variant').attrib.get('Value', '').strip()

            # Save MarkerHeader first before creating MarkerLines
            new_marker = MarkerHeader(
                marker_name=marker_name,
                marker_type=marker_type,
                fabric_code=fabric_code,
                fabric_type=fabric_type,
                constraint=constraint_file,
                marker_width=marker_width,
                marker_length=marker_length,
                efficiency=efficiency,
                average_consumption=meters_by_variants,
                spacing_around_pieces=global_spacing,
                spacing_around_pieces_top=spacing_top,
                spacing_around_pieces_bottom=spacing_bottom,
                spacing_around_pieces_right=spacing_right,
                spacing_around_pieces_left=spacing_left,
                perimeter=perimeter,
                lines=lines,
                curves=curves,
                areas=area,
                angles=angles,
                notches=notches,
                cutting_perimeter=cut_perimeter,
                total_pcs=total_pieces,
                model=model,  # Ensure model is populated here
                variant=variant,  # Ensure variant is populated here
                status='ACTIVE',
                creation_type=creation_type
            )

            db.session.add(new_marker)
            db.session.commit()  # Commit the new_marker before proceeding

            # Save MarkerLines (Variants)
            if updated_data:
                for line in updated_data:
                    size = line.get('size', '').strip()
                    style = line.get('style', '').strip()
                    pcs_on_layer = float(line.get('qty', 0))

                    # Save MarkerLine
                    existing_marker_line = MarkerLine.query.filter_by(
                        marker_header_id=new_marker.id, style=style, size=size
                    ).first()

                    if existing_marker_line:
                        existing_marker_line.pcs_on_layer += pcs_on_layer
                    else:
                        new_marker_line = MarkerLine(
                            marker_header_id=new_marker.id,
                            style=style,
                            size=size,
                            style_size=f"{style} {size}",
                            pcs_on_layer=pcs_on_layer
                        )
                        db.session.add(new_marker_line)

                    # Save MarkerLineRotation with direction logic
                    existing_rotation_false = MarkerLineRotation.query.filter_by(
                        marker_header_id=new_marker.id,
                        style=style,
                        size=size,
                        rotation180=False
                    ).first()

                    if not existing_rotation_false:
                        new_rotation_line = MarkerLineRotation(
                            marker_header_id=new_marker.id,
                            style=style,
                            size=size,
                            style_size=f"{style} {size}",
                            rotation180=False,
                            pcs_on_layer=pcs_on_layer
                        )
                        db.session.add(new_rotation_line)
                    else:
                        new_rotation_line = MarkerLineRotation(
                            marker_header_id=new_marker.id,
                            style=style,
                            size=size,
                            style_size=f"{style} {size}",
                            rotation180=True,
                            pcs_on_layer=pcs_on_layer
                        )
                        db.session.add(new_rotation_line)

            db.session.commit()

            return {"success": True, "msg": f"Marker '{marker_name}' imported successfully{replacement_message}"}, 201
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

# ===================== Batch Import Markers ==========================
@markers_api.route('/batch_import_markers', methods=['POST'])
class BatchImportMarkers(Resource):
    def post(self):
        if 'files[]' not in request.files:
            return {"success": False, "msg": "No files uploaded"}, 400

        files = request.files.getlist('files[]')
        creation_type = request.form.get('creationType', '').upper()
        marker_content_data = {}

        # Get marker content data if available
        if 'markerContentData' in request.form:
            try:
                marker_content_data = json.loads(request.form.get('markerContentData', '{}'))
            except json.JSONDecodeError:
                print("Error decoding marker content data")

        if not files or len(files) == 0:
            return {"success": False, "msg": "No files selected"}, 400

        results = []
        success_count = 0
        failure_count = 0

        # Helper function to safely convert string to float, handling comma decimal separators
        def safe_float(value, default=0):
            if not value:
                return default
            # Replace comma with dot for decimal separator
            value = value.replace(',', '.')
            try:
                return float(value)
            except ValueError:
                print(f"Warning: Could not convert '{value}' to float, using default {default}")
                return default

        for file in files:
            result = {"filename": file.filename, "success": False, "msg": ""}

            try:
                # Process each XML file
                tree = ET.parse(file)
                root = tree.getroot()

                # Extract marker name
                marker_elem = root.find('Marker')
                if marker_elem is None:
                    result["msg"] = "Invalid XML format: Missing Marker element"
                    results.append(result)
                    failure_count += 1
                    continue

                full_marker_name = marker_elem.attrib.get('Name', '').replace('\\', '/').upper()
                # Extract just the filename without path and extension
                marker_name = os.path.splitext(os.path.basename(full_marker_name))[0]

                # Debug marker name extraction
                print(f"Full marker name: {full_marker_name}")
                print(f"Extracted marker name: {marker_name}")

                # Extract marker dimensions first to check for duplicates
                width_desc_elem = root.find('WidthDescription')
                if width_desc_elem is None:
                    result["msg"] = "Invalid XML format: Missing WidthDescription element"
                    results.append(result)
                    failure_count += 1
                    continue

                width_elem = width_desc_elem.find('Width')
                length_elem = width_desc_elem.find('Length')

                if width_elem is None or length_elem is None:
                    result["msg"] = "Invalid XML format: Missing Width or Length element"
                    results.append(result)
                    failure_count += 1
                    continue

                marker_length = safe_float(length_elem.attrib.get('Value', 0))

                # Check if marker with same name already exists
                replacement_message = ""
                existing_marker = MarkerHeader.query.filter_by(marker_name=marker_name).first()
                if existing_marker:
                    # If new marker length is higher or equal, reject
                    if marker_length >= existing_marker.marker_length:
                        result["msg"] = f"Marker '{marker_name}' already exists with better or equal length ({existing_marker.marker_length:.1f}cm vs {marker_length:.1f}cm)"
                        results.append(result)
                        failure_count += 1
                        continue
                    # If new marker length is lower, set existing marker to NOT ACTIVE and proceed
                    else:
                        existing_marker.status = 'NOT ACTIVE'
                        db.session.add(existing_marker)
                        replacement_message = f" (Previous marker with length {existing_marker.marker_length:.1f}cm was set to NOT ACTIVE)"

                # Extract fabric data
                fabric_elem = root.find('Fabric')
                if fabric_elem is None:
                    result["msg"] = "Invalid XML format: Missing Fabric element"
                    results.append(result)
                    failure_count += 1
                    continue

                marker_type = fabric_elem.attrib.get('MarkerType', '').upper()
                fabric_code = fabric_elem.attrib.get('Code', '').upper()
                fabric_type = fabric_elem.attrib.get('Type', '').upper()
                constraint_file = fabric_elem.attrib.get('ConstraintFile', '').upper()

                # Debug fabric data extraction
                print(f"Fabric data: code={fabric_code}, type={fabric_type}, constraint={constraint_file}, marker_type={marker_type}")

                # Extract additional marker dimensions and efficiency from WidthDescription (already extracted above)
                efficiency_elem = width_desc_elem.find('Efficiency')
                meters_by_variants_elem = width_desc_elem.find('MetersByVariants')

                marker_width = safe_float(width_elem.attrib.get('Value', '0')) if width_elem is not None else 0
                # marker_length already extracted above for duplicate check
                efficiency = safe_float(efficiency_elem.attrib.get('Value', '0')) if efficiency_elem is not None else 0
                meters_by_variants = safe_float(meters_by_variants_elem.attrib.get('Value', '0')) if meters_by_variants_elem is not None else 0

                # Debug marker dimensions and efficiency
                print(f"Marker dimensions: width={marker_width}, length={marker_length}, efficiency={efficiency}, meters_by_variants={meters_by_variants}")

                # Helper function to safely convert string to int
                def safe_int(value, default=0):
                    if not value:
                        return default
                    try:
                        return int(value)
                    except ValueError:
                        try:
                            # Try converting to float first, then to int
                            return int(safe_float(value, default))
                        except ValueError:
                            print(f"Warning: Could not convert '{value}' to int, using default {default}")
                            return default

                # Extract tolerances data (spacing and statistics)
                tolerances_elem = root.find('Tolerances')
                if tolerances_elem is None:
                    result["msg"] = "Invalid XML format: Missing Tolerances element"
                    results.append(result)
                    failure_count += 1
                    continue

                # Extract spacing
                global_spacing = 0
                spacing_top = 0
                spacing_bottom = 0
                spacing_right = 0
                spacing_left = 0

                global_spacing_elem = tolerances_elem.find('GlobalSpacing')
                if global_spacing_elem is not None:
                    global_spacing = safe_float(global_spacing_elem.attrib.get('Value', '0'))

                fabric_edges_elem = tolerances_elem.find('FabricEdges')
                if fabric_edges_elem is not None:
                    top_elem = fabric_edges_elem.find('Top')
                    bottom_elem = fabric_edges_elem.find('Bottom')
                    right_elem = fabric_edges_elem.find('Right')
                    left_elem = fabric_edges_elem.find('Left')

                    spacing_top = safe_float(top_elem.attrib.get('Value', '0')) if top_elem is not None else 0
                    spacing_bottom = safe_float(bottom_elem.attrib.get('Value', '0')) if bottom_elem is not None else 0
                    spacing_right = safe_float(right_elem.attrib.get('Value', '0')) if right_elem is not None else 0
                    spacing_left = safe_float(left_elem.attrib.get('Value', '0')) if left_elem is not None else 0

                # Debug spacing data
                print(f"Spacing: global={global_spacing}, top={spacing_top}, bottom={spacing_bottom}, right={spacing_right}, left={spacing_left}")

                # Extract statistics
                perimeter = 0
                lines = 0
                curves = 0
                area = 0
                angles = 0
                notches = 0
                cut_perimeter = 0
                total_pieces_from_xml = 0

                statistics_elem = tolerances_elem.find('Statistics')
                if statistics_elem is not None:
                    perimeter_elem = statistics_elem.find('Perimeter')
                    lines_elem = statistics_elem.find('Lines')
                    curves_elem = statistics_elem.find('Curves')
                    area_elem = statistics_elem.find('Area')
                    angles_elem = statistics_elem.find('Angles')
                    notches_elem = statistics_elem.find('Notches')
                    cut_perimeter_elem = statistics_elem.find('CutPerimeter')
                    total_pieces_elem = statistics_elem.find('TotalPieces')

                    perimeter = safe_float(perimeter_elem.attrib.get('Value', '0')) if perimeter_elem is not None else 0
                    lines = safe_float(lines_elem.attrib.get('Value', '0')) if lines_elem is not None else 0
                    curves = safe_float(curves_elem.attrib.get('Value', '0')) if curves_elem is not None else 0
                    area = safe_float(area_elem.attrib.get('Value', '0')) if area_elem is not None else 0
                    angles = safe_int(angles_elem.attrib.get('Value', '0')) if angles_elem is not None else 0
                    notches = safe_int(notches_elem.attrib.get('Value', '0')) if notches_elem is not None else 0
                    cut_perimeter = safe_float(cut_perimeter_elem.attrib.get('Value', '0')) if cut_perimeter_elem is not None else 0
                    total_pieces_from_xml = safe_int(total_pieces_elem.attrib.get('Value', '0')) if total_pieces_elem is not None else 0

                # Debug statistics data
                print(f"Statistics: perimeter={perimeter}, lines={lines}, curves={curves}, area={area}, angles={angles}, notches={notches}, cut_perimeter={cut_perimeter}, total_pieces={total_pieces_from_xml}")

                # Extract model and variant from MarkerContent
                model = ""
                variant = ""

                # Find MarkerContent element
                marker_content_elem = tolerances_elem.find('MarkerContent')
                if marker_content_elem is not None:
                    # Get the first NewVariant element
                    first_variant = marker_content_elem.find('NewVariant')
                    if first_variant is not None:
                        # Extract model
                        model_elem = first_variant.find('Model')
                        if model_elem is not None:
                            model = model_elem.attrib.get('Value', '').upper()

                        # Extract variant
                        variant_elem = first_variant.find('Variant')
                        if variant_elem is not None:
                            variant = variant_elem.attrib.get('Value', '').upper()

                # Debug model and variant
                print(f"Model and variant: model={model}, variant={variant}")

                # Ensure variant is a string, not an XML element
                if variant is None or not isinstance(variant, str):
                    variant = ''

                # Extract variants data from MarkerContent
                total_pieces = 0

                # We'll calculate total pieces from the variants data
                # If TotalPieces is available in XML, we'll use it as a fallback
                total_pieces_from_xml_fallback = total_pieces_from_xml

                # Extract variants data
                variants_data = []

                # Check if we have edited marker content data for this file
                file_name = os.path.basename(file.filename)
                if file_name in marker_content_data and marker_content_data[file_name]:
                    # Use the edited marker content data
                    variants_data = marker_content_data[file_name]

                    # Calculate total pieces from the edited data
                    total_pieces = sum(float(item['qty']) for item in variants_data)
                else:
                    # Extract variants data from XML
                    if marker_content_elem is not None:
                        new_variants = marker_content_elem.findall('NewVariant')

                        for variant_elem in new_variants:
                            model_elem = variant_elem.find('Model')
                            size_elem = variant_elem.find('Size')
                            qty_elem = variant_elem.find('Quantity')

                            if model_elem is not None and size_elem is not None and qty_elem is not None:
                                full_style = model_elem.attrib.get('Value', '').upper()
                                style_parts = full_style.split('_')
                                style = '_'.join(style_parts[1:]) if len(style_parts) > 1 else full_style

                                size = size_elem.attrib.get('Value', '').upper()
                                qty = safe_float(qty_elem.attrib.get('Value', '0'))

                                # Extract rotation180 value
                                rotation180_elem = variant_elem.find('Rotation180')
                                rotation180 = False  # Default to False
                                if rotation180_elem is not None:
                                    rotation180_value = rotation180_elem.attrib.get('Value', 'False')
                                    rotation180 = rotation180_value.lower() == 'true'

                                variants_data.append({
                                    'style': style,
                                    'size': size,
                                    'qty': qty,
                                    'rotation180': rotation180
                                })

                                # Add to total pieces
                                total_pieces += qty

                # Debug variants data
                print(f"Variants data: {variants_data}")

                # If we couldn't extract any variants or the total is 0, use the fallback
                if not variants_data or total_pieces == 0:
                    total_pieces = total_pieces_from_xml_fallback

                print(f"Total pieces: {total_pieces}")

                # Debug the variant value
                print(f"Variant type before creating marker: {type(variant)}, value: {variant}")

                # Ensure variant is a string
                if not isinstance(variant, str):
                    if hasattr(variant, 'text'):
                        variant = variant.text
                    elif hasattr(variant, 'attrib') and 'Value' in variant.attrib:
                        variant = variant.attrib['Value']
                    else:
                        variant = str(variant)

                # Debug the variant value after conversion
                print(f"Variant type after conversion: {type(variant)}, value: {variant}")

                # Create new marker header
                new_marker = MarkerHeader(
                    marker_name=marker_name,
                    marker_type=marker_type,
                    fabric_code=fabric_code,
                    fabric_type=fabric_type,
                    constraint=constraint_file,
                    marker_width=marker_width,
                    marker_length=marker_length,
                    efficiency=efficiency,
                    average_consumption=meters_by_variants,
                    spacing_around_pieces=global_spacing,
                    spacing_around_pieces_top=spacing_top,
                    spacing_around_pieces_bottom=spacing_bottom,
                    spacing_around_pieces_right=spacing_right,
                    spacing_around_pieces_left=spacing_left,
                    perimeter=perimeter,
                    lines=lines,
                    curves=curves,
                    areas=area,
                    angles=angles,
                    notches=notches,
                    cutting_perimeter=cut_perimeter,
                    total_pcs=total_pieces,
                    model=model,
                    variant=variant,
                    creation_type=creation_type
                )

                db.session.add(new_marker)
                db.session.flush()  # Get the ID without committing

                # Create marker lines with summing by style and size
                # First, group variants by style, size, and rotation180
                grouped_variants = {}
                for variant_data in variants_data:
                    style = variant_data['style']
                    size = variant_data['size']
                    pcs_on_layer = float(variant_data['qty'])
                    rotation180 = variant_data.get('rotation180', False)  # Default to False if not provided

                    # Group by style and size
                    key = f"{style}_{size}"
                    if key not in grouped_variants:
                        grouped_variants[key] = {
                            'style': style,
                            'size': size,
                            'pcs_on_layer': 0,
                            'rotation180_variants': []
                        }

                    # Add to total quantity
                    grouped_variants[key]['pcs_on_layer'] += pcs_on_layer

                    # Store rotation information
                    grouped_variants[key]['rotation180_variants'].append({
                        'pcs_on_layer': pcs_on_layer,
                        'rotation180': rotation180
                    })

                # Now create marker lines from the grouped data
                for key, data in grouped_variants.items():
                    style = data['style']
                    size = data['size']
                    pcs_on_layer = data['pcs_on_layer']

                    # Check if a marker line with this style and size already exists
                    existing_marker_line = MarkerLine.query.filter_by(
                        marker_header_id=new_marker.id, style=style, size=size
                    ).first()

                    if existing_marker_line:
                        # Add to existing marker line
                        existing_marker_line.pcs_on_layer += pcs_on_layer
                    else:
                        # Create new marker line
                        new_marker_line = MarkerLine(
                            marker_header_id=new_marker.id,
                            style=style,
                            size=size,
                            style_size=f"{style} {size}",
                            pcs_on_layer=pcs_on_layer
                        )
                        db.session.add(new_marker_line)

                    # Add MarkerLineRotation entries based on the rotation data
                    rotation_variants = data['rotation180_variants']

                    # Group by rotation180 value and sum quantities
                    rotation_grouped = {False: 0, True: 0}
                    for rv in rotation_variants:
                        rotation_grouped[rv['rotation180']] += rv['pcs_on_layer']

                    # Create rotation entries for each rotation value that has pieces
                    for rotation180, qty in rotation_grouped.items():
                        if qty > 0:
                            new_rotation_line = MarkerLineRotation(
                                marker_header_id=new_marker.id,
                                style=style,
                                size=size,
                                style_size=f"{style} {size}",
                                rotation180=rotation180,
                                pcs_on_layer=qty
                            )
                            db.session.add(new_rotation_line)

                # Commit the transaction for this marker
                db.session.commit()

                result["success"] = True
                result["msg"] = f"Marker '{marker_name}' imported successfully{replacement_message}"
                result["marker_name"] = marker_name
                success_count += 1

            except Exception as e:
                db.session.rollback()  # Rollback on error
                result["msg"] = f"Error: {str(e)}"
                failure_count += 1

            results.append(result)

        return {
            "success": success_count > 0,
            "results": results,
            "summary": {
                "total": len(files),
                "success": success_count,
                "failure": failure_count
            }
        }, 200

# ===================== Fecth Marker Pieces ==========================
@markers_api.route('/marker_pcs', methods=['GET'])
class MarkerPcs(Resource):
    def get(self):
        try:
            marker_name = request.args.get("marker_name")

            if not marker_name:
                return {"success": False, "msg": "Marker name is required"}, 400

            # 🔹 Step 1: Find Marker ID in `marker_headers`
            marker = MarkerHeader.query.filter_by(marker_name=marker_name).first()

            if not marker:
                return {"success": False, "msg": f"Marker '{marker_name}' not found in marker_headers"}, 404

            marker_id = marker.id
            print(f"🔍 Found Marker ID: {marker_id}")  # ✅ Debugging log

            # 🔹 Step 2: Fetch Marker Lines from `marker_lines` using marker_id
            lines = MarkerLine.query.filter_by(marker_header_id=marker_id).all()

            if not lines:
                return {"success": False, "msg": f"No marker lines found for Marker ID {marker_id}"}, 404

            # 🔹 Step 3: Format result
            result = [{
                "style": line.style,
                "size": line.size,
                "pcs_on_layer": line.pcs_on_layer
            } for line in lines]

            print(f"✅ Retrieved Marker Lines: {result}")  # ✅ Debugging log

            return {
                "success": True,
                "marker_lines": result
            }, 200

        except Exception as e:
            print(f"❌ API Error: {str(e)}")  # ✅ Debugging log
            return {"success": False, "msg": f"An unexpected error occurred: {str(e)}"}, 500

# ===================== Set NOT ACTIVE ==========================
@markers_api.route('/set_not_active', methods=['POST'])
class NotActive(Resource):
    def post(self):
        data = request.json
        marker_ids = data.get("marker_ids", [])

        if not marker_ids:
            return {"success": False, "message": "No marker IDs provided"}, 400

        # ✅ Update the database
        markers_to_update = MarkerHeader.query.filter(MarkerHeader.id.in_(marker_ids)).all()
        for marker in markers_to_update:
            marker.status = "NOT ACTIVE"

        db.session.commit()

        return {"success": True, "message": "Markers updated successfully"}

# ===================== Delete Markers ==========================
@markers_api.route('/delete', methods=['POST'])
class DeleteMarkers(Resource):
    def post(self):
        from api.models import MattressMarker

        data = request.json
        marker_ids = data.get("marker_ids", [])

        if not marker_ids:
            return {"success": False, "message": "No marker IDs provided"}, 400

        try:
            # Check if any of the markers are used in mattress_markers table
            used_markers = db.session.query(MattressMarker.marker_id).filter(
                MattressMarker.marker_id.in_(marker_ids)
            ).distinct().all()

            used_marker_ids = [marker.marker_id for marker in used_markers]

            if used_marker_ids:
                # Get marker names for the error message
                used_marker_names = db.session.query(MarkerHeader.marker_name).filter(
                    MarkerHeader.id.in_(used_marker_ids)
                ).all()
                marker_names_str = ", ".join([name.marker_name for name in used_marker_names])

                return {
                    "success": False,
                    "message": f"Cannot delete markers that have been used: {marker_names_str}"
                }, 400

            # If no markers are used, proceed with deletion
            markers_to_delete = MarkerHeader.query.filter(MarkerHeader.id.in_(marker_ids)).all()

            if not markers_to_delete:
                return {"success": False, "message": "No markers found to delete"}, 404

            deleted_count = 0
            for marker in markers_to_delete:
                db.session.delete(marker)
                deleted_count += 1

            db.session.commit()

            return {
                "success": True,
                "message": f"Successfully deleted {deleted_count} marker(s)"
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error deleting markers: {str(e)}"}, 500
