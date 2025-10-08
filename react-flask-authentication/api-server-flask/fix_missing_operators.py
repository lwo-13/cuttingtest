"""
Script to fix mattresses with cons_actual and status '5 - COMPLETED' but no operator.
Sets the operator to 'LeonardoNunes' for these cases.

Run this from the api-server-flask directory:
cd react-flask-authentication/api-server-flask
python fix_missing_operators.py
"""

from api import create_app
from api.models import db, Mattresses, MattressDetail, MattressPhase, MattressProductionCenter

def fix_missing_operators():
    """
    Find all mattresses with:
    - cons_actual > 0
    - status = '5 - COMPLETED'
    - active = True
    - operator is NULL or empty
    
    And set their operator to 'LeonardoNunes'
    """
    
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("FIXING MISSING OPERATORS FOR COMPLETED MATTRESSES")
        print("=" * 80)
        print()
        
        # Find all mattresses with cons_actual but no operator in completed phase
        mattresses_to_fix = db.session.query(
            MattressPhase.id,
            MattressPhase.mattress_id,
            Mattresses.mattress,
            Mattresses.order_commessa,
            MattressDetail.cons_actual,
            MattressPhase.status,
            MattressPhase.operator,
            MattressProductionCenter.cutting_room
        ).join(
            Mattresses, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).join(
            MattressProductionCenter, MattressProductionCenter.table_id == Mattresses.table_id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            db.or_(
                MattressPhase.operator.is_(None),
                MattressPhase.operator == ''
            )
        ).all()
        
        if not mattresses_to_fix:
            print("✅ No mattresses found that need fixing!")
            print()
            return
        
        print(f"Found {len(mattresses_to_fix)} mattresses with missing operators:\n")
        
        # Group by cutting room for display
        by_cutting_room = {}
        for m in mattresses_to_fix:
            room = m.cutting_room or 'NULL'
            if room not in by_cutting_room:
                by_cutting_room[room] = []
            by_cutting_room[room].append(m)
        
        # Display what will be fixed
        for room, mattresses in by_cutting_room.items():
            print(f"📍 Cutting Room: {room} ({len(mattresses)} mattresses)")
            print("-" * 80)
            for m in mattresses[:5]:  # Show first 5 examples
                print(f"  ID: {m.id} | Mattress: {m.mattress} | Order: {m.order_commessa}")
                print(f"  cons_actual: {m.cons_actual}m | Status: {m.status} | Current Operator: {m.operator or 'None'}")
            if len(mattresses) > 5:
                print(f"  ... and {len(mattresses) - 5} more")
            print()
        
        # Ask for confirmation
        print()
        response = input(f"Do you want to set operator='LeonardoNunes' for all {len(mattresses_to_fix)} mattresses? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            print("❌ Operation cancelled.")
            return
        
        # Update all the phases
        print()
        print("Updating operators...")
        updated_count = 0
        
        for m in mattresses_to_fix:
            phase = MattressPhase.query.get(m.id)
            if phase:
                phase.operator = 'LeonardoNunes'
                phase.updated_at = db.func.current_timestamp()
                updated_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"✅ Successfully updated {updated_count} mattress phases!")
        print()
        
        # Verify the changes
        print("Verifying changes...")
        remaining = db.session.query(MattressPhase).join(
            Mattresses, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '5 - COMPLETED',
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0,
            db.or_(
                MattressPhase.operator.is_(None),
                MattressPhase.operator == ''
            )
        ).count()
        
        if remaining == 0:
            print("✅ All completed mattresses with cons_actual now have operators!")
        else:
            print(f"⚠️  Warning: {remaining} mattresses still have missing operators")
        
        print()
        print("=" * 80)
        print("FIX COMPLETE")
        print("=" * 80)


if __name__ == '__main__':
    fix_missing_operators()

