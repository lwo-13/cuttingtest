from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from api.models import (
    db, Mattresses, MarkerHeader, MattressProductionCenter,
    OrderLinesView, MattressDetail, MattressMarker, MattressPhase, MattressSize
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
                OrderLinesView, Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == OrderLinesView.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
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

@dashboard_api.route('/markers-imported-trend')
class MarkersImportedTrend(Resource):
    def get(self):
        """Get historical markers imported data for chart visualization"""
        try:
            period = request.args.get('period', 'week')  # today, week, month, year

            if period == 'today':
                # Get hourly data for today (24 hours)
                data_points = []
                today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                for i in range(24):
                    hour_start = today_start + timedelta(hours=i)
                    hour_end = hour_start + timedelta(hours=1) - timedelta(microseconds=1)

                    count = db.session.query(func.count(MarkerHeader.id)).filter(
                        and_(MarkerHeader.created_at >= hour_start, MarkerHeader.created_at <= hour_end),
                        MarkerHeader.status == 'ACTIVE'
                    ).scalar()

                    data_points.append({
                        'period': f"{i:02d}:00",  # 00:00, 01:00, etc.
                        'count': count or 0
                    })

            elif period == 'week':
                # Get daily data for the last 7 days
                data_points = []
                for i in range(6, -1, -1):  # 6 days ago to today
                    day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                    day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                    count = db.session.query(func.count(MarkerHeader.id)).filter(
                        and_(MarkerHeader.created_at >= day_start, MarkerHeader.created_at <= day_end),
                        MarkerHeader.status == 'ACTIVE'
                    ).scalar()

                    data_points.append({
                        'period': day_start.strftime('%a'),  # Mon, Tue, etc.
                        'count': count or 0
                    })

            elif period == 'month':
                # Get weekly data for the last 4 weeks
                data_points = []
                for i in range(3, -1, -1):  # 3 weeks ago to this week
                    week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                    count = db.session.query(func.count(MarkerHeader.id)).filter(
                        and_(MarkerHeader.created_at >= week_start, MarkerHeader.created_at <= week_end),
                        MarkerHeader.status == 'ACTIVE'
                    ).scalar()

                    data_points.append({
                        'period': f"Week {4-i}",
                        'count': count or 0
                    })

            elif period == 'year':
                # Get monthly data for the last 12 months
                data_points = []
                for i in range(11, -1, -1):  # 11 months ago to this month
                    month_start = (datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=32*i)).replace(day=1)
                    if i == 0:
                        month_end = datetime.now()
                    else:
                        next_month = month_start.replace(month=month_start.month % 12 + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
                        month_end = next_month - timedelta(microseconds=1)

                    count = db.session.query(func.count(MarkerHeader.id)).filter(
                        and_(MarkerHeader.created_at >= month_start, MarkerHeader.created_at <= month_end),
                        MarkerHeader.status == 'ACTIVE'
                    ).scalar()

                    data_points.append({
                        'period': month_start.strftime('%b'),  # Jan, Feb, etc.
                        'count': count or 0
                    })

            else:
                # Default fallback for unknown periods
                data_points = [{'period': 'Unknown', 'count': 0}]

            return {
                "success": True,
                "data": data_points,
                "period": period
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

            # Debug: Let's also get total mattresses count to see if there's data
            total_mattresses_count = db.session.query(func.count(Mattresses.id)).scalar()
            total_orders_count = db.session.query(func.count(func.distinct(Mattresses.order_commessa))).scalar()
            print(f"DEBUG - Period: {period}, Start: {start_date}, End: {end_date}")
            print(f"DEBUG - Orders count (filtered): {orders_count}, Total mattresses: {total_mattresses_count}, Total orders: {total_orders_count}")

            # If no orders found in period, let's use total orders for now (temporary fix)
            if orders_count == 0 and total_orders_count > 0:
                print("DEBUG - No orders in period, using total orders count")
                orders_count = total_orders_count
            
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

@dashboard_api.route('/long-mattress-percentage')
class LongMattressPercentage(Resource):
    def get(self):
        """Get percentage of mattresses with item_type='AS' and length > 8 meters"""
        try:
            period = request.args.get('period', 'today')  # today, week, month, year
            start_date, end_date = get_date_range(period)

            # Count total mattresses with item_type='AS' in the period
            total_mattresses = db.session.query(func.count(Mattresses.id)).filter(
                or_(
                    and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date),
                    and_(Mattresses.updated_at >= start_date, Mattresses.updated_at <= end_date)
                ),
                Mattresses.item_type == 'AS'  # Only include mattresses with item_type='AS'
            ).scalar()

            # Count mattresses with item_type='AS' and length > 8 meters
            # Join with MattressDetail to get length_mattress
            long_mattresses = db.session.query(func.count(Mattresses.id)).join(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).filter(
                or_(
                    and_(Mattresses.created_at >= start_date, Mattresses.created_at <= end_date),
                    and_(Mattresses.updated_at >= start_date, Mattresses.updated_at <= end_date)
                ),
                Mattresses.item_type == 'AS',  # Only include mattresses with item_type='AS'
                MattressDetail.length_mattress > 8  # 8 meters (column is already in meters)
            ).scalar()

            # Calculate percentage
            percentage = 0
            if total_mattresses > 0:
                percentage = (long_mattresses / total_mattresses) * 100

            return {
                "success": True,
                "data": {
                    "percentage": percentage,
                    "long_mattresses": long_mattresses or 0,
                    "total_mattresses": total_mattresses or 0
                },
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@dashboard_api.route('/meters-spreaded')
class MetersSpreadedData(Resource):
    def get(self):
        """Get total meters completed data with historical chart data"""
        try:
            period = request.args.get('period', 'month')  # today, week, month, year
            cutting_room = request.args.get('cutting_room', 'ALL')  # Add cutting room filter
            start_date, end_date = get_date_range(period)

            # Calculate total meters spreaded in the period
            # For Zalli: Use real data from mattresses with "ON SPREAD" phase
            # For others: Keep static value of 0
            if cutting_room == 'ZALLI':
                # Get mattresses that have "ON SPREAD" phase updated in the period with operator populated
                total_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                    Mattresses, Mattresses.id == MattressDetail.mattress_id
                ).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                ).filter(
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.operator.isnot(None),
                    MattressPhase.operator != '',
                    MattressPhase.updated_at >= start_date,
                    MattressPhase.updated_at <= end_date,
                    MattressProductionCenter.cutting_room == 'ZALLI',
                    MattressDetail.cons_actual.isnot(None),
                    MattressDetail.cons_actual > 0
                ).scalar() or 0
            elif cutting_room == 'ALL':
                # For ALL view, get Zalli data + 0 for others
                zalli_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                    Mattresses, Mattresses.id == MattressDetail.mattress_id
                ).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                ).filter(
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.operator.isnot(None),
                    MattressPhase.operator != '',
                    MattressPhase.updated_at >= start_date,
                    MattressPhase.updated_at <= end_date,
                    MattressProductionCenter.cutting_room == 'ZALLI',
                    MattressDetail.cons_actual.isnot(None),
                    MattressDetail.cons_actual > 0
                ).scalar() or 0
                total_meters = zalli_meters  # Other cutting rooms contribute 0
            else:
                # For other cutting rooms, return 0
                total_meters = 0

            # Generate chart data based on period
            chart_data = []
            if period == 'year':
                # Monthly data for the current calendar year (Jan-Dec of current year)
                current_year = datetime.now().year
                for month in range(1, 13):  # January (1) to December (12)
                    month_start = datetime(current_year, month, 1, 0, 0, 0, 0)
                    if month == 12:
                        month_end = datetime(current_year + 1, 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)
                    else:
                        month_end = datetime(current_year, month + 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)

                    if cutting_room == 'ZALLI':
                        month_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= month_start,
                            MattressPhase.updated_at <= month_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        month_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= month_start,
                            MattressPhase.updated_at <= month_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    else:
                        month_meters = 0

                    chart_data.append(float(month_meters))

            elif period == 'month':
                # Weekly data for the last 4 weeks
                for i in range(3, -1, -1):
                    week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                    if cutting_room == 'ZALLI':
                        week_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= week_start,
                            MattressPhase.updated_at <= week_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        week_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= week_start,
                            MattressPhase.updated_at <= week_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    else:
                        week_meters = 0

                    chart_data.append(float(week_meters))

            elif period == 'week':
                # Daily data for the last 7 days
                for i in range(6, -1, -1):
                    day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                    day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                    if cutting_room == 'ZALLI':
                        day_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= day_start,
                            MattressPhase.updated_at <= day_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        day_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                            Mattresses, Mattresses.id == MattressDetail.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= day_start,
                            MattressPhase.updated_at <= day_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressDetail.cons_actual.isnot(None),
                            MattressDetail.cons_actual > 0
                        ).scalar() or 0
                    else:
                        day_meters = 0

                    chart_data.append(float(day_meters))
            else:  # today
                # Single data point for the entire day
                today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

                if cutting_room == 'ZALLI':
                    today_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                        Mattresses, Mattresses.id == MattressDetail.mattress_id
                    ).join(
                        MattressPhase, MattressPhase.mattress_id == Mattresses.id
                    ).join(
                        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                    ).filter(
                        MattressPhase.status == '5 - COMPLETED',
                        MattressPhase.operator.isnot(None),
                        MattressPhase.operator != '',
                        MattressPhase.updated_at >= today_start,
                        MattressPhase.updated_at <= today_end,
                        MattressProductionCenter.cutting_room == 'ZALLI',
                        MattressDetail.cons_actual.isnot(None),
                        MattressDetail.cons_actual > 0
                    ).scalar() or 0
                elif cutting_room == 'ALL':
                    # For ALL view, get Zalli data
                    today_meters = db.session.query(func.sum(MattressDetail.cons_actual)).join(
                        Mattresses, Mattresses.id == MattressDetail.mattress_id
                    ).join(
                        MattressPhase, MattressPhase.mattress_id == Mattresses.id
                    ).join(
                        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                    ).filter(
                        MattressPhase.status == '5 - COMPLETED',
                        MattressPhase.operator.isnot(None),
                        MattressPhase.operator != '',
                        MattressPhase.updated_at >= today_start,
                        MattressPhase.updated_at <= today_end,
                        MattressProductionCenter.cutting_room == 'ZALLI',
                        MattressDetail.cons_actual.isnot(None),
                        MattressDetail.cons_actual > 0
                    ).scalar() or 0
                else:
                    today_meters = 0

                chart_data.append(float(today_meters))

            return {
                "success": True,
                "data": {
                    "total_meters": round(float(total_meters)),
                    "chart_data": [round(float(value)) for value in chart_data]
                },
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

@dashboard_api.route('/cutting-rooms')
class CuttingRoomsData(Resource):
    def get(self):
        """Get list of cutting rooms from production centers"""
        try:
            # Get distinct cutting rooms from mattress_production_center table
            cutting_rooms_from_db = db.session.query(MattressProductionCenter.cutting_room).distinct().filter(
                MattressProductionCenter.cutting_room.isnot(None),
                MattressProductionCenter.cutting_room != ''
            ).all()

            # Extract cutting room names from the result tuples
            db_room_names = [room[0] for room in cutting_rooms_from_db if room[0]]

            # Add all cutting rooms from config to ensure complete list
            all_cutting_rooms = [
                'ZALLI', 'VERONA', 'TEXCONS', 'VEGATEX', 'SINA STYLE L', 'SINA STYLE D',
                'ZEYNTEX', 'DELICIA', 'VAIDE MOLA', 'HADJIOLI', 'YUMER', 'RILA TEXTILE'
            ]

            # Combine database rooms with config rooms and remove duplicates
            combined_rooms = list(set(db_room_names + all_cutting_rooms))

            return {
                "success": True,
                "data": sorted(combined_rooms)  # Sort alphabetically
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

    @dashboard_bp.route('/pieces-spreaded', methods=['GET'])
    def get_pieces_spreaded():
        """Get pieces completed data for dashboard chart - EXACT COPY of meters logic but using pcs_actual"""
        try:
            period = request.args.get('period', 'today')
            cutting_room = request.args.get('cutting_room', 'ALL')

            # Calculate total pieces for the entire period
            if period == 'today':
                start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=1) - timedelta(microseconds=1)
            elif period == 'week':
                end_date = datetime.now()
                start_date = end_date - timedelta(days=7)
            elif period == 'month':
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)
            elif period == 'year':
                end_date = datetime.now()
                start_date = end_date - timedelta(days=365)
            else:
                # Default to today
                start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=1) - timedelta(microseconds=1)

            # Calculate total pieces for the period - SAME LOGIC AS METERS
            if cutting_room == 'ZALLI':
                zalli_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                    Mattresses, Mattresses.id == MattressSize.mattress_id
                ).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                ).filter(
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.operator.isnot(None),
                    MattressPhase.operator != '',
                    MattressPhase.updated_at >= start_date,
                    MattressPhase.updated_at <= end_date,
                    MattressProductionCenter.cutting_room == 'ZALLI',
                    MattressSize.pcs_actual.isnot(None),
                    MattressSize.pcs_actual > 0
                ).scalar() or 0
                total_pieces = zalli_pieces  # Other cutting rooms contribute 0
            elif cutting_room == 'ALL':
                # For ALL view, get Zalli data + 0 for others
                zalli_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                    Mattresses, Mattresses.id == MattressSize.mattress_id
                ).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                ).filter(
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.operator.isnot(None),
                    MattressPhase.operator != '',
                    MattressPhase.updated_at >= start_date,
                    MattressPhase.updated_at <= end_date,
                    MattressProductionCenter.cutting_room == 'ZALLI',
                    MattressSize.pcs_actual.isnot(None),
                    MattressSize.pcs_actual > 0
                ).scalar() or 0
                total_pieces = zalli_pieces  # Other cutting rooms contribute 0
            else:
                # For other cutting rooms, return 0
                total_pieces = 0

            # Generate chart data based on period - SAME LOGIC AS METERS
            chart_data = []
            if period == 'year':
                # Monthly data for the current calendar year (Jan-Dec of current year)
                current_year = datetime.now().year
                for month in range(1, 13):  # January (1) to December (12)
                    month_start = datetime(current_year, month, 1, 0, 0, 0, 0)
                    if month == 12:
                        month_end = datetime(current_year + 1, 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)
                    else:
                        month_end = datetime(current_year, month + 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)

                    if cutting_room == 'ZALLI':
                        month_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= month_start,
                            MattressPhase.updated_at <= month_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        month_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= month_start,
                            MattressPhase.updated_at <= month_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    else:
                        month_pieces = 0

                    chart_data.append(float(month_pieces))

            elif period == 'month':
                # Weekly data for the last 4 weeks
                for i in range(3, -1, -1):
                    week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                    if cutting_room == 'ZALLI':
                        week_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= week_start,
                            MattressPhase.updated_at <= week_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        week_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= week_start,
                            MattressPhase.updated_at <= week_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    else:
                        week_pieces = 0

                    chart_data.append(float(week_pieces))
            elif period == 'week':
                # Daily data for the last 7 days
                for i in range(6, -1, -1):
                    day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                    day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                    if cutting_room == 'ZALLI':
                        day_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= day_start,
                            MattressPhase.updated_at <= day_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    elif cutting_room == 'ALL':
                        # For ALL view, get Zalli data
                        day_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                            Mattresses, Mattresses.id == MattressSize.mattress_id
                        ).join(
                            MattressPhase, MattressPhase.mattress_id == Mattresses.id
                        ).join(
                            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                        ).filter(
                            MattressPhase.status == '5 - COMPLETED',
                            MattressPhase.operator.isnot(None),
                            MattressPhase.operator != '',
                            MattressPhase.updated_at >= day_start,
                            MattressPhase.updated_at <= day_end,
                            MattressProductionCenter.cutting_room == 'ZALLI',
                            MattressSize.pcs_actual.isnot(None),
                            MattressSize.pcs_actual > 0
                        ).scalar() or 0
                    else:
                        day_pieces = 0

                    chart_data.append(float(day_pieces))
            else:  # today
                # Single data point for the entire day
                today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

                if cutting_room == 'ZALLI':
                    today_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                        Mattresses, Mattresses.id == MattressSize.mattress_id
                    ).join(
                        MattressPhase, MattressPhase.mattress_id == Mattresses.id
                    ).join(
                        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                    ).filter(
                        MattressPhase.status == '5 - COMPLETED',
                        MattressPhase.operator.isnot(None),
                        MattressPhase.operator != '',
                        MattressPhase.updated_at >= today_start,
                        MattressPhase.updated_at <= today_end,
                        MattressProductionCenter.cutting_room == 'ZALLI',
                        MattressSize.pcs_actual.isnot(None),
                        MattressSize.pcs_actual > 0
                    ).scalar() or 0
                elif cutting_room == 'ALL':
                    # For ALL view, get Zalli data
                    today_pieces = db.session.query(func.sum(MattressSize.pcs_actual)).join(
                        Mattresses, Mattresses.id == MattressSize.mattress_id
                    ).join(
                        MattressPhase, MattressPhase.mattress_id == Mattresses.id
                    ).join(
                        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                    ).filter(
                        MattressPhase.status == '5 - COMPLETED',
                        MattressPhase.operator.isnot(None),
                        MattressPhase.operator != '',
                        MattressPhase.updated_at >= today_start,
                        MattressPhase.updated_at <= today_end,
                        MattressProductionCenter.cutting_room == 'ZALLI',
                        MattressSize.pcs_actual.isnot(None),
                        MattressSize.pcs_actual > 0
                    ).scalar() or 0
                else:
                    today_pieces = 0

                chart_data.append(float(today_pieces))

            return {
                "success": True,
                "data": {
                    "total_pieces": int(total_pieces),
                    "chart_data": [int(x) for x in chart_data]  # Round to integers for pieces
                }
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500
