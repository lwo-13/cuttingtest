"""
Script to set bagno_ready to TRUE for specific mattress IDs.

Run this from the api-server-flask directory:
cd react-flask-authentication/api-server-flask
python set_bagno_ready.py
"""

from api import create_app
from api.models import db, MattressDetail

def set_bagno_ready():
    """
    Set bagno_ready = TRUE for specific mattress IDs.
    """
    
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("SETTING BAGNO_READY TO TRUE FOR SPECIFIC MATTRESSES")
        print("=" * 80)
        print()
        
        # List of mattress IDs to update
        mattress_ids = [9001]
        
        print(f"Mattress IDs to update: {mattress_ids}")
        print()
        
        # Find the mattress_details records
        mattress_details = MattressDetail.query.filter(
            MattressDetail.mattress_id.in_(mattress_ids)
        ).all()
        
        if not mattress_details:
            print("❌ No mattress details found for the specified IDs!")
            return
        
        print(f"Found {len(mattress_details)} mattress detail records:")
        print("-" * 80)
        for detail in mattress_details:
            print(f"  ID: {detail.id} | Mattress ID: {detail.mattress_id}")
            print(f"  Current bagno_ready: {detail.bagno_ready}")
            print(f"  Layers: {detail.layers} | Layers Actual: {detail.layers_a}")
            print(f"  Length: {detail.length_mattress}m | Cons Planned: {detail.cons_planned}m")
            print()
        
        # Ask for confirmation
        response = input(f"Do you want to set bagno_ready=TRUE for all {len(mattress_details)} records? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            print("❌ Operation cancelled.")
            return
        
        # Update bagno_ready to TRUE
        print()
        print("Updating bagno_ready...")
        updated_count = 0
        
        for detail in mattress_details:
            detail.bagno_ready = True
            detail.updated_at = db.func.current_timestamp()
            updated_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"✅ Successfully updated {updated_count} mattress detail records!")
        print()
        
        # Verify the changes
        print("Verifying changes...")
        verified = MattressDetail.query.filter(
            MattressDetail.mattress_id.in_(mattress_ids),
            MattressDetail.bagno_ready == True
        ).all()
        
        print(f"✅ Verified: {len(verified)} records now have bagno_ready=TRUE")
        for detail in verified:
            print(f"  - Mattress ID {detail.mattress_id}: bagno_ready = {detail.bagno_ready}")
        
        print()
        print("=" * 80)
        print("UPDATE COMPLETE")
        print("=" * 80)


if __name__ == '__main__':
    set_bagno_ready()

