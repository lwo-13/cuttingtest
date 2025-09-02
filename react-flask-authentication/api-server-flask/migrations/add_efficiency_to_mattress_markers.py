#!/usr/bin/env python3
"""
Migration script to add efficiency column to mattress_markers table
and populate it with data from marker_headers table.

This migration:
1. Adds efficiency column to mattress_markers table
2. Populates the efficiency values from marker_headers table
3. Updates existing mattress_markers records with efficiency data
"""

import sys
import os

# Add the parent directory to the path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Flask app and models
from api import create_app
from api.models import db, MattressMarker, MarkerHeader

def run_migration():
    """Run the migration to add efficiency column to mattress_markers table"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting migration: Add efficiency column to mattress_markers table")
            
            # Step 1: Add the efficiency column to mattress_markers table
            print("📝 Adding efficiency column to mattress_markers table...")
            
            # Check if column already exists
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('mattress_markers')]

            if 'efficiency' not in columns:
                # Add the efficiency column
                with db.engine.begin() as connection:
                    connection.execute(text('ALTER TABLE mattress_markers ADD efficiency FLOAT'))
                print("✅ Added efficiency column to mattress_markers table")
            else:
                print("ℹ️  Efficiency column already exists in mattress_markers table")
            
            # Step 2: Populate efficiency values from marker_headers table
            print("📊 Populating efficiency values from marker_headers table...")

            # Process records in batches to avoid connection timeouts
            batch_size = 50
            updated_count = 0

            # Get count of records to process
            total_records = MattressMarker.query.filter(
                MattressMarker.efficiency.is_(None)
            ).count()

            print(f"📋 Found {total_records} records to process")

            # Process in batches
            offset = 0
            while True:
                # Get a batch of mattress_markers that don't have efficiency set
                # SQL Server requires ORDER BY when using OFFSET
                mattress_markers_batch = MattressMarker.query.filter(
                    MattressMarker.efficiency.is_(None)
                ).order_by(MattressMarker.id).offset(offset).limit(batch_size).all()

                if not mattress_markers_batch:
                    break  # No more records to process

                batch_updated = 0
                for mattress_marker in mattress_markers_batch:
                    try:
                        # Find the corresponding marker in marker_headers
                        marker_header = MarkerHeader.query.filter_by(id=mattress_marker.marker_id).first()

                        if marker_header and marker_header.efficiency is not None:
                            mattress_marker.efficiency = marker_header.efficiency
                            batch_updated += 1
                            updated_count += 1
                    except Exception as e:
                        print(f"⚠️  Error processing mattress_marker {mattress_marker.id}: {str(e)}")
                        continue

                # Commit this batch
                try:
                    db.session.commit()
                    print(f"📈 Processed batch {offset//batch_size + 1}: Updated {batch_updated}/{len(mattress_markers_batch)} records (Total: {updated_count})")
                except Exception as e:
                    print(f"⚠️  Error committing batch: {str(e)}")
                    db.session.rollback()

                offset += batch_size

                # Safety check to avoid infinite loop
                if offset > total_records + batch_size:
                    break
            
            print(f"✅ Migration completed successfully!")
            print(f"📊 Updated {updated_count} mattress_markers records with efficiency data")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            db.session.rollback()
            raise e

if __name__ == "__main__":
    run_migration()
