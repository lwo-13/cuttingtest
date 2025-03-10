from flask import Blueprint, request
from flask_restx import Namespace, Resource
from api.models import db, MarkerHeader, MarkerLine
import json
import xml.etree.ElementTree as ET
import os
import logging

# Create Blueprint and API instance
markers_bp = Blueprint('markers', __name__)
markers_api = Namespace('markers', description="Marker Management")

# ===================== Marker Headers ==========================
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

                    # Debugging output to confirm extraction
                    if size_element is not None:
                        size = size_element.attrib.get('Value', '').strip()
                        print(f"Extracted size: {size}")
                    else:
                        print("Size element not found!")

                    if quantity_element is not None:
                        quantity = quantity_element.attrib.get('Value', '0').strip()
                        print(f"Extracted quantity: {quantity}")
                    else:
                        print("Quantity element not found!")

                    # If there are updates and this variant has edits, apply them
                    if has_edits and i < len(updated_data):
                        updated_variant = updated_data[i]
                        size = updated_variant.get('size', size)
                        quantity = updated_variant.get('qty', quantity)
                        model = updated_variant.get('style', model)

                    # Convert quantity to float only if it's a valid number, otherwise set it to 0
                    try:
                        pcs_on_layer = float(quantity) if quantity else 0.0
                    except ValueError:
                        pcs_on_layer = 0.0  # Default to 0 if quantity is not a valid number

                    # Use the model from marker_header for style in marker_lines
                    print(f"Saving size: {size}")
                    new_marker_line = MarkerLine(
                        marker_header_id=new_marker.id, 
                        style=new_marker.model,  # Ensure model is used correctly
                        size=size,  # Ensure size is assigned here
                        style_size=f"{new_marker.model} {size}", 
                        pcs_on_layer=pcs_on_layer
                    )
                    db.session.add(new_marker_line)

                db.session.commit()

            return {"success": True, "msg": f"Marker '{marker_name}' imported"}, 201
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
