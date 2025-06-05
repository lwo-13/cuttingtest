#!/usr/bin/env python3
"""
Script to run the tab_number column migration for the marker calculator
"""

from api import create_app, db
from sqlalchemy import text

def run_migration():
    """Run the tab_number migration"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🚀 Starting tab_number column migration...")
            
            # Step 1: Add marker_width column if it doesn't exist
            print("Step 1: Checking marker_width column...")
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_markers' 
                AND COLUMN_NAME = 'marker_width'
            """))
            
            if not result.fetchone():
                print("Adding marker_width column...")
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_markers 
                    ADD marker_width FLOAT NULL
                """))
                print("✅ Added marker_width column to marker_calculator_markers table")
            else:
                print("✅ marker_width column already exists")
            
            # Step 2: Remove unique constraint on marker names if it exists
            print("Step 2: Checking marker name constraint...")
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'marker_calculator_markers' 
                AND CONSTRAINT_NAME = 'uq_calculator_marker_name'
            """))
            
            if result.fetchone():
                print("Removing unique constraint on marker names...")
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_markers 
                    DROP CONSTRAINT uq_calculator_marker_name
                """))
                print("✅ Removed unique constraint on marker names")
            else:
                print("✅ Marker name constraint doesn't exist or already removed")
            
            # Step 3: Add tab_number column if it doesn't exist
            print("Step 3: Checking tab_number column...")
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND COLUMN_NAME = 'tab_number'
            """))
            
            if not result.fetchone():
                print("Adding tab_number column...")
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ADD tab_number VARCHAR(10) NULL
                """))
                print("✅ Added tab_number column to marker_calculator_data table")
                
                # Update existing records with default tab number '01'
                print("Updating existing records with default tab_number '01'...")
                db.session.execute(text("""
                    UPDATE marker_calculator_data 
                    SET tab_number = '01' 
                    WHERE tab_number IS NULL
                """))
                
                # Make the column NOT NULL after updating existing records
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ALTER COLUMN tab_number VARCHAR(10) NOT NULL
                """))
                print("✅ Updated existing records with default tab_number '01'")
            else:
                print("✅ tab_number column already exists")
            
            # Step 4: Add unique constraint for order + tab_number
            print("Step 4: Checking unique constraint...")
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND CONSTRAINT_NAME = 'uq_calculator_order_tab'
            """))
            
            if not result.fetchone():
                print("Adding unique constraint for order + tab_number...")
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ADD CONSTRAINT uq_calculator_order_tab 
                    UNIQUE (order_commessa, tab_number)
                """))
                print("✅ Added unique constraint for order + tab_number")
            else:
                print("✅ Unique constraint already exists")
            
            # Commit all changes
            db.session.commit()
            print("🎉 Migration completed successfully! Calculator now supports tab-specific persistence.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    run_migration()
