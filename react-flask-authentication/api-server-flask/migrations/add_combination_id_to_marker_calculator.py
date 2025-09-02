#!/usr/bin/env python3
"""
Migration script to add combination_id column to marker_calculator_data table
and update the unique constraint to include combination_id.

This migration makes the marker calculator combination-specific.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.models import db
from sqlalchemy import text
import traceback

def run_migration():
    """Run the migration to add combination_id to marker_calculator_data table"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting migration: Add combination_id to marker_calculator_data table...")
            
            # Check if combination_id column already exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND COLUMN_NAME = 'combination_id'
            """)).fetchone()
            
            if result:
                print("✅ combination_id column already exists in marker_calculator_data table")
                return True
            
            # Step 1: Add combination_id column (nullable initially)
            print("📝 Adding combination_id column to marker_calculator_data table...")
            db.session.execute(text("""
                ALTER TABLE marker_calculator_data 
                ADD combination_id NVARCHAR(36) NULL
            """))
            
            # Step 2: Set default combination_id for existing records
            # We'll use a placeholder combination_id for existing records
            print("📝 Setting default combination_id for existing records...")
            db.session.execute(text("""
                UPDATE marker_calculator_data 
                SET combination_id = 'legacy_combo_' + CAST(id AS NVARCHAR(10))
                WHERE combination_id IS NULL
            """))
            
            # Step 3: Make combination_id NOT NULL
            print("📝 Making combination_id column NOT NULL...")
            db.session.execute(text("""
                ALTER TABLE marker_calculator_data 
                ALTER COLUMN combination_id NVARCHAR(36) NOT NULL
            """))
            
            # Step 4: Drop old unique constraint
            print("📝 Dropping old unique constraint...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    DROP CONSTRAINT uq_calculator_order_tab
                """))
            except Exception as e:
                print(f"⚠️ Could not drop old constraint (may not exist): {e}")
            
            # Step 5: Create new unique constraint with combination_id
            print("📝 Creating new unique constraint with combination_id...")
            db.session.execute(text("""
                ALTER TABLE marker_calculator_data 
                ADD CONSTRAINT uq_calculator_order_combination_tab 
                UNIQUE (order_commessa, combination_id, tab_number)
            """))
            
            # Commit all changes
            db.session.commit()
            print("✅ Migration completed successfully!")
            print("📋 Summary:")
            print("   - Added combination_id column to marker_calculator_data table")
            print("   - Set default combination_id for existing records")
            print("   - Updated unique constraint to include combination_id")
            print("   - Marker calculator is now combination-specific")
            
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            print(f"📋 Error details: {traceback.format_exc()}")
            db.session.rollback()
            return False

def rollback_migration():
    """Rollback the migration (remove combination_id column)"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting rollback: Remove combination_id from marker_calculator_data table...")
            
            # Step 1: Drop new unique constraint
            print("📝 Dropping new unique constraint...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    DROP CONSTRAINT uq_calculator_order_combination_tab
                """))
            except Exception as e:
                print(f"⚠️ Could not drop new constraint: {e}")
            
            # Step 2: Recreate old unique constraint
            print("📝 Recreating old unique constraint...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ADD CONSTRAINT uq_calculator_order_tab 
                    UNIQUE (order_commessa, tab_number)
                """))
            except Exception as e:
                print(f"⚠️ Could not recreate old constraint: {e}")
            
            # Step 3: Drop combination_id column
            print("📝 Dropping combination_id column...")
            db.session.execute(text("""
                ALTER TABLE marker_calculator_data 
                DROP COLUMN combination_id
            """))
            
            # Commit changes
            db.session.commit()
            print("✅ Rollback completed successfully!")
            
            return True
            
        except Exception as e:
            print(f"❌ Rollback failed: {str(e)}")
            print(f"📋 Error details: {traceback.format_exc()}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        success = rollback_migration()
    else:
        success = run_migration()
    
    sys.exit(0 if success else 1)
