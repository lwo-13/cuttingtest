"""
Script to check for mattresses with cons_actual that don't meet the spreaded meters API criteria.
This will help identify if there are mattresses being excluded from the dashboard metrics.

Run this from the api-server-flask directory:
cd react-flask-authentication/api-server-flask
python check_mattress_cons_actual.py
"""

from api import create_app
from api.models import db, Mattresses, MattressDetail, MattressPhase, MattressProductionCenter
from sqlalchemy import and_, or_

def check_mattresses_with_cons_actual():
    """
    Check for mattresses that have cons_actual but don't meet the dashboard criteria:
    1. Mattresses with cons_actual but status != '5 - COMPLETED'
    2. Mattresses with cons_actual but cutting_room != 'ZALLI'
    """
    
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("CHECKING MATTRESSES WITH cons_actual")
        print("=" * 80)
        print()
        
        # Query 1: Mattresses with cons_actual but status != '5 - COMPLETED'
        print("1️⃣  MATTRESSES WITH cons_actual BUT STATUS != '5 - COMPLETED'")
        print("-" * 80)
        
        mattresses_wrong_status = db.session.query(
            Mattresses.id,
            Mattresses.mattress,
            Mattresses.order_commessa,
            Mattresses.table_id,
            MattressDetail.cons_actual,
            MattressPhase.status,
            MattressPhase.operator,
            MattressProductionCenter.cutting_room,
            MattressProductionCenter.destination
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,  # Only check active phase
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            MattressPhase.status != '5 - COMPLETED'
        ).all()
        
        if mattresses_wrong_status:
            print(f"Found {len(mattresses_wrong_status)} mattresses with cons_actual but status != '5 - COMPLETED':\n")
            for m in mattresses_wrong_status:
                print(f"  ID: {m.id}")
                print(f"  Mattress: {m.mattress}")
                print(f"  Order: {m.order_commessa}")
                print(f"  cons_actual: {m.cons_actual} meters")
                print(f"  Status: {m.status}")
                print(f"  Operator: {m.operator or 'None'}")
                print(f"  Cutting Room: {m.cutting_room or 'None'}")
                print(f"  Destination: {m.destination or 'None'}")
                print()
        else:
            print("✅ No mattresses found with cons_actual but status != '5 - COMPLETED'\n")
        
        print()
        
        # Query 2: Mattresses with cons_actual but cutting_room != 'ZALLI'
        print("2️⃣  MATTRESSES WITH cons_actual BUT cutting_room != 'ZALLI'")
        print("-" * 80)
        
        mattresses_wrong_cutting_room = db.session.query(
            Mattresses.id,
            Mattresses.mattress,
            Mattresses.order_commessa,
            Mattresses.table_id,
            MattressDetail.cons_actual,
            MattressPhase.status,
            MattressPhase.operator,
            MattressProductionCenter.cutting_room,
            MattressProductionCenter.destination
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,  # Only check active phase
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            or_(
                MattressProductionCenter.cutting_room != 'ZALLI',
                MattressProductionCenter.cutting_room.is_(None)
            )
        ).all()
        
        if mattresses_wrong_cutting_room:
            print(f"Found {len(mattresses_wrong_cutting_room)} mattresses with cons_actual but cutting_room != 'ZALLI':\n")
            
            # Group by cutting room for better visibility
            by_cutting_room = {}
            for m in mattresses_wrong_cutting_room:
                room = m.cutting_room or 'NULL'
                if room not in by_cutting_room:
                    by_cutting_room[room] = []
                by_cutting_room[room].append(m)
            
            for room, mattresses in by_cutting_room.items():
                print(f"\n  📍 Cutting Room: {room} ({len(mattresses)} mattresses)")
                print("  " + "-" * 76)
                for m in mattresses[:5]:  # Show first 5 examples per cutting room
                    print(f"    ID: {m.id} | Mattress: {m.mattress} | Order: {m.order_commessa}")
                    print(f"    cons_actual: {m.cons_actual} meters | Status: {m.status} | Operator: {m.operator or 'None'}")
                    print()
                if len(mattresses) > 5:
                    print(f"    ... and {len(mattresses) - 5} more\n")
        else:
            print("✅ No mattresses found with cons_actual but cutting_room != 'ZALLI'\n")
        
        print()
        
        # Query 3: Combined - mattresses excluded from dashboard for ANY reason
        print("3️⃣  MATTRESSES WITH cons_actual EXCLUDED FROM DASHBOARD (ALL REASONS)")
        print("-" * 80)
        
        excluded_mattresses = db.session.query(
            Mattresses.id,
            Mattresses.mattress,
            Mattresses.order_commessa,
            MattressDetail.cons_actual,
            MattressPhase.status,
            MattressPhase.operator,
            MattressProductionCenter.cutting_room
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).join(
            MattressPhase, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,  # Only check active phase
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            # Exclude if ANY of these conditions are NOT met:
            or_(
                MattressPhase.status != '5 - COMPLETED',
                MattressPhase.operator.is_(None),
                MattressPhase.operator == '',
                MattressProductionCenter.cutting_room != 'ZALLI',
                MattressProductionCenter.cutting_room.is_(None)
            )
        ).all()
        
        if excluded_mattresses:
            print(f"Found {len(excluded_mattresses)} mattresses with cons_actual excluded from dashboard:\n")
            
            # Calculate total excluded meters
            total_excluded_meters = sum(m.cons_actual for m in excluded_mattresses if m.cons_actual)
            
            # Categorize by reason
            reasons = {
                'Wrong Status': [],
                'No Operator': [],
                'Wrong Cutting Room': [],
                'Multiple Issues': []
            }
            
            for m in excluded_mattresses:
                issues = []
                if m.status != '5 - COMPLETED':
                    issues.append('status')
                if not m.operator or m.operator == '':
                    issues.append('operator')
                if m.cutting_room != 'ZALLI':
                    issues.append('cutting_room')
                
                if len(issues) == 1:
                    if 'status' in issues:
                        reasons['Wrong Status'].append(m)
                    elif 'operator' in issues:
                        reasons['No Operator'].append(m)
                    elif 'cutting_room' in issues:
                        reasons['Wrong Cutting Room'].append(m)
                else:
                    reasons['Multiple Issues'].append(m)
            
            print(f"  📊 SUMMARY:")
            print(f"  Total excluded mattresses: {len(excluded_mattresses)}")
            print(f"  Total excluded meters: {total_excluded_meters:.2f} meters")
            print()
            
            for reason, mattresses in reasons.items():
                if mattresses:
                    total_meters = sum(m.cons_actual for m in mattresses if m.cons_actual)
                    print(f"  {reason}: {len(mattresses)} mattresses ({total_meters:.2f} meters)")
                    for m in mattresses[:3]:  # Show first 3 examples
                        print(f"    - ID {m.id}: {m.mattress} | {m.cons_actual}m | Status: {m.status} | Operator: {m.operator or 'None'} | Room: {m.cutting_room or 'None'}")
                    if len(mattresses) > 3:
                        print(f"    ... and {len(mattresses) - 3} more")
                    print()
        else:
            print("✅ All mattresses with cons_actual are included in the dashboard!\n")
        
        print()
        print("=" * 80)
        print("CHECK COMPLETE")
        print("=" * 80)


if __name__ == '__main__':
    check_mattresses_with_cons_actual()

