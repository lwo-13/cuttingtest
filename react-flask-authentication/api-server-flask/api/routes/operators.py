from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from api.models import db, Operator
from datetime import datetime

operators_bp = Blueprint('operators_bp', __name__)
operators_api = Namespace('operators', description="Unified Operators Management")

@operators_api.route('/')
class OperatorsResource(Resource):
    def get(self):
        """Get all operators, optionally filtered by type"""
        try:
            operator_type = request.args.get('type')  # Optional filter by type
            active_only = request.args.get('active_only', 'false').lower() == 'true'

            query = Operator.query

            if operator_type:
                query = query.filter_by(operator_type=operator_type.lower())

            if active_only:
                query = query.filter_by(active=True)

            operators = query.all()
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

            if not data.get('operator_type'):
                return {"success": False, "message": "Operator type is required"}, 400

            # Validate operator type
            valid_types = ['spreader', 'cutter', 'collaretto', 'warehouse']
            operator_type = data['operator_type'].lower()
            if operator_type not in valid_types:
                return {"success": False, "message": f"Invalid operator type. Must be one of: {', '.join(valid_types)}"}, 400

            # Check if operator with same name and type already exists
            existing = Operator.query.filter_by(name=data['name'], operator_type=operator_type).first()
            if existing:
                return {"success": False, "message": f"A {operator_type.lower()} operator with this name already exists"}, 400

            # Create new operator
            new_operator = Operator(
                name=data['name'],
                operator_type=operator_type,
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
            operator = Operator.query.get(operator_id)
            if not operator:
                return {"success": False, "message": "Operator not found"}, 404

            return {"success": True, "data": operator.to_dict()}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

    def put(self, operator_id):
        """Update an operator"""
        try:
            operator = Operator.query.get(operator_id)
            if not operator:
                return {"success": False, "message": "Operator not found"}, 404

            data = request.get_json()

            # Update fields
            if 'name' in data:
                # Check if name is being changed and if new name already exists for the same type
                if data['name'] != operator.name:
                    existing = Operator.query.filter_by(
                        name=data['name'],
                        operator_type=operator.operator_type
                    ).first()
                    if existing:
                        return {"success": False, "message": f"A {operator.operator_type.lower()} operator with this name already exists"}, 400
                operator.name = data['name']

            if 'operator_type' in data:
                # Validate operator type
                valid_types = ['spreader', 'cutter', 'collaretto', 'warehouse']
                operator_type = data['operator_type'].lower()
                if operator_type not in valid_types:
                    return {"success": False, "message": f"Invalid operator type. Must be one of: {', '.join(valid_types)}"}, 400

                # Check if name already exists for the new type
                existing = Operator.query.filter_by(
                    name=operator.name,
                    operator_type=operator_type
                ).first()
                if existing and existing.id != operator.id:
                    return {"success": False, "message": f"A {operator_type.lower()} operator with this name already exists"}, 400

                operator.operator_type = operator_type

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
            operator = Operator.query.get(operator_id)
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
        """Get all active operators, optionally filtered by type"""
        try:
            operator_type = request.args.get('type')  # Optional filter by type
            print(f"🔍 ActiveOperators API called with type: {operator_type}")

            query = Operator.query.filter_by(active=True)
            print(f"🔍 Base query created for active operators")

            if operator_type:
                query = query.filter_by(operator_type=operator_type.lower())
                print(f"🔍 Filtered by operator_type: {operator_type.upper()}")

            operators = query.all()
            print(f"🔍 Found {len(operators)} operators")

            result_data = []
            for op in operators:
                op_dict = op.to_dict()
                result_data.append(op_dict)
                print(f"🔍 Operator: {op_dict}")

            return {"success": True, "data": result_data}, 200
        except Exception as e:
            print(f"❌ ActiveOperators API error: {str(e)}")
            import traceback
            print(f"📋 Error traceback: {traceback.format_exc()}")
            return {"success": False, "message": str(e)}, 500

@operators_api.route('/types')
class OperatorTypesResource(Resource):
    def get(self):
        """Get all available operator types"""
        try:
            types = ['spreader', 'cutter', 'collaretto', 'warehouse']
            return {"success": True, "data": types}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@operators_api.route('/type/<string:operator_type>')
class OperatorsByTypeResource(Resource):
    def get(self, operator_type):
        """Get operators by specific type"""
        try:
            valid_types = ['spreader', 'cutter', 'collaretto', 'warehouse']
            operator_type = operator_type.lower()

            if operator_type not in valid_types:
                return {"success": False, "message": f"Invalid operator type. Must be one of: {', '.join(valid_types)}"}, 400

            active_only = request.args.get('active_only', 'false').lower() == 'true'

            operators = Operator.get_by_type(operator_type, active_only)
            return {"success": True, "data": [op.to_dict() for op in operators]}, 200
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
