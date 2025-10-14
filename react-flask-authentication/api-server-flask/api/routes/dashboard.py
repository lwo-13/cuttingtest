from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from api.models import (
    db, Mattresses, MarkerHeader, MattressProductionCenter,
    OrderLinesView, MattressDetail, MattressMarker, MattressPhase, MattressSize, ZalliItemsView
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
        # Last 7 days (rolling 7 days from today)
        start_date = now - timedelta(days=6)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'month':
        # Last 30 days (rolling 30 days from today)
        start_date = now - timedelta(days=29)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == 'year':
        # Last 365 days (rolling year from today)
        start_date = now - timedelta(days=364)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
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

            # If no orders found in period, let's use total orders for now (temporary fix)
            if orders_count == 0 and total_orders_count > 0:
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
        """Get percentage of completed mattresses with item_type='AS' and length > threshold meters"""
        try:
            period = request.args.get('period', 'today')  # today, week, month, year
            threshold = int(request.args.get('threshold', 8))  # 6, 8, or 10 meters
            start_date, end_date = get_date_range(period)

            # Helper function to get percentage for a date range
            def get_percentage_for_range(range_start, range_end):
                total = db.session.query(func.count(Mattresses.id)).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).filter(
                    MattressPhase.active == True,
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.updated_at >= range_start,
                    MattressPhase.updated_at <= range_end,
                    Mattresses.item_type == 'AS'
                ).scalar()

                long = db.session.query(func.count(Mattresses.id)).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressDetail, Mattresses.id == MattressDetail.mattress_id
                ).filter(
                    MattressPhase.active == True,
                    MattressPhase.status == '5 - COMPLETED',
                    MattressPhase.updated_at >= range_start,
                    MattressPhase.updated_at <= range_end,
                    Mattresses.item_type == 'AS',
                    MattressDetail.length_mattress > threshold
                ).scalar()

                if total and total > 0:
                    return (long / total) * 100, long, total
                return 0, 0, 0

            # Calculate previous period dates for trend comparison
            now = datetime.now()
            if period == 'today':
                # Compare today vs yesterday (or closest previous day with data)
                prev_start_date = None
                prev_end_date = None

                # Try to find the closest previous day with data (up to 30 days back)
                for days_back in range(1, 31):
                    temp_start = (now - timedelta(days=days_back)).replace(hour=0, minute=0, second=0, microsecond=0)
                    temp_end = (now - timedelta(days=days_back)).replace(hour=23, minute=59, second=59, microsecond=999999)

                    # Check if this day has data
                    _, _, total = get_percentage_for_range(temp_start, temp_end)
                    if total > 0:
                        prev_start_date = temp_start
                        prev_end_date = temp_end
                        break

                # If no previous day with data found, use yesterday anyway
                if prev_start_date is None:
                    prev_start_date = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                    prev_end_date = (now - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                # Compare last 7 days vs previous 7 days
                prev_start_date = now - timedelta(days=13)
                prev_start_date = prev_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                prev_end_date = now - timedelta(days=7)
                prev_end_date = prev_end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'month':
                # Compare last 30 days vs previous 30 days
                prev_start_date = now - timedelta(days=59)
                prev_start_date = prev_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                prev_end_date = now - timedelta(days=30)
                prev_end_date = prev_end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'year':
                # Compare last 365 days vs previous 365 days
                prev_start_date = now - timedelta(days=729)
                prev_start_date = prev_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                prev_end_date = now - timedelta(days=365)
                prev_end_date = prev_end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                prev_start_date = start_date
                prev_end_date = end_date

            # Get current period data
            percentage, long_mattresses, total_mattresses = get_percentage_for_range(start_date, end_date)

            # Get previous period data
            prev_percentage, prev_long_mattresses, prev_total_mattresses = get_percentage_for_range(prev_start_date, prev_end_date)

            # Calculate trend
            trend = None
            trend_value = 0
            if prev_percentage > 0:
                trend_value = percentage - prev_percentage
                if trend_value > 0:
                    trend = 'up'
                elif trend_value < 0:
                    trend = 'down'
                else:
                    trend = 'stable'
            elif percentage > 0:
                trend = 'up'
                trend_value = percentage

            return {
                "success": True,
                "data": {
                    "percentage": percentage,
                    "long_mattresses": long_mattresses or 0,
                    "total_mattresses": total_mattresses or 0,
                    "threshold": threshold,
                    "trend": trend,
                    "trend_value": round(trend_value, 1),
                    "previous_percentage": prev_percentage
                },
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                },
                "previous_date_range": {
                    "start": prev_start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": prev_end_date.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500

def get_meters_for_period(start_date, end_date, cutting_room='ALL'):
    """
    Helper function to get total meters for a specific period and cutting room.
    Supports all cutting rooms, not just ZALLI.
    Uses operator/device from "2 - ON SPREAD" phase, falls back to "5 - COMPLETED" if empty.
    """
    # Subquery to get operator from "2 - ON SPREAD" phase
    spread_phase_subquery = db.session.query(
        MattressPhase.mattress_id,
        MattressPhase.operator.label('spread_operator'),
        MattressPhase.device.label('spread_device')
    ).filter(
        MattressPhase.status == '2 - ON SPREAD'
    ).subquery()

    # Main query joins with completed phase and spread phase
    base_query = db.session.query(func.sum(MattressDetail.cons_actual)).join(
        Mattresses, Mattresses.id == MattressDetail.mattress_id
    ).join(
        MattressPhase, MattressPhase.mattress_id == Mattresses.id
    ).outerjoin(
        spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
    ).join(
        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
    ).filter(
        MattressPhase.active == True,  # Only active phases
        MattressPhase.status == '5 - COMPLETED',
        MattressPhase.updated_at >= start_date,
        MattressPhase.updated_at <= end_date,
        MattressDetail.cons_actual.isnot(None),
        MattressDetail.cons_actual > 0,
        # Use operator from spread phase if available, otherwise from completed phase
        or_(
            and_(spread_phase_subquery.c.spread_operator.isnot(None), spread_phase_subquery.c.spread_operator != ''),
            and_(MattressPhase.operator.isnot(None), MattressPhase.operator != '')
        )
    )

    # Apply cutting room filter
    if cutting_room != 'ALL':
        base_query = base_query.filter(MattressProductionCenter.cutting_room == cutting_room)

    return base_query.scalar() or 0

def get_pieces_for_period(start_date, end_date, cutting_room='ALL'):
    """
    Helper function to get total pieces for a specific period and cutting room.
    Supports all cutting rooms, similar to get_meters_for_period but using pcs_actual.
    Uses operator/device from "2 - ON SPREAD" phase, falls back to "5 - COMPLETED" if empty.
    """
    # Subquery to get operator from "2 - ON SPREAD" phase
    spread_phase_subquery = db.session.query(
        MattressPhase.mattress_id,
        MattressPhase.operator.label('spread_operator'),
        MattressPhase.device.label('spread_device')
    ).filter(
        MattressPhase.status == '2 - ON SPREAD'
    ).subquery()

    # Main query joins with completed phase and spread phase
    base_query = db.session.query(func.sum(MattressSize.pcs_actual)).join(
        Mattresses, Mattresses.id == MattressSize.mattress_id
    ).join(
        MattressPhase, MattressPhase.mattress_id == Mattresses.id
    ).outerjoin(
        spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
    ).join(
        MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
    ).filter(
        MattressPhase.active == True,  # Only active phases
        MattressPhase.status == '5 - COMPLETED',
        MattressPhase.updated_at >= start_date,
        MattressPhase.updated_at <= end_date,
        MattressSize.pcs_actual.isnot(None),
        MattressSize.pcs_actual > 0,
        # Use operator from spread phase if available, otherwise from completed phase
        or_(
            and_(spread_phase_subquery.c.spread_operator.isnot(None), spread_phase_subquery.c.spread_operator != ''),
            and_(MattressPhase.operator.isnot(None), MattressPhase.operator != '')
        )
    )

    # Apply cutting room filter
    if cutting_room != 'ALL':
        base_query = base_query.filter(MattressProductionCenter.cutting_room == cutting_room)

    return base_query.scalar() or 0

def get_meters_with_breakdown(start_date, end_date, cutting_room='ALL', breakdown=None):
    """
    Helper function to get meters grouped by breakdown dimension.
    Returns a dictionary with breakdown values as keys and meters as values.
    """
    # Build base query
    if breakdown == 'brand':
        # First, get a subquery to get unique style per order (to avoid duplication from OrderLinesView)
        style_subquery = db.session.query(
            OrderLinesView.order_commessa,
            func.max(OrderLinesView.style).label('style')
        ).group_by(OrderLinesView.order_commessa).subquery()

        # Join with style subquery to get style, then lookup brand
        query = db.session.query(
            style_subquery.c.style,
            func.sum(MattressDetail.cons_actual).label('total_meters')
        ).select_from(MattressDetail).join(
            Mattresses, Mattresses.id == MattressDetail.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).join(
            style_subquery, Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == style_subquery.c.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.operator.isnot(None),
            MattressPhase.operator != '',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(style_subquery.c.style)
        results = query.all()

        # Map styles to brands
        breakdown_data = {}
        for style, meters in results:
            # Lookup brand for this style
            brand_item = ZalliItemsView.query.filter_by(item_no=style).first()
            brand = brand_item.brand if brand_item and brand_item.brand else 'Unknown'

            # Normalize brand name
            brand = brand.upper().strip()
            if brand == 'INTIMISSIM':
                brand = 'INTIMISSIMI'

            if brand in breakdown_data:
                breakdown_data[brand] += float(meters or 0)
            else:
                breakdown_data[brand] = float(meters or 0)

        return breakdown_data

    elif breakdown == 'style':
        # First, get a subquery to get unique style per order (to avoid duplication from OrderLinesView)
        style_subquery = db.session.query(
            OrderLinesView.order_commessa,
            func.max(OrderLinesView.style).label('style')
        ).group_by(OrderLinesView.order_commessa).subquery()

        query = db.session.query(
            style_subquery.c.style,
            func.sum(MattressDetail.cons_actual).label('total_meters')
        ).select_from(MattressDetail).join(
            Mattresses, Mattresses.id == MattressDetail.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).join(
            style_subquery, Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == style_subquery.c.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.operator.isnot(None),
            MattressPhase.operator != '',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(style_subquery.c.style)
        results = query.all()

        return {style: float(meters or 0) for style, meters in results}

    elif breakdown == 'spreader':
        # Subquery to get device from "2 - ON SPREAD" phase
        spread_phase_subquery = db.session.query(
            MattressPhase.mattress_id,
            MattressPhase.device.label('spread_device')
        ).filter(
            MattressPhase.status == '2 - ON SPREAD'
        ).subquery()

        # Use COALESCE to prioritize spread phase device over completed phase device
        query = db.session.query(
            func.coalesce(spread_phase_subquery.c.spread_device, MattressPhase.device).label('device'),
            func.sum(MattressDetail.cons_actual).label('total_meters')
        ).select_from(MattressDetail).join(
            Mattresses, Mattresses.id == MattressDetail.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).outerjoin(
            spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            # Ensure we have a device from either phase
            or_(
                and_(spread_phase_subquery.c.spread_device.isnot(None), spread_phase_subquery.c.spread_device != ''),
                and_(MattressPhase.device.isnot(None), MattressPhase.device != '')
            )
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(func.coalesce(spread_phase_subquery.c.spread_device, MattressPhase.device))
        results = query.all()

        return {device or 'Unknown': float(meters or 0) for device, meters in results}

    elif breakdown == 'operator':
        # Subquery to get operator from "2 - ON SPREAD" phase
        spread_phase_subquery = db.session.query(
            MattressPhase.mattress_id,
            MattressPhase.operator.label('spread_operator')
        ).filter(
            MattressPhase.status == '2 - ON SPREAD'
        ).subquery()

        # Use COALESCE to prioritize spread phase operator over completed phase operator
        query = db.session.query(
            func.coalesce(spread_phase_subquery.c.spread_operator, MattressPhase.operator).label('operator'),
            func.sum(MattressDetail.cons_actual).label('total_meters')
        ).select_from(MattressDetail).join(
            Mattresses, Mattresses.id == MattressDetail.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).outerjoin(
            spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            # Ensure we have an operator from either phase
            or_(
                and_(spread_phase_subquery.c.spread_operator.isnot(None), spread_phase_subquery.c.spread_operator != ''),
                and_(MattressPhase.operator.isnot(None), MattressPhase.operator != '')
            )
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(func.coalesce(spread_phase_subquery.c.spread_operator, MattressPhase.operator))
        results = query.all()

        return {operator: float(meters or 0) for operator, meters in results}

    else:
        # No breakdown, return total
        total = get_meters_for_period(start_date, end_date, cutting_room)
        return {'Total': total}

def get_pieces_with_breakdown(start_date, end_date, cutting_room='ALL', breakdown=None):
    """
    Helper function to get pieces grouped by breakdown dimension.
    Returns a dictionary with breakdown values as keys and pieces as values.
    """
    # Build base query
    if breakdown == 'brand':
        # First, get a subquery to get unique style per order (to avoid duplication from OrderLinesView)
        style_subquery = db.session.query(
            OrderLinesView.order_commessa,
            func.max(OrderLinesView.style).label('style')
        ).group_by(OrderLinesView.order_commessa).subquery()

        # Join with style subquery to get style, then lookup brand
        query = db.session.query(
            style_subquery.c.style,
            func.sum(MattressSize.pcs_actual).label('total_pieces')
        ).select_from(MattressSize).join(
            Mattresses, Mattresses.id == MattressSize.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).join(
            style_subquery, Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == style_subquery.c.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.operator.isnot(None),
            MattressPhase.operator != '',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressSize.pcs_actual.isnot(None),
            MattressSize.pcs_actual > 0
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(style_subquery.c.style)
        results = query.all()

        # Map styles to brands
        breakdown_data = {}
        for style, pieces in results:
            # Lookup brand for this style
            brand_item = ZalliItemsView.query.filter_by(item_no=style).first()
            brand = brand_item.brand if brand_item and brand_item.brand else 'Unknown'

            # Normalize brand name
            brand = brand.upper().strip()
            if brand == 'INTIMISSIM':
                brand = 'INTIMISSIMI'

            if brand in breakdown_data:
                breakdown_data[brand] += float(pieces or 0)
            else:
                breakdown_data[brand] = float(pieces or 0)

        return breakdown_data

    elif breakdown == 'style':
        # First, get a subquery to get unique style per order (to avoid duplication from OrderLinesView)
        style_subquery = db.session.query(
            OrderLinesView.order_commessa,
            func.max(OrderLinesView.style).label('style')
        ).group_by(OrderLinesView.order_commessa).subquery()

        query = db.session.query(
            style_subquery.c.style,
            func.sum(MattressSize.pcs_actual).label('total_pieces')
        ).select_from(MattressSize).join(
            Mattresses, Mattresses.id == MattressSize.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).join(
            style_subquery, Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == style_subquery.c.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.operator.isnot(None),
            MattressPhase.operator != '',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressSize.pcs_actual.isnot(None),
            MattressSize.pcs_actual > 0
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(style_subquery.c.style)
        results = query.all()

        return {style: float(pieces or 0) for style, pieces in results}

    elif breakdown == 'spreader':
        # Subquery to get device from "2 - ON SPREAD" phase
        spread_phase_subquery = db.session.query(
            MattressPhase.mattress_id,
            MattressPhase.device.label('spread_device')
        ).filter(
            MattressPhase.status == '2 - ON SPREAD'
        ).subquery()

        # Use COALESCE to prioritize spread phase device over completed phase device
        query = db.session.query(
            func.coalesce(spread_phase_subquery.c.spread_device, MattressPhase.device).label('device'),
            func.sum(MattressSize.pcs_actual).label('total_pieces')
        ).select_from(MattressSize).join(
            Mattresses, Mattresses.id == MattressSize.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).outerjoin(
            spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressSize.pcs_actual.isnot(None),
            MattressSize.pcs_actual > 0,
            # Ensure we have a device from either phase
            or_(
                and_(spread_phase_subquery.c.spread_device.isnot(None), spread_phase_subquery.c.spread_device != ''),
                and_(MattressPhase.device.isnot(None), MattressPhase.device != '')
            )
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(func.coalesce(spread_phase_subquery.c.spread_device, MattressPhase.device))
        results = query.all()

        return {device or 'Unknown': float(pieces or 0) for device, pieces in results}

    elif breakdown == 'operator':
        # Subquery to get operator from "2 - ON SPREAD" phase
        spread_phase_subquery = db.session.query(
            MattressPhase.mattress_id,
            MattressPhase.operator.label('spread_operator')
        ).filter(
            MattressPhase.status == '2 - ON SPREAD'
        ).subquery()

        # Use COALESCE to prioritize spread phase operator over completed phase operator
        query = db.session.query(
            func.coalesce(spread_phase_subquery.c.spread_operator, MattressPhase.operator).label('operator'),
            func.sum(MattressSize.pcs_actual).label('total_pieces')
        ).select_from(MattressSize).join(
            Mattresses, Mattresses.id == MattressSize.mattress_id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).outerjoin(
            spread_phase_subquery, spread_phase_subquery.c.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressPhase.updated_at >= start_date,
            MattressPhase.updated_at <= end_date,
            MattressSize.pcs_actual.isnot(None),
            MattressSize.pcs_actual > 0,
            # Ensure we have an operator from either phase
            or_(
                and_(spread_phase_subquery.c.spread_operator.isnot(None), spread_phase_subquery.c.spread_operator != ''),
                and_(MattressPhase.operator.isnot(None), MattressPhase.operator != '')
            )
        )

        if cutting_room != 'ALL':
            query = query.filter(MattressProductionCenter.cutting_room == cutting_room)

        query = query.group_by(func.coalesce(spread_phase_subquery.c.spread_operator, MattressPhase.operator))
        results = query.all()

        return {operator: float(pieces or 0) for operator, pieces in results}

    else:
        # No breakdown, return total
        total = get_pieces_for_period(start_date, end_date, cutting_room)
        return {'Total': total}

@dashboard_api.route('/meters-spreaded')
class MetersSpreadedData(Resource):
    def get(self):
        """Get total meters completed data with historical chart data"""
        try:
            period = request.args.get('period', 'month')  # today, week, month, year
            cutting_room = request.args.get('cutting_room', 'ALL')  # Add cutting room filter
            breakdown = request.args.get('breakdown', None)  # Add breakdown parameter
            start_date, end_date = get_date_range(period)

            # Calculate total meters spreaded in the period using helper function
            total_meters = get_meters_for_period(start_date, end_date, cutting_room)

            # Generate chart data based on period
            if breakdown:
                # With breakdown, return multiple series
                breakdown_series = {}
                all_keys = set()  # Track all unique breakdown keys across all periods
                period_data = []  # Store breakdown data for each period

                if period == 'year':
                    # Monthly data for the current calendar year (Jan-Dec of current year)
                    current_year = datetime.now().year
                    for month in range(1, 13):  # January (1) to December (12)
                        month_start = datetime(current_year, month, 1, 0, 0, 0, 0)
                        if month == 12:
                            month_end = datetime(current_year + 1, 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)
                        else:
                            month_end = datetime(current_year, month + 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)

                        month_breakdown = get_meters_with_breakdown(month_start, month_end, cutting_room, breakdown)
                        period_data.append(month_breakdown)
                        all_keys.update(month_breakdown.keys())

                elif period == 'month':
                    # Weekly data for the last 4 weeks
                    for i in range(3, -1, -1):
                        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                        week_breakdown = get_meters_with_breakdown(week_start, week_end, cutting_room, breakdown)
                        period_data.append(week_breakdown)
                        all_keys.update(week_breakdown.keys())

                elif period == 'week':
                    # Daily data for the last 7 days
                    for i in range(6, -1, -1):
                        day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                        day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                        day_breakdown = get_meters_with_breakdown(day_start, day_end, cutting_room, breakdown)
                        period_data.append(day_breakdown)
                        all_keys.update(day_breakdown.keys())
                else:  # today
                    # Single data point for the entire day
                    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

                    today_breakdown = get_meters_with_breakdown(today_start, today_end, cutting_room, breakdown)
                    period_data.append(today_breakdown)
                    all_keys.update(today_breakdown.keys())

                # Now build the series ensuring all keys have values for all periods
                for key in all_keys:
                    breakdown_series[key] = []
                    for period_breakdown in period_data:
                        breakdown_series[key].append(float(period_breakdown.get(key, 0)))

                return {
                    "success": True,
                    "data": {
                        "total_meters": round(float(total_meters)),
                        "breakdown_series": {k: [round(float(v)) for v in vals] for k, vals in breakdown_series.items()}
                    },
                    "period": period,
                    "date_range": {
                        "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                        "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                    }
                }, 200
            else:
                # Without breakdown, return single series
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

                        month_meters = get_meters_for_period(month_start, month_end, cutting_room)
                        chart_data.append(float(month_meters))

                elif period == 'month':
                    # Weekly data for the last 4 weeks
                    for i in range(3, -1, -1):
                        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                        week_meters = get_meters_for_period(week_start, week_end, cutting_room)
                        chart_data.append(float(week_meters))

                elif period == 'week':
                    # Daily data for the last 7 days
                    for i in range(6, -1, -1):
                        day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                        day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                        day_meters = get_meters_for_period(day_start, day_end, cutting_room)
                        chart_data.append(float(day_meters))
                else:  # today
                    # Single data point for the entire day
                    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    today_end = today_start + timedelta(days=1) - timedelta(microseconds=1)

                    today_meters = get_meters_for_period(today_start, today_end, cutting_room)
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

@dashboard_api.route('/meters-raw-data')
class MetersRawData(Resource):
    def get(self):
        """Get raw mattress data for frontend filtering and aggregation"""
        try:
            period = request.args.get('period', 'month')
            cutting_room = request.args.get('cutting_room', 'ALL')
            start_date, end_date = get_date_range(period)

            # Build base query for completed mattresses
            base_query = db.session.query(
                Mattresses.id,
                Mattresses.order_commessa,
                Mattresses.created_at,
                Mattresses.fabric_code,
                MattressDetail.cons_actual,
                MattressPhase.updated_at,
                MattressProductionCenter.cutting_room
            ).join(
                MattressDetail, Mattresses.id == MattressDetail.mattress_id
            ).join(
                MattressPhase, Mattresses.id == MattressPhase.mattress_id
            ).join(
                MattressProductionCenter, Mattresses.table_id == MattressProductionCenter.table_id
            ).filter(
                MattressPhase.status == '5 - COMPLETED',
                MattressPhase.active == True,
                MattressPhase.updated_at >= start_date,
                MattressPhase.updated_at <= end_date
            )

            # Apply cutting room filter
            if cutting_room != 'ALL':
                base_query = base_query.filter(
                    MattressProductionCenter.cutting_room.collate('SQL_Latin1_General_CP1_CI_AS') == cutting_room
                )

            # Execute query
            results = base_query.all()

            # Get style info for each order
            order_styles = {}
            for row in results:
                if row.order_commessa not in order_styles:
                    style_info = db.session.query(
                        OrderLinesView.style
                    ).filter(
                        OrderLinesView.order_commessa == row.order_commessa
                    ).first()
                    order_styles[row.order_commessa] = style_info.style if style_info else None

            # Build mattress data
            mattress_data = []
            for row in results:
                mattress_data.append({
                    'mattress_id': row.id,
                    'order_commessa': row.order_commessa,
                    'cons_actual': float(row.cons_actual or 0),
                    'completed_date': row.updated_at.strftime('%Y-%m-%d %H:%M:%S') if row.updated_at else None,
                    'cutting_room': row.cutting_room,
                    'style': order_styles.get(row.order_commessa),
                    'fabric_code': row.fabric_code
                })

            return {
                "success": True,
                "data": mattress_data,
                "period": period,
                "cutting_room": cutting_room,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                },
                "total_records": len(mattress_data)
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

@dashboard_api.route('/pieces-spreaded')
class PiecesSpreadedData(Resource):
    def get(self):
        """Get pieces completed data for dashboard chart with breakdown support"""
        try:
            period = request.args.get('period', 'today')
            cutting_room = request.args.get('cutting_room', 'ALL')
            breakdown = request.args.get('breakdown', None)  # Add breakdown parameter
            start_date, end_date = get_date_range(period)

            # Calculate total pieces for the period using helper function
            total_pieces = get_pieces_for_period(start_date, end_date, cutting_room)

            # Generate chart data based on period
            if breakdown:
                # With breakdown, return multiple series
                breakdown_series = {}
                all_keys = set()  # Track all unique breakdown keys across all periods
                period_data = []  # Store breakdown data for each period

                if period == 'year':
                    # Monthly data for the current calendar year (Jan-Dec of current year)
                    current_year = datetime.now().year
                    for month in range(1, 13):  # January (1) to December (12)
                        month_start = datetime(current_year, month, 1, 0, 0, 0, 0)
                        if month == 12:
                            month_end = datetime(current_year + 1, 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)
                        else:
                            month_end = datetime(current_year, month + 1, 1, 0, 0, 0, 0) - timedelta(microseconds=1)

                        month_breakdown = get_pieces_with_breakdown(month_start, month_end, cutting_room, breakdown)
                        period_data.append(month_breakdown)
                        all_keys.update(month_breakdown.keys())

                elif period == 'month':
                    # Weekly data for the last 4 weeks
                    for i in range(3, -1, -1):
                        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                        week_breakdown = get_pieces_with_breakdown(week_start, week_end, cutting_room, breakdown)
                        period_data.append(week_breakdown)
                        all_keys.update(week_breakdown.keys())

                elif period == 'week':
                    # Daily data for the last 7 days
                    for i in range(6, -1, -1):
                        day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                        day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                        day_breakdown = get_pieces_with_breakdown(day_start, day_end, cutting_room, breakdown)
                        period_data.append(day_breakdown)
                        all_keys.update(day_breakdown.keys())

                else:  # today
                    # Single data point for the entire day
                    today_breakdown = get_pieces_with_breakdown(start_date, end_date, cutting_room, breakdown)
                    period_data.append(today_breakdown)
                    all_keys.update(today_breakdown.keys())

                # Convert to series format
                for key in all_keys:
                    breakdown_series[key] = []
                    for period_breakdown in period_data:
                        breakdown_series[key].append(int(period_breakdown.get(key, 0)))

                return {
                    "success": True,
                    "data": {
                        "total_pieces": int(total_pieces),
                        "breakdown_data": get_pieces_with_breakdown(start_date, end_date, cutting_room, breakdown),
                        "chart_data": breakdown_series
                    }
                }, 200

            else:
                # Without breakdown, return simple chart data
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

                        month_pieces = get_pieces_for_period(month_start, month_end, cutting_room)
                        chart_data.append(float(month_pieces))

                elif period == 'month':
                    # Weekly data for the last 4 weeks
                    for i in range(3, -1, -1):
                        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(weeks=i, days=datetime.now().weekday())
                        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

                        week_pieces = get_pieces_for_period(week_start, week_end, cutting_room)
                        chart_data.append(float(week_pieces))
                elif period == 'week':
                    # Daily data for the last 7 days
                    for i in range(6, -1, -1):
                        day_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
                        day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)

                        day_pieces = get_pieces_for_period(day_start, day_end, cutting_room)
                        chart_data.append(float(day_pieces))
                else:  # today
                    # Single data point for the entire day
                    today_pieces = total_pieces  # Use the already calculated total for today
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

@dashboard_api.route('/top-fabrics')
class TopFabrics(Resource):
    def get(self):
        """Get top fabrics by total meters spreaded"""
        try:
            period = request.args.get('period', 'today')
            cutting_room = request.args.get('cuttingRoom', 'ALL')
            limit = int(request.args.get('limit', 10))

            start_date, end_date = get_date_range(period)

            # First, get fabric codes with total meters
            fabric_totals_query = db.session.query(
                Mattresses.fabric_code,
                func.sum(MattressDetail.cons_actual).label('total_meters')
            ).join(
                MattressDetail, MattressDetail.mattress_id == Mattresses.id
            ).join(
                MattressPhase, MattressPhase.mattress_id == Mattresses.id
            ).join(
                MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
            )

            # Apply filters
            filters = [
                MattressPhase.status == '5 - COMPLETED',
                MattressPhase.operator.isnot(None),
                MattressPhase.operator != '',
                MattressPhase.updated_at >= start_date,
                MattressPhase.updated_at <= end_date,
                MattressDetail.cons_actual.isnot(None),
                MattressDetail.cons_actual > 0
            ]

            # Add cutting room filter if not 'ALL'
            if cutting_room != 'ALL':
                filters.append(MattressProductionCenter.cutting_room == cutting_room)

            fabric_totals = fabric_totals_query.filter(*filters).group_by(
                Mattresses.fabric_code
            ).order_by(
                func.sum(MattressDetail.cons_actual).desc()
            ).limit(limit).all()

            # For each fabric, get the unique styles
            top_fabrics = []
            for fabric_result in fabric_totals:
                fabric_code = fabric_result.fabric_code
                total_meters = fabric_result.total_meters

                # Get unique styles for this fabric
                # Need to join with OrderLinesView to get style info
                styles_query = db.session.query(
                    func.distinct(OrderLinesView.style)
                ).join(
                    Mattresses,
                    Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == OrderLinesView.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
                ).join(
                    MattressDetail, MattressDetail.mattress_id == Mattresses.id
                ).join(
                    MattressPhase, MattressPhase.mattress_id == Mattresses.id
                ).join(
                    MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
                ).filter(
                    Mattresses.fabric_code == fabric_code,
                    *filters
                ).all()

                # Extract style names and join them
                styles = [s[0] for s in styles_query if s[0]]
                styles_str = ', '.join(sorted(set(styles))) if styles else 'N/A'

                top_fabrics.append({
                    'fabric_code': fabric_code,
                    'name': fabric_code,
                    'total_meters': round(float(total_meters)) if total_meters else 0,
                    'styles': styles_str
                })

            return {
                "success": True,
                "data": top_fabrics,
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                },
                "total_found": len(top_fabrics)
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e), "error_type": type(e).__name__}, 500






@dashboard_api.route('/top-orders-test')
class TopOrdersData(Resource):
    def get(self):
        """Get top orders by completed meters for the selected timeframe"""
        try:
            period = request.args.get('period', 'today')
            limit = int(request.args.get('limit', 5))
            cutting_room = request.args.get('cutting_room', 'ALL')

            # Get date range for the selected period
            start_date, end_date = get_date_range(period)

            # Query to get top orders by total meters completed
            # Join Mattresses -> MattressPhase -> MattressDetail -> OrderLinesView -> MattressProductionCenter
            # Filter dynamically based on cutting_room parameter

            # Create subquery to get unique style, season, color_code per order (to avoid duplication from OrderLinesView)
            order_info_subquery = db.session.query(
                OrderLinesView.order_commessa,
                func.max(OrderLinesView.style).label('style'),
                func.max(OrderLinesView.season).label('season'),
                func.max(OrderLinesView.color_code).label('color_code')
            ).group_by(OrderLinesView.order_commessa).subquery()

            # Build base query
            base_query = db.session.query(
                Mattresses.order_commessa,
                order_info_subquery.c.style,
                order_info_subquery.c.season,
                order_info_subquery.c.color_code,
                func.sum(MattressDetail.cons_actual).label('total_meters'),
                func.count(func.distinct(Mattresses.id)).label('mattress_count')
            ).join(
                MattressPhase, MattressPhase.mattress_id == Mattresses.id
            ).join(
                MattressDetail, MattressDetail.mattress_id == Mattresses.id
            ).join(
                order_info_subquery,
                Mattresses.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS') == order_info_subquery.c.order_commessa.collate('SQL_Latin1_General_CP1_CI_AS')
            ).join(
                MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
            )

            # Apply filters
            filters = [
                MattressPhase.status == '5 - COMPLETED',
                MattressPhase.operator.isnot(None),
                MattressPhase.operator != '',
                MattressPhase.updated_at >= start_date,
                MattressPhase.updated_at <= end_date,
                MattressDetail.cons_actual.isnot(None),
                MattressDetail.cons_actual > 0
            ]

            # Add cutting room filter if not 'ALL'
            if cutting_room != 'ALL':
                filters.append(MattressProductionCenter.cutting_room == cutting_room)
            # For 'ALL', don't add cutting room filter - show all cutting rooms

            top_orders_query = base_query.filter(*filters).group_by(
                Mattresses.order_commessa,
                order_info_subquery.c.style,
                order_info_subquery.c.season,
                order_info_subquery.c.color_code
            ).order_by(
                func.sum(MattressDetail.cons_actual).desc()
            ).limit(limit)

            results = top_orders_query.all()

            # Format results with real data
            top_orders = []
            for result in results:
                top_orders.append({
                    'order_commessa': result.order_commessa,
                    'style': result.style or 'N/A',
                    'season': result.season or 'N/A',
                    'color_code': result.color_code or 'N/A',
                    'total_meters': round(float(result.total_meters)) if result.total_meters else 0,
                    'mattress_count': result.mattress_count
                })

            return {
                "success": True,
                "data": top_orders,
                "period": period,
                "date_range": {
                    "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                },
                "total_found": len(top_orders)
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e), "error_type": type(e).__name__}, 500

@dashboard_api.route('/top-orders-debug')
class TopOrdersDebug(Resource):
    def get(self):
        """Debug version to check what data is available"""
        try:
            period = request.args.get('period', 'today')
            start_date, end_date = get_date_range(period)

            # Step 1: Check basic completed mattresses
            completed_mattresses = db.session.query(
                Mattresses.id,
                Mattresses.order_commessa,
                MattressPhase.status,
                MattressPhase.operator,
                MattressPhase.updated_at,
                MattressDetail.cons_actual
            ).join(
                MattressPhase, MattressPhase.mattress_id == Mattresses.id
            ).join(
                MattressDetail, MattressDetail.mattress_id == Mattresses.id
            ).filter(
                MattressPhase.status == '5 - COMPLETED'
            ).limit(10).all()

            # Step 2: Check date range
            date_filtered = db.session.query(
                func.count(Mattresses.id)
            ).join(
                MattressPhase, MattressPhase.mattress_id == Mattresses.id
            ).filter(
                MattressPhase.status == '5 - COMPLETED',
                MattressPhase.updated_at >= start_date,
                MattressPhase.updated_at <= end_date
            ).scalar()

            # Step 3: Check with cons_actual filter
            with_cons_actual = db.session.query(
                func.count(Mattresses.id)
            ).join(
                MattressPhase, MattressPhase.mattress_id == Mattresses.id
            ).join(
                MattressDetail, MattressDetail.mattress_id == Mattresses.id
            ).filter(
                MattressPhase.status == '5 - COMPLETED',
                MattressPhase.updated_at >= start_date,
                MattressPhase.updated_at <= end_date,
                MattressDetail.cons_actual.isnot(None),
                MattressDetail.cons_actual > 0
            ).scalar()

            return {
                "success": True,
                "debug_info": {
                    "period": period,
                    "date_range": {
                        "start": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                        "end": end_date.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    "completed_mattresses_sample": [
                        {
                            "id": m.id,
                            "order": m.order_commessa,
                            "status": m.status,
                            "operator": m.operator,
                            "updated_at": m.updated_at.strftime('%Y-%m-%d %H:%M:%S') if m.updated_at else None,
                            "cons_actual": float(m.cons_actual) if m.cons_actual else None
                        } for m in completed_mattresses
                    ],
                    "counts": {
                        "date_filtered": date_filtered,
                        "with_cons_actual": with_cons_actual
                    }
                }
            }, 200

        except Exception as e:
            return {"success": False, "message": str(e)}, 500


