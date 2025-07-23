from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from api.models import (
    db, Mattresses, MarkerHeader, MattressProductionCenter, 
    OrderLinesView, MattressDetail, MattressMarker
)

# Create Blueprint and API instance
dashboard_bp = Blueprint('dashboard', __name__)
dashboard_api = Namespace('dashboard', description="Dashboard Analytics")

def get_date_range(period):
    """Get start and end dates for the specified period"""
    now = datetime.now()
    
    if period == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'week':
        # Start of current week (Monday)
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    elif period == 'month':
        # Start of current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of current month
        if now.month == 12:
            end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(microseconds=1)
        else:
            end_date = now.replace(month=now.month + 1, day=1) - timedelta(microseconds=1)
    elif period == 'year':
        # Start of current year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of current year
        end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    else:
        # Default to today
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return start_date, end_date

@dashboard_api.route('/orders-worked-on')
class OrdersWorkedOn(Resource):
    def get(self):
        """Get list of orders worked on by planners with date filtering"""
        try:
            period = request.args.get('period', 'today')  # today, week, month, year
            start_date, end_date = get_date_range(period)
            
            # Query orders that have mattresses created/updated in the specified period
            orders_query = db.session.query(
                Mattresses.order_commessa,
                func.min(Mattresses.created_at).label('first_created'),
                func.max(Mattresses.updated_at).label('last_updated'),
                func.count(Mattresses.id).label('mattress_count'),
                # Get order details from OrderLinesView
                OrderLinesView.style,
                OrderLinesView.season,
                OrderLinesView.color_code
            ).join(
                OrderLinesView, Mattresses.order_commessa == OrderLinesView.order_commessa
            ).filter(
                or_(
                    and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date),
                    and_(Mattresses.updated_at >= start_date, Mattresses.updated_at <= end_date)
                )
            ).group_by(
                Mattresses.order_commessa,
                OrderLinesView.style,
                OrderLinesView.season,
                OrderLinesView.color_code
            ).order_by(func.max(Mattresses.updated_at).desc()).all()
            
            result = []
            for order in orders_query:
                # Get production center info for this order
                production_centers = db.session.query(
                    MattressProductionCenter.production_center,
                    MattressProductionCenter.cutting_room,
                    MattressProductionCenter.destination
                ).join(
                    Mattresses, Mattresses.table_id == MattressProductionCenter.table_id
                ).filter(
                    Mattresses.order_commessa == order.order_commessa
                ).distinct().all()
                
                result.append({
                    "order_commessa": order.order_commessa,
                    "style": order.style,
                    "season": order.season,
                    "color_code": order.color_code,
                    "mattress_count": order.mattress_count,
                    "first_created": order.first_created.strftime('%Y-%m-%d %H:%M:%S') if order.first_created else None,
                    "last_updated": order.last_updated.strftime('%Y-%m-%d %H:%M:%S') if order.last_updated else None,
                    "production_centers": [
                        {
                            "production_center": pc.production_center,
                            "cutting_room": pc.cutting_room,
                            "destination": pc.destination
                        } for pc in production_centers
                    ]
                })
            
            return {
                "success": True,
                "data": result,
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@dashboard_api.route('/markers-imported')
class MarkersImported(Resource):
    def get(self):
        """Get list of markers imported with date filtering"""
        try:
            period = request.args.get('period', 'today')  # today, week, month, year
            start_date, end_date = get_date_range(period)
            
            # Query markers created in the specified period
            markers_query = db.session.query(MarkerHeader).filter(
                and_(MarkerHeader.created_at >= start_date, MarkerHeader.created_at <= end_date),
                MarkerHeader.status == 'ACTIVE'
            ).order_by(MarkerHeader.created_at.desc()).all()
            
            result = []
            for marker in markers_query:
                # Check if marker is being used in any mattresses
                usage_count = db.session.query(func.count(MattressMarker.id)).filter(
                    MattressMarker.marker_id == marker.id
                ).scalar()
                
                result.append({
                    "id": marker.id,
                    "marker_name": marker.marker_name,
                    "marker_type": marker.marker_type,
                    "fabric_code": marker.fabric_code,
                    "fabric_type": marker.fabric_type,
                    "marker_width": marker.marker_width,
                    "marker_length": marker.marker_length,
                    "efficiency": marker.efficiency,
                    "total_pcs": marker.total_pcs,
                    "creation_type": marker.creation_type,
                    "model": marker.model,
                    "variant": marker.variant,
                    "created_at": marker.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "usage_count": usage_count
                })
            
            return {
                "success": True,
                "data": result,
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@dashboard_api.route('/statistics')
class DashboardStatistics(Resource):
    def get(self):
        """Get general dashboard statistics"""
        try:
            period = request.args.get('period', 'today')  # today, week, month, year
            start_date, end_date = get_date_range(period)
            
            # Count orders worked on
            orders_count = db.session.query(func.count(func.distinct(Mattresses.order_commessa))).filter(
                or_(
                    and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date),
                    and_(Mattresses.updated_at >= start_date, Mattresses.updated_at <= end_date)
                )
            ).scalar()
            
            # Count markers imported
            markers_count = db.session.query(func.count(MarkerHeader.id)).filter(
                and_(MarkerHeader.created_at >= start_date, MarkerHeader.created_at <= end_date),
                MarkerHeader.status == 'ACTIVE'
            ).scalar()
            
            # Count mattresses created
            mattresses_count = db.session.query(func.count(Mattresses.id)).filter(
                and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date)
            ).scalar()
            
            # Count total consumption planned
            total_consumption = db.session.query(func.sum(MattressDetail.cons_planned)).join(
                Mattresses, Mattresses.id == MattressDetail.mattress_id
            ).filter(
                and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date)
            ).scalar() or 0
            
            return {
                "success": True,
                "data": {
                    "orders_worked_on": orders_count or 0,
                    "markers_imported": markers_count or 0,
                    "mattresses_created": mattresses_count or 0,
                    "total_consumption_planned": round(float(total_consumption), 2)
                },
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200
            
        except Exception as e:
            return {"success": False, "message": str(e)}, 500
