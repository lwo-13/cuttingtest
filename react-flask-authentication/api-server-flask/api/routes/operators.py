from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, SpreadOperator
from datetime import datetime

operators_bp = Blueprint('operators_bp', __name__)
operators_api = Namespace('operators', description="Spreader Operators Management")

@operators_api.route('/')
class OperatorsResource(Resource):
    def get(self):
        """Get all operators"""
        try:
            operators = SpreadOperator.query.all()
            return {"success": True, "data": [op.to_dict() for op in operators]}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
    
    def post(self):
        """Add a new operator"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data.get('name'):
                return {"success": False, "message": "Operator name is required"}, 400
            
            # Check if operator with same name already exists
            existing = SpreadOperator.query.filter_by(name=data['name']).first()
            if existing:
                return {"success": False, "message": "An operator with this name already exists"}, 400
            
            # Create new operator
            new_operator = SpreadOperator(
                name=data['name'],
                active=data.get('active', True)
            )
            
            db.session.add(new_operator)
            db.session.commit()
            
            return {"success": True, "message": "Operator added successfully", "data": new_operator.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@operators_api.route('/<int:operator_id>')
class OperatorResource(Resource):
    def get(self, operator_id):
        """Get a specific operator by ID"""
        try:
            operator = SpreadOperator.query.get(operator_id)
            if not operator:
                return {"success": False, "message": "Operator not found"}, 404
            
            return {"success": True, "data": operator.to_dict()}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
    
    def put(self, operator_id):
        """Update an operator"""
        try:
            operator = SpreadOperator.query.get(operator_id)
            if not operator:
                return {"success": False, "message": "Operator not found"}, 404
            
            data = request.get_json()
            
            # Update fields
            if 'name' in data:
                # Check if name is being changed and if new name already exists
                if data['name'] != operator.name:
                    existing = SpreadOperator.query.filter_by(name=data['name']).first()
                    if existing:
                        return {"success": False, "message": "An operator with this name already exists"}, 400
                operator.name = data['name']
            
            if 'active' in data:
                operator.active = data['active']
            
            operator.updated_at = datetime.now()
            db.session.commit()
            
            return {"success": True, "message": "Operator updated successfully", "data": operator.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500
    
    def delete(self, operator_id):
        """Delete an operator"""
        try:
            operator = SpreadOperator.query.get(operator_id)
            if not operator:
                return {"success": False, "message": "Operator not found"}, 404
            
            db.session.delete(operator)
            db.session.commit()
            
            return {"success": True, "message": "Operator deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500

@operators_api.route('/active')
class ActiveOperatorsResource(Resource):
    def get(self):
        """Get all active operators"""
        try:
            operators = SpreadOperator.query.filter_by(active=True).all()
            return {"success": True, "data": [op.to_dict() for op in operators]}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
