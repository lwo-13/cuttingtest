#!/usr/bin/env python3
"""
Database Migration Script: Consolidate SINA STYLE L and SINA STYLE D
==================================================================

This script consolidates the separate SINA STYLE L and SINA STYLE D entries
into a single SINA STYLE entry for both cutting rooms and destinations.

Tables affected:
- mattress_production_center (cutting_room and destination columns)
- production_center (cutting_room and destination columns)

Changes:
- 'SINA STYLE L' -> 'SINA STYLE'
- 'SINA STYLE D' -> 'SINA STYLE'

Usage:
    cd react-flask-authentication/api-server-flask
    python migrations/consolidate_sina_style.py

The script will:
1. Show a preview of records that will be updated
2. Ask for confirmation before making changes
3. Update the records
4. Show a summary of changes made
"""

import sys
import os
from datetime import datetime

# Add the current directory to the path to import Flask app
# This script should be run from the api-server-flask directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from api import create_app
from api.models import db, MattressProductionCenter, ProductionCenter
from sqlalchemy import text

def preview_changes():
    """Preview what records will be updated"""
    print("🔍 Previewing records that will be updated...")
    print("=" * 60)
    
    # Check mattress_production_center table
    print("\n📋 MATTRESS_PRODUCTION_CENTER table:")
    
    # Cutting room changes
    cutting_room_records = db.session.query(MattressProductionCenter).filter(
        MattressProductionCenter.cutting_room.in_(['SINA STYLE L', 'SINA STYLE D'])
    ).all()
    
    if cutting_room_records:
        print(f"   Cutting room records to update: {len(cutting_room_records)}")
        for record in cutting_room_records:
            print(f"   - Table ID: {record.table_id}, Current: '{record.cutting_room}' -> Will become: 'SINA STYLE'")
    else:
        print("   No cutting room records to update")
    
    # Destination changes
    destination_records = db.session.query(MattressProductionCenter).filter(
        MattressProductionCenter.destination.in_(['SINA STYLE L', 'SINA STYLE D'])
    ).all()
    
    if destination_records:
        print(f"   Destination records to update: {len(destination_records)}")
        for record in destination_records:
            print(f"   - Table ID: {record.table_id}, Current: '{record.destination}' -> Will become: 'SINA STYLE'")
    else:
        print("   No destination records to update")
    
    # Check production_center table
    print("\n📋 PRODUCTION_CENTER table:")
    
    # Cutting room changes
    pc_cutting_room_records = db.session.query(ProductionCenter).filter(
        ProductionCenter.cutting_room.in_(['SINA STYLE L', 'SINA STYLE D'])
    ).all()
    
    if pc_cutting_room_records:
        print(f"   Cutting room records to update: {len(pc_cutting_room_records)}")
        for record in pc_cutting_room_records:
            print(f"   - Order: {record.order_commessa}, Current: '{record.cutting_room}' -> Will become: 'SINA STYLE'")
    else:
        print("   No cutting room records to update")
    
    # Destination changes
    pc_destination_records = db.session.query(ProductionCenter).filter(
        ProductionCenter.destination.in_(['SINA STYLE L', 'SINA STYLE D'])
    ).all()
    
    if pc_destination_records:
        print(f"   Destination records to update: {len(pc_destination_records)}")
        for record in pc_destination_records:
            print(f"   - Order: {record.order_commessa}, Current: '{record.destination}' -> Will become: 'SINA STYLE'")
    else:
        print("   No destination records to update")
    
    total_records = len(cutting_room_records) + len(destination_records) + len(pc_cutting_room_records) + len(pc_destination_records)
    print(f"\n📊 Total records to update: {total_records}")
    
    return total_records > 0

def apply_migration():
    """Apply the migration changes"""
    print("\n🔄 Applying migration changes...")
    
    try:
        # Update mattress_production_center cutting_room
        result1 = db.session.execute(text("""
            UPDATE mattress_production_center 
            SET cutting_room = 'SINA STYLE' 
            WHERE cutting_room IN ('SINA STYLE L', 'SINA STYLE D')
        """))
        
        # Update mattress_production_center destination
        result2 = db.session.execute(text("""
            UPDATE mattress_production_center 
            SET destination = 'SINA STYLE' 
            WHERE destination IN ('SINA STYLE L', 'SINA STYLE D')
        """))
        
        # Update production_center cutting_room
        result3 = db.session.execute(text("""
            UPDATE production_center 
            SET cutting_room = 'SINA STYLE' 
            WHERE cutting_room IN ('SINA STYLE L', 'SINA STYLE D')
        """))
        
        # Update production_center destination
        result4 = db.session.execute(text("""
            UPDATE production_center 
            SET destination = 'SINA STYLE' 
            WHERE destination IN ('SINA STYLE L', 'SINA STYLE D')
        """))
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Migration completed successfully!")
        print(f"   - mattress_production_center.cutting_room: {result1.rowcount} records updated")
        print(f"   - mattress_production_center.destination: {result2.rowcount} records updated")
        print(f"   - production_center.cutting_room: {result3.rowcount} records updated")
        print(f"   - production_center.destination: {result4.rowcount} records updated")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.session.rollback()
        return False

def rollback_migration():
    """Rollback function (for reference - not automated due to ambiguity)"""
    print("\n⚠️  ROLLBACK INFORMATION:")
    print("This migration cannot be automatically rolled back because we cannot")
    print("determine which records were originally 'SINA STYLE L' vs 'SINA STYLE D'.")
    print("If rollback is needed, you would need to:")
    print("1. Restore from a database backup taken before this migration")
    print("2. Or manually update records based on business logic")

def main():
    """Main migration function"""
    print("🚀 SINA STYLE Consolidation Migration")
    print("=" * 50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        try:
            # Preview changes
            has_changes = preview_changes()
            
            if not has_changes:
                print("\n✅ No records need to be updated. Migration not needed.")
                return
            
            # Ask for confirmation
            print("\n" + "=" * 60)
            response = input("Do you want to proceed with these changes? (yes/no): ").lower().strip()
            
            if response not in ['yes', 'y']:
                print("❌ Migration cancelled by user.")
                return
            
            # Apply migration
            success = apply_migration()
            
            if success:
                print(f"\n🎉 Migration completed successfully at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                rollback_migration()
            else:
                print(f"\n💥 Migration failed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
        except Exception as e:
            print(f"💥 Unexpected error: {e}")
            db.session.rollback()

if __name__ == "__main__":
    main()
