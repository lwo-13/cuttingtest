from flask import Blueprint, jsonify, current_app, send_from_directory, request
from flask_restx import Namespace, Resource
from werkzeug.utils import secure_filename
import os
from api.models import db, PadPrint

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

'''
@padprint_api.expect(padprint_model, validate=True)
@padprint_api.marshal_with(padprint_model, code=201)
def post(self):
    """Create a new padprint"""
    data = request.json
    if data.get('date'):
        try:
            data['date'] = datetime.fromisoformat(data['date'])
        except ValueError:
            data['date'] = None
    padprint = PadPrint(**data)
    db.session.add(padprint)
    db.session.commit()
    return padprint, 201'
    '''
'''
@padprint_api.route('/<int:id>')
@padprint_api.param('id', 'The PadPrint identifier')
class PadPrintResource(Resource):
    @padprint_api.marshal_with(padprint_model)
    def get(self, id):
        """Fetch a padprint given its identifier"""
        padprint = PadPrint.query.get_or_404(id)
        return padprint

    @padprint_api.expect(padprint_model, validate=True)
    @padprint_api.marshal_with(padprint_model)
    def put(self, id):
        """Update a padprint given its identifier"""
        padprint = PadPrint.query.get_or_404(id)
        data = request.json
        if data.get('date'):
            try:
                data['date'] = datetime.fromisoformat(data['date'])
            except ValueError:
                data['date'] = None
        for key, value in data.items():
            setattr(padprint, key, value)
        db.session.commit()
        return padprint, 200

    def delete(self, id):
        """Delete a padprint given its identifier"""
        padprint = PadPrint.query.get_or_404(id)
        db.session.delete(padprint)
        db.session.commit()
        return {'message': 'PadPrint deleted successfully'}, 200
'''