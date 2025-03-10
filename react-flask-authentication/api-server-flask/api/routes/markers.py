from flask import Blueprint, request
from flask_restx import Namespace, Resource
from api.models import db, MarkerHeader, MarkerLine
import json
import xml.etree.ElementTree as ET
import os

# Create Blueprint and API instance
markers_bp = Blueprint('markers', __name__)
markers_api = Namespace('markers', description="Marker Management")

# ===================== Marker Headers ==========================
@markers_api.route('/marker_headers', methods=['GET'])
class MarkerHeaders(Resource):
    def get(self):
        try:
            headers = MarkerHeader.query.filter_by(status='ACTIVE').all()
            result = [{
                "id": header.id,
                "marker_name": header.marker_name,
                "marker_width": header.marker_width,
                "marker_length": header.marker_length,
                "efficiency": header.efficiency,
                "total_pcs": header.total_pcs,
                "creation_type": header.creation_type,
                "model": header.model,
                "variant": header.variant
            } for header in headers]

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

# ===================== Marker Headers Planning ==========================
@markers_api.route('/marker_headers_planning', methods=['GET'])
class MarkerHeadersPlanning(Resource):
    def get(self):
        try:
            selected_style = request.args.get('style')  # 🔍 Get style from query parameters
            
            if not selected_style:
                return {"success": False, "msg": "Missing required style parameter"}, 400

            # ✅ Fetch ACTIVE markers matching the style
            headers = MarkerHeader.query.filter(
                MarkerHeader.status == 'ACTIVE',
                MarkerHeader.model.ilike(f"%{selected_style}%")  # Case-insensitive search
            ).all()

            result = []

            for header in headers:
                # ✅ Fetch Marker Lines for the current header
                marker_lines = MarkerLine.query.filter_by(marker_header_id=header.id).all()
                
                # ✅ Store size quantities in a dictionary
                size_quantities = {line.size: line.pcs_on_layer for line in marker_lines}

                # ✅ Append full marker data
                result.append({
                    "marker_name": header.marker_name,
                    "marker_width": header.marker_width,
                    "marker_length": header.marker_length,
                    "efficiency": header.efficiency,
                    "size_quantities": size_quantities  # ✅ Include size quantities
                })

            return {"success": True, "data": result}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


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
            full_marker_name = marker_elem.attrib.get('Name', '').upper()
            marker_name = os.path.splitext(os.path.basename(full_marker_name))[0]
           
            if MarkerHeader.query.filter_by(marker_name=marker_name).first():
                return {"success": False, "msg": f"Marker '{marker_name}' already exists"}, 409  # Use 409 Conflict
 
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
            total_pieces = int(statistics_elem.find('TotalPieces').attrib.get('Value', 0))
 
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
                creation_type=request.form.get('creationType').upper()
            )
 
            db.session.add(new_marker)
            db.session.commit()  # Commit the new_marker before proceeding
 
            # Save MarkerLines (Variants)
            if marker_content is not None:
                for i, variant in enumerate(marker_content.findall('.//NewVariant')):
                    size_element = variant.find('Size')
                    quantity_element = variant.find('Quantity')
 
                    if size_element is not None:
                        size = size_element.attrib.get('Value', '').strip()
                    else:
                        size = ''  # Default if size is missing
 
                    if quantity_element is not None:
                        quantity = quantity_element.attrib.get('Value', '0').strip()
                    else:
                        quantity = '0'  # Default if quantity is missing
 
                    try:
                        pcs_on_layer = float(quantity) if quantity else 0.0
                    except ValueError:
                        pcs_on_layer = 0.0  # Default to 0 if quantity is not a valid number
 
                    # Check if a MarkerLine already exists with the same style and size
                    existing_marker_line = MarkerLine.query.filter_by(
                        marker_header_id=new_marker.id, style=new_marker.model, size=size).first()
 
                    if existing_marker_line:
                        # If it exists, sum the pcs_on_layer values
                        existing_marker_line.pcs_on_layer += pcs_on_layer
                    else:
                        # If not, create a new MarkerLine
                        new_marker_line = MarkerLine(
                            marker_header_id=new_marker.id,
                            style=new_marker.model,
                            size=size,
                            style_size=f"{new_marker.model} {size}",
                            pcs_on_layer=pcs_on_layer
                        )
                        db.session.add(new_marker_line)
 
                db.session.commit()
 
            return {"success": True, "msg": f"Marker '{marker_name}' imported"}, 201
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
