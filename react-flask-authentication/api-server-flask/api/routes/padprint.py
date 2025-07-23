from flask import Blueprint, jsonify, current_app, send_from_directory, request
from flask_restx import Namespace, Resource
from werkzeug.utils import secure_filename
import os
from api.models import db, PadPrint, PadPrintImage
from datetime import datetime

padprint_bp = Blueprint('padprint_bp', __name__)
padprint_api = Namespace('padprint', description="PadPrint Operations")


# ✅ GET All PadPrints
@padprint_api.route('/all')
class PadPrintList(Resource):
    def get(self):
        try:
            # Join padprint with padprint_image on (pattern, padprint_color)
            results = (
                db.session.query(PadPrint, PadPrintImage.image_url)
                .outerjoin(
                    PadPrintImage,
                    (PadPrint.pattern == PadPrintImage.pattern) &
                    (PadPrint.padprint_color == PadPrintImage.padprint_color)
                )
                .all()
            )

            # Combine the fields from both tables
            response = []
            for padprint, image_url in results:
                item = padprint.to_dict()
                item['image_url'] = image_url
                response.append(item)

            return jsonify(response)

        except Exception as e:
            return {'error': str(e)}, 500

# ✅ GET Filtered PadPrints by season, style, and color
@padprint_api.route('/filter')
class PadPrintFilter(Resource):
    def get(self):
        season = request.args.get('season')
        style = request.args.get('style')
        color = request.args.get('color')

        if not (season and style and color):
            return {'success': False, 'message': 'Missing query parameters (season, style, color)'}, 400

        try:
            padprints = PadPrint.query.filter_by(season=season, style=style, color=color).all()
            # Return an empty array with a 200 status if no data is found
            return {'success': True, 'data': [p.to_dict() for p in padprints]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500

# ✅ POST Upload Image to a PadPrint by ID
@padprint_api.route('/upload-image/<int:id>')
class PadPrintImageUpload(Resource):
    def post(self, id):
        if 'file' not in request.files:
            return {"message": "No file part"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"message": "No selected file"}, 400

        if file:
            # Get the padprint record to access pattern and padprint_color
            padprint = PadPrint.query.filter_by(id=id).first()
            if not padprint:
                return {"message": "PadPrint not found"}, 404

            # Setup paths and ensure directory exists
            BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'padprint')
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)

            # Create filename based on pattern (lowercase with .jpg extension)
            pattern = padprint.pattern.lower()
            filename = f"{pattern}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)

            # Save the file
            print(f"Saving to: {file_path}")
            file.save(file_path)
            print("Saved!")

            # Update or create PadPrintImage record
            image_url = filename  # Store just the filename
            padprint_image = PadPrintImage.query.filter_by(
                pattern=padprint.pattern,
                padprint_color=padprint.padprint_color
            ).first()

            if padprint_image:
                # Update existing record
                padprint_image.image_url = image_url
            else:
                # Create new record
                padprint_image = PadPrintImage(
                    pattern=padprint.pattern,
                    padprint_color=padprint.padprint_color,
                    image_url=image_url
                )

            # Save to database
            db.session.add(padprint_image)
            db.session.commit()

            return {
                "success": True,
                "message": "Image uploaded successfully",
                "image_url": f"/api/padprint/image/{filename}"
            }, 200

        return {"message": "File type not allowed"}, 400

# ✅ POST Upload Image directly with pattern and padprint_color
@padprint_api.route('/upload-image-direct')
class PadPrintImageDirectUpload(Resource):
    def post(self):
        if 'file' not in request.files:
            return {"message": "No file part"}, 400

        pattern = request.form.get('pattern')
        padprint_color = request.form.get('padprint_color')

        if not pattern or not padprint_color:
            return {"message": "Pattern and padprint_color are required"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"message": "No selected file"}, 400

        if file:
            # Setup paths and ensure directory exists
            BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'padprint')
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)

            # Create filename based on pattern (lowercase with .jpg extension)
            pattern_lower = pattern.lower()
            filename = f"{pattern_lower}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)

            # Save the file
            print(f"Saving to: {file_path}")
            file.save(file_path)
            print("Saved!")

            # Update or create PadPrintImage record
            image_url = filename  # Store just the filename
            padprint_image = PadPrintImage.query.filter_by(
                pattern=pattern,
                padprint_color=padprint_color
            ).first()

            if padprint_image:
                # Update existing record
                padprint_image.image_url = image_url
            else:
                # Create new record
                padprint_image = PadPrintImage(
                    pattern=pattern,
                    padprint_color=padprint_color,
                    image_url=image_url
                )

            # Save to database
            db.session.add(padprint_image)
            db.session.commit()

            return {
                "success": True,
                "message": "Image uploaded successfully",
                "image_url": f"/api/padprint/image/{filename}"
            }, 200

        return {"message": "File type not allowed"}, 400

