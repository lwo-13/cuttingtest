#!/usr/bin/env python3
"""
Complete the efficiency migration for remaining records
"""

import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Flask app and models
from api import create_app
from api.models import db, MattressMarker, MarkerHeader

def complete_migration():
    """Complete the efficiency migration for remaining records"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Completing efficiency migration for remaining records...")
            
            # Get all mattress_markers that still don't have efficiency set
            remaining_records = MattressMarker.query.filter(
                MattressMarker.efficiency.is_(None)
            ).all()
            
            print(f"📋 Found {len(remaining_records)} records still missing efficiency")
            
            if len(remaining_records) == 0:
                print("✅ All records already have efficiency values!")
                return
            
            updated_count = 0
            skipped_count = 0
            batch_size = 50
            
            # Process all remaining records
            for i, mattress_marker in enumerate(remaining_records):
                try:
                    # Find the corresponding marker in marker_headers
                    marker_header = MarkerHeader.query.filter_by(id=mattress_marker.marker_id).first()
                    
                    if marker_header and marker_header.efficiency is not None:
                        mattress_marker.efficiency = marker_header.efficiency
                        updated_count += 1
                        
                        # Commit every batch_size records
                        if updated_count % batch_size == 0:
                            db.session.commit()
                            print(f"📈 Updated {updated_count} records so far...")
                    else:
                        skipped_count += 1
                        if marker_header is None:
                            print(f"⚠️  Skipped record {mattress_marker.id}: No marker_header found for marker_id {mattress_marker.marker_id}")
                        else:
                            print(f"⚠️  Skipped record {mattress_marker.id}: marker_header has NULL efficiency")
                
                except Exception as e:
                    print(f"⚠️  Error processing record {mattress_marker.id}: {str(e)}")
                    skipped_count += 1
                    continue
            
            # Final commit for any remaining records
            if updated_count % batch_size != 0:
                db.session.commit()
            
            print(f"\n✅ Migration completed!")
            print(f"📊 Updated: {updated_count} records")
            print(f"📊 Skipped: {skipped_count} records")
            print(f"📊 Total processed: {updated_count + skipped_count}")
            
            # Verify final count
            final_missing = MattressMarker.query.filter(
                MattressMarker.efficiency.is_(None)
            ).count()
            
            print(f"📊 Records still missing efficiency: {final_missing}")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            db.session.rollback()
            raise e

if __name__ == "__main__":
    complete_migration()
