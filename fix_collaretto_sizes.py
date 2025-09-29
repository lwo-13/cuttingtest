#!/usr/bin/env python3
"""
Script to investigate and fix the collaretto_details.applicable_sizes field
that contains incorrect data like fabric colors instead of size information.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.app import create_app
from api.models import db, CollarettoDetail, Collaretto
from sqlalchemy import text

def investigate_sizes_data():
    """Investigate the current state of applicable_sizes data"""
    print("🔍 Investigating collaretto_details.applicable_sizes data...")
    
    # Get all unique applicable_sizes values
    unique_sizes = db.session.query(CollarettoDetail.applicable_sizes).distinct().all()
    
    print(f"\n📊 Found {len(unique_sizes)} unique applicable_sizes values:")
    for size_tuple in unique_sizes:
        size_value = size_tuple[0]
        count = db.session.query(CollarettoDetail).filter_by(applicable_sizes=size_value).count()
        print(f"  '{size_value}' - {count} records")
    
    # Look for suspicious values (containing color codes or fabric info)
    suspicious_patterns = ['%-%', '%#%', '%/%', '%\\%']
    suspicious_records = []
    
    for pattern in suspicious_patterns:
        records = db.session.query(CollarettoDetail).filter(
            CollarettoDetail.applicable_sizes.like(pattern)
        ).all()
        suspicious_records.extend(records)
    
    print(f"\n⚠️  Found {len(suspicious_records)} potentially suspicious records:")
    for record in suspicious_records[:10]:  # Show first 10
        collaretto = db.session.query(Collaretto).filter_by(id=record.collaretto_id).first()
        print(f"  ID: {record.id}, applicable_sizes: '{record.applicable_sizes}', order: {collaretto.order_commessa if collaretto else 'N/A'}")
    
    if len(suspicious_records) > 10:
        print(f"  ... and {len(suspicious_records) - 10} more")

def fix_sizes_data():
    """Fix the applicable_sizes data by setting reasonable defaults"""
    print("\n🔧 Fixing applicable_sizes data...")
    
    # Get all records with suspicious applicable_sizes
    suspicious_patterns = ['%-%', '%#%', '%/%', '%\\%']
    suspicious_records = []
    
    for pattern in suspicious_patterns:
        records = db.session.query(CollarettoDetail).filter(
            CollarettoDetail.applicable_sizes.like(pattern)
        ).all()
        suspicious_records.extend(records)
    
    # Also get records with NULL or empty applicable_sizes
    null_records = db.session.query(CollarettoDetail).filter(
        (CollarettoDetail.applicable_sizes.is_(None)) | 
        (CollarettoDetail.applicable_sizes == '')
    ).all()
    
    all_problematic_records = suspicious_records + null_records
    
    print(f"📝 Found {len(all_problematic_records)} records to fix")
    
    if not all_problematic_records:
        print("✅ No problematic records found!")
        return
    
    # Ask for confirmation
    response = input(f"\nDo you want to fix {len(all_problematic_records)} records by setting applicable_sizes to 'ALL'? (y/N): ")
    if response.lower() != 'y':
        print("❌ Operation cancelled")
        return
    
    # Fix the records
    fixed_count = 0
    for record in all_problematic_records:
        try:
            record.applicable_sizes = 'ALL'
            fixed_count += 1
        except Exception as e:
            print(f"❌ Error fixing record {record.id}: {e}")
    
    try:
        db.session.commit()
        print(f"✅ Successfully fixed {fixed_count} records")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error committing changes: {e}")

def main():
    """Main function"""
    app = create_app()
    
    with app.app_context():
        print("🚀 Starting collaretto sizes data investigation and fix...")
        
        # First investigate the current state
        investigate_sizes_data()
        
        # Then offer to fix the data
        fix_sizes_data()
        
        print("\n🏁 Script completed!")

if __name__ == "__main__":
    main()
