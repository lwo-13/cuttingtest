"""
Script to fix mattresses with cons_actual but wrong active phase.
Sets "0 - NOT SET" to FALSE and "5 - COMPLETED" to TRUE with operator.

Run this from the api-server-flask directory:
cd react-flask-authentication/api-server-flask
python fix_wrong_status_phases.py
"""

from api import create_app
from api.models import db, Mattresses, MattressDetail, MattressPhase, MattressProductionCenter

def fix_wrong_status_phases():
    """
    Find all mattresses with:
    - cons_actual > 0
    - active phase is "0 - NOT SET"
    
    And update them to:
    - Set "0 - NOT SET" phase to active = FALSE
    - Set "5 - COMPLETED" phase to active = TRUE with operator = 'LeonardoNunes'
    """
    
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("FIXING MATTRESSES WITH WRONG ACTIVE PHASE")
        print("=" * 80)
        print()
        
        # Find all mattresses with cons_actual but active phase is "0 - NOT SET"
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
            MattressPhase.status == '0 - NOT SET',
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0
        ).all()
        
        if not mattresses_to_fix:
            print("✅ No mattresses found that need fixing!")
            print()
            return
        
        print(f"Found {len(mattresses_to_fix)} mattresses with wrong active phase:\n")
        
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
                print(f"  cons_actual: {m.cons_actual}m | Current Status: {m.status} (active=TRUE)")
                print(f"  Current Operator: {m.operator or 'None'}")
            if len(mattresses) > 5:
                print(f"  ... and {len(mattresses) - 5} more")
            print()
        
        # Ask for confirmation
        print()
        response = input(f"Do you want to fix all {len(mattresses_to_fix)} mattresses? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            print("❌ Operation cancelled.")
            return
        
        # Update all the phases
        print()
        print("Updating phases...")
        updated_count = 0
        
        for m in mattresses_to_fix:
            mattress_id = m.mattress_id
            
            # Get the "0 - NOT SET" phase (currently active)
            not_set_phase = MattressPhase.query.filter_by(
                mattress_id=mattress_id,
                status='0 - NOT SET'
            ).first()
            
            # Get the "5 - COMPLETED" phase
            completed_phase = MattressPhase.query.filter_by(
                mattress_id=mattress_id,
                status='5 - COMPLETED'
            ).first()
            
            if not_set_phase and completed_phase:
                # Set "0 - NOT SET" to inactive
                not_set_phase.active = False
                
                # Set "5 - COMPLETED" to active with operator
                completed_phase.active = True
                completed_phase.operator = 'LeonardoNunes'
                completed_phase.updated_at = db.func.current_timestamp()
                
                updated_count += 1
            elif not completed_phase:
                # If "5 - COMPLETED" phase doesn't exist, create it
                print(f"  ⚠️  Creating missing '5 - COMPLETED' phase for mattress {m.mattress}")
                new_completed_phase = MattressPhase(
                    mattress_id=mattress_id,
                    status='5 - COMPLETED',
                    active=True,
                    operator='LeonardoNunes',
                    updated_at=db.func.current_timestamp()
                )
                db.session.add(new_completed_phase)
                
                if not_set_phase:
                    not_set_phase.active = False
                
                updated_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"✅ Successfully updated {updated_count} mattresses!")
        print()
        
        # Verify the changes
        print("Verifying changes...")
        remaining = db.session.query(MattressPhase).join(
            Mattresses, MattressPhase.mattress_id == Mattresses.id
        ).join(
            MattressDetail, MattressDetail.mattress_id == Mattresses.id
        ).filter(
            MattressPhase.active == True,
            MattressPhase.status == '0 - NOT SET',
            MattressDetail.cons_actual.isnot(None),
            MattressDetail.cons_actual > 0
        ).count()
        
        if remaining == 0:
            print("✅ All mattresses with cons_actual now have correct active phase!")
        else:
            print(f"⚠️  Warning: {remaining} mattresses still have wrong active phase")
        
        print()
        print("=" * 80)
        print("FIX COMPLETE")
        print("=" * 80)


if __name__ == '__main__':
    fix_wrong_status_phases()

