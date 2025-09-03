#!/usr/bin/env python3
"""
Migration script to consolidate spreader_operators and cutter_operators tables into a unified operators table.
This script handles the transition from separate operator tables to a single operators table with operator_type field.
"""

import sys
import os
import traceback
from datetime import datetime

# Add the parent directory to the Python path so we can import from api
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import create_app
from api.models import db
from sqlalchemy import text

def run_migration():
    """Run the migration to consolidate operator tables."""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting migration: Consolidate operator tables...")
            
            # Step 1: Check if operators table already exists
            result = db.session.execute(text("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'operators'
            """)).fetchone()
            
            if not result:
                print("📝 Creating operators table...")
                # Create the operators table
                db.session.execute(text("""
                    CREATE TABLE operators (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        name NVARCHAR(255) NOT NULL,
                        operator_type NVARCHAR(50) NOT NULL,
                        active BIT NOT NULL DEFAULT 1,
                        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
                        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
                    )
                """))
                print("✅ operators table created")
            else:
                print("✅ operators table already exists")
            
            # Step 2: Check if old tables exist and migrate data
            # Check for spreader_operators table
            spreader_table_exists = db.session.execute(text("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'spreader_operators'
            """)).fetchone()
            
            if spreader_table_exists:
                print("📝 Migrating data from spreader_operators...")
                # Get spreader operators
                spreader_operators = db.session.execute(text("""
                    SELECT id, name, active, created_at, updated_at 
                    FROM spreader_operators
                """)).fetchall()
                
                # Insert into operators table
                for op in spreader_operators:
                    # Check if operator already exists
                    existing = db.session.execute(text("""
                        SELECT id FROM operators
                        WHERE name = :name AND operator_type = 'spreader'
                    """), {"name": op.name}).fetchone()

                    if not existing:
                        db.session.execute(text("""
                            INSERT INTO operators (name, operator_type, active, created_at, updated_at)
                            VALUES (:name, 'spreader', :active, :created_at, :updated_at)
                        """), {
                            "name": op.name,
                            "active": op.active,
                            "created_at": op.created_at,
                            "updated_at": op.updated_at
                        })
                        print(f"   ✅ Migrated spreader operator: {op.name}")
                    else:
                        print(f"   ⚠️ Spreader operator already exists: {op.name}")
            
            # Check for cutter_operators table
            cutter_table_exists = db.session.execute(text("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'cutter_operators'
            """)).fetchone()
            
            if cutter_table_exists:
                print("📝 Migrating data from cutter_operators...")
                # Get cutter operators
                cutter_operators = db.session.execute(text("""
                    SELECT id, name, active, created_at, updated_at 
                    FROM cutter_operators
                """)).fetchall()
                
                # Insert into operators table
                for op in cutter_operators:
                    # Check if operator already exists
                    existing = db.session.execute(text("""
                        SELECT id FROM operators
                        WHERE name = :name AND operator_type = 'cutter'
                    """), {"name": op.name}).fetchone()

                    if not existing:
                        db.session.execute(text("""
                            INSERT INTO operators (name, operator_type, active, created_at, updated_at)
                            VALUES (:name, 'cutter', :active, :created_at, :updated_at)
                        """), {
                            "name": op.name,
                            "active": op.active,
                            "created_at": op.created_at,
                            "updated_at": op.updated_at
                        })
                        print(f"   ✅ Migrated cutter operator: {op.name}")
                    else:
                        print(f"   ⚠️ Cutter operator already exists: {op.name}")
            
            # Step 3: Drop old tables (optional - commented out for safety)
            # if spreader_table_exists:
            #     print("📝 Dropping spreader_operators table...")
            #     db.session.execute(text("DROP TABLE spreader_operators"))
            #     print("✅ spreader_operators table dropped")
            
            # if cutter_table_exists:
            #     print("📝 Dropping cutter_operators table...")
            #     db.session.execute(text("DROP TABLE cutter_operators"))
            #     print("✅ cutter_operators table dropped")
            
            # Commit all changes
            db.session.commit()
            print("✅ Migration completed successfully!")
            
            # Show summary
            operator_count = db.session.execute(text("SELECT COUNT(*) as count FROM operators")).fetchone()
            print(f"📊 Total operators in unified table: {operator_count.count}")
            
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            print(f"📋 Error details: {traceback.format_exc()}")
            db.session.rollback()
            return False

def rollback_migration():
    """Rollback the migration (for testing purposes)."""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting rollback: Remove operators table...")
            
            # This is a destructive operation - only for testing
            print("⚠️ WARNING: This will delete the operators table!")
            confirm = input("Are you sure you want to continue? (yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ Rollback cancelled")
                return False
            
            # Drop operators table
            db.session.execute(text("DROP TABLE IF EXISTS operators"))
            db.session.commit()
            print("✅ Rollback completed!")
            
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
