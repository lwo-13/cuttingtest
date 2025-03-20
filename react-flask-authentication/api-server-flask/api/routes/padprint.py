from flask import Blueprint, jsonify, current_app, send_from_directory, request
from flask_restx import Namespace, Resource
from werkzeug.utils import secure_filename
import os
from api.models import db, PadPrint
from datetime import datetime

padprint_bp = Blueprint('padprint_bp', __name__)
padprint_api = Namespace('padprint', description="PadPrint Operations")

UPLOAD_FOLDER = 'static/uploads'


# ✅ GET All PadPrints
@padprint_api.route('/all')
class PadPrintList(Resource):
    def get(self):
        try:
            padprints = PadPrint.query.all()
            return [p.to_dict() for p in padprints], 200
        except Exception as e:
            return {'error': str(e)}, 500


# ✅ POST Upload Image to a PadPrint
@padprint_api.route('/upload-image/<int:id>')
class PadPrintImageUpload(Resource):
    def post(self, id):
        print(f"DEBUG: Received POST request for PadPrint ID: {id}")
        if 'file' not in request.files:
            return {"message": "No file part"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"message": "No selected file"}, 400

        if file:
            filename = secure_filename(file.filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)

            image_url = f"/{UPLOAD_FOLDER}/{filename}"
            padprint = PadPrint.query.filter_by(id=id).first()
            if padprint:
                padprint.image_url = image_url
                db.session.commit()
                return {"image_url": image_url}, 200
            else:
                return {"message": "PadPrint not found"}, 404

        return {"message": "File type not allowed"}, 400

# ✅ Serving uploaded images manually
@padprint_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_padprint_image(filename):
    base_dir = os.path.dirname(current_app.root_path)
    upload_folder = os.path.join(base_dir, 'static', 'uploads')
    return send_from_directory(upload_folder, filename)

@padprint_api.route('/')
class PadPrintCreate(Resource):
    def post(self):
        data = request.get_json()
        try:
            # Convert date string to datetime object if provided
            date_str = data.get('date')
            date_obj = datetime.strptime(date_str, '%Y-%m-%d') if date_str else None

            new_padprint = PadPrint(
                brand=data.get('brand'),
                season=data.get('season'),
                style=data.get('style'),
                color=data.get('color'),
                padprint_color=data.get('padprint_color'),
                pattern=data.get('pattern'),
                date=date_obj
            )
            db.session.add(new_padprint)
            db.session.commit()
            return new_padprint.to_dict(), 201
        except Exception as e:
            db.session.rollback()  # Rollback on error
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
            padprint.date = data.get('date', padprint.date)
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