# ✅ Serving uploaded images manually
@padprint_bp.route('/image/<path:filename>', methods=['GET'])
def serve_padprint_image(filename):
    upload_folder = os.path.normpath(os.path.join(current_app.root_path, '..', 'static', 'padprint'))
    print("📂 Upload folder:", upload_folder)
    print("📄 Requested filename:", filename)
    return send_from_directory(upload_folder, filename)

@padprint_api.route('/create', methods=['POST'])
class PadPrintCreate(Resource):
    def post(self):
        data = request.get_json()
        try:
            # Extract and normalize fields
            brand = data.get('brand')
            style = data.get('style')
            color = data.get('color')
            season = data.get('season')
            pattern = data.get('pattern')
            padprint_color = data.get('padprint_color')
            date_str = data.get('date')
            date_obj = datetime.strptime(date_str, '%Y-%m-%d') if date_str else datetime.now()

            # Validate required fields
            if not all([brand, style, color, season, pattern, padprint_color]):
                return {'error': 'All fields are required.'}, 400

            # Check for duplicates
            exists = PadPrint.query.filter_by(
                brand=brand,
                style=style,
                color=color,
                pattern=pattern,
                padprint_color=padprint_color,
                season=season
            ).first()

            if exists:
                return {'error': 'Pad Print entry already exists.'}, 409

            # Insert new row
            new_padprint = PadPrint(
                brand=brand,
                style=style,
                color=color,
                season=season,
                pattern=pattern,
                padprint_color=padprint_color,
                date=date_obj
            )
            db.session.add(new_padprint)
            db.session.commit()

            return new_padprint.to_dict(), 201

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

@padprint_api.route('/<int:id>')
class PadPrintDetail(Resource):
    def put(self, id):
        data = request.get_json()
        padprint = PadPrint.query.get(id)
        if not padprint:
            return {'message': 'PadPrint not found'}, 404
        try:
            padprint.brand = data.get('brand', padprint.brand)
            padprint.season = data.get('season', padprint.season)
            padprint.style = data.get('style', padprint.style)
            padprint.color = data.get('color', padprint.color)
            padprint.padprint_color = data.get('padprint_color', padprint.padprint_color)
            padprint.pattern = data.get('pattern', padprint.pattern)

            # Handle date parsing properly
            date_str = data.get('date')
            if date_str:
                # Try to parse different date formats
                if isinstance(date_str, str):
                    try:
                        # Try ISO format with microseconds first
                        if 'T' in date_str:
                            # Remove microseconds if present and parse
                            date_str_clean = date_str.split('.')[0]  # Remove microseconds
                            padprint.date = datetime.strptime(date_str_clean, '%Y-%m-%dT%H:%M:%S')
                        else:
                            # Try simple date format
                            padprint.date = datetime.strptime(date_str, '%Y-%m-%d')
                    except ValueError:
                        # If parsing fails, keep the original date
                        pass
                else:
                    # If it's already a datetime object, use it directly
                    padprint.date = date_str

            db.session.commit()
            return padprint.to_dict(), 200
        except Exception as e:
            return {'error': str(e)}, 500

    def delete(self, id):
        padprint = PadPrint.query.get(id)
        if not padprint:
            return {'message': 'PadPrint not found'}, 404
        try:
            db.session.delete(padprint)
            db.session.commit()
            return {'message': 'Deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
