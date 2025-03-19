# api/routes/padprint.py

from flask import Blueprint, request, jsonify
from flask_restx import Api, Namespace, Resource, fields
from api.models import db, PadPrint
from datetime import datetime

# Create a Blueprint for padprint routes
padprint_bp = Blueprint('padprint', __name__)

# Create a RESTx Namespace for padprint endpoints
padprint_api = Namespace('padprint', description='PadPrint related operations')

# Define the model for Swagger documentation
padprint_model = padprint_api.model('PadPrint', {
    'id': fields.Integer(readonly=True, description='The unique identifier of a padprint'),
    'brand': fields.String(description='Brand of the padprint'),
    'style': fields.String(description='Style of the padprint'),
    'color': fields.String(description='Color of the padprint'),
    'padprint_color': fields.String(description='PadPrint color'),
    'pattern': fields.String(description='Pattern of the padprint'),
    'season': fields.String(description='Season'),
    'date': fields.DateTime(description='Date of the padprint'),
    'image_url': fields.String(description='Image URL of the padprint')
})

@padprint_bp.route("/all", methods=["GET"])
def get_all_padprints():
    padprints = PadPrint.query.all()
    data = [padprint.to_dict() for padprint in padprints]  # Convert to JSON
    print("Sending response:", data)  # Debugging
    return jsonify(data)  # Ensure JSON response

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
        return padprint, 201

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

# Attach the RESTx Namespace to the Blueprint using an Api instance
api = Api(padprint_bp, title='PadPrint API', version='1.0', description='PadPrint operations')
api.add_namespace(padprint_api)
