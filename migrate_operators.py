#!/usr/bin/env python3
"""
Migration script to consolidate operator tables into a single unified operators table.

This script will:
1. Create a new 'operators' table with operator_type field
2. Migrate data from 'spreader_operators' and 'cutter_operators' tables
3. Drop the old tables after successful migration

Run this script from the project root directory.
Make sure to backup your database before running this migration!
"""

import sys
import os
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'react-flask-authentication', 'api-server-flask'))

from api import create_app
from api.models import db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

def run_migration():
    """Execute the operator tables consolidation migration."""
    
    # Create Flask app and get database connection
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting operator tables consolidation migration...")
            print(f"Migration started at: {datetime.now()}")
            
            # Step 1: Create the new unified operators table
            print("\n1. Creating new 'operators' table...")
            create_operators_table_sql = """
            CREATE TABLE operators (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                operator_type NVARCHAR(50) NOT NULL,
                active BIT NOT NULL DEFAULT 1,
                created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
                updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
            );
            """
            
            db.session.execute(text(create_operators_table_sql))
            print("✓ New 'operators' table created successfully")
            
            # Step 2: Migrate data from spreader_operators table
            print("\n2. Migrating data from 'spreader_operators' table...")
            migrate_spreader_sql = """
            INSERT INTO operators (name, operator_type, active, created_at, updated_at)
            SELECT 
                name, 
                'SPREADER' as operator_type,
                active,
                created_at,
                updated_at
            FROM spreader_operators;
            """
            
            result = db.session.execute(text(migrate_spreader_sql))
            spreader_count = result.rowcount
            print(f"✓ Migrated {spreader_count} spreader operators")
            
            # Step 3: Migrate data from cutter_operators table
            print("\n3. Migrating data from 'cutter_operators' table...")
            migrate_cutter_sql = """
            INSERT INTO operators (name, operator_type, active, created_at, updated_at)
            SELECT 
                name, 
                'CUTTER' as operator_type,
                active,
                created_at,
                updated_at
            FROM cutter_operators;
            """
            
            result = db.session.execute(text(migrate_cutter_sql))
            cutter_count = result.rowcount
            print(f"✓ Migrated {cutter_count} cutter operators")
            
            # Step 4: Verify migration
            print("\n4. Verifying migration...")
            verify_sql = """
            SELECT 
                operator_type,
                COUNT(*) as count,
                COUNT(CASE WHEN active = 1 THEN 1 END) as active_count
            FROM operators 
            GROUP BY operator_type;
            """
            
            result = db.session.execute(text(verify_sql))
            verification_data = result.fetchall()
            
            print("Migration verification:")
            total_migrated = 0
            for row in verification_data:
                operator_type, count, active_count = row
                total_migrated += count
                print(f"  - {operator_type}: {count} total ({active_count} active)")
            
            print(f"  - Total operators migrated: {total_migrated}")
            
            # Step 5: Drop old tables (commented out for safety - uncomment when ready)
            print("\n5. Dropping old tables...")
            print("⚠️  SAFETY CHECK: Old tables will be dropped. Uncomment the lines below when ready.")
            
            # Uncomment these lines when you're confident the migration worked correctly:
            # db.session.execute(text("DROP TABLE spreader_operators;"))
            # print("✓ Dropped 'spreader_operators' table")
            # 
            # db.session.execute(text("DROP TABLE cutter_operators;"))
            # print("✓ Dropped 'cutter_operators' table")
            
            print("\n⚠️  Old tables NOT dropped for safety. Uncomment the drop statements in the script when ready.")
            
            # Commit all changes
            db.session.commit()
            print(f"\n✅ Migration completed successfully at: {datetime.now()}")
            print("\nNext steps:")
            print("1. Update your models.py to use the new Operator model")
            print("2. Update your API routes to use the unified operators endpoint")
            print("3. Test the new implementation thoroughly")
            print("4. Uncomment the DROP TABLE statements and re-run to clean up old tables")
            
        except SQLAlchemyError as e:
            print(f"\n❌ Database error during migration: {str(e)}")
            db.session.rollback()
            sys.exit(1)
            
        except Exception as e:
            print(f"\n❌ Unexpected error during migration: {str(e)}")
            db.session.rollback()
            sys.exit(1)

def rollback_migration():
    """Rollback the migration by recreating old tables and restoring data."""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting migration rollback...")
            print(f"Rollback started at: {datetime.now()}")
            
            # Recreate spreader_operators table
            print("\n1. Recreating 'spreader_operators' table...")
            create_spreader_table_sql = """
            CREATE TABLE spreader_operators (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                active BIT NOT NULL DEFAULT 1,
                created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
                updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
            );
            """
            
            db.session.execute(text(create_spreader_table_sql))
            
            # Restore spreader operators data
            restore_spreader_sql = """
            INSERT INTO spreader_operators (name, active, created_at, updated_at)
            SELECT name, active, created_at, updated_at
            FROM operators 
            WHERE operator_type = 'SPREADER';
            """
            
            db.session.execute(text(restore_spreader_sql))
            print("✓ Restored spreader_operators table and data")
            
            # Recreate cutter_operators table
            print("\n2. Recreating 'cutter_operators' table...")
            create_cutter_table_sql = """
            CREATE TABLE cutter_operators (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                active BIT NOT NULL DEFAULT 1,
                created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
                updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
            );
            """
            
            db.session.execute(text(create_cutter_table_sql))
            
            # Restore cutter operators data
            restore_cutter_sql = """
            INSERT INTO cutter_operators (name, active, created_at, updated_at)
            SELECT name, active, created_at, updated_at
            FROM operators 
            WHERE operator_type = 'CUTTER';
            """
            
            db.session.execute(text(restore_cutter_sql))
            print("✓ Restored cutter_operators table and data")
            
            # Drop the operators table
            print("\n3. Dropping 'operators' table...")
            db.session.execute(text("DROP TABLE operators;"))
            print("✓ Dropped 'operators' table")
            
            db.session.commit()
            print(f"\n✅ Rollback completed successfully at: {datetime.now()}")
            
        except SQLAlchemyError as e:
            print(f"\n❌ Database error during rollback: {str(e)}")
            db.session.rollback()
            sys.exit(1)
            
        except Exception as e:
            print(f"\n❌ Unexpected error during rollback: {str(e)}")
            db.session.rollback()
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        print("🚀 Operator Tables Consolidation Migration")
        print("=" * 50)
        print("\n⚠️  IMPORTANT: Make sure to backup your database before proceeding!")
        print("\nThis script will:")
        print("1. Create a new 'operators' table")
        print("2. Migrate data from 'spreader_operators' and 'cutter_operators'")
        print("3. Verify the migration")
        print("4. Keep old tables for safety (you can drop them later)")
        
        response = input("\nDo you want to proceed? (yes/no): ").lower().strip()
        
        if response in ['yes', 'y']:
            run_migration()
        else:
            print("Migration cancelled.")
            
        print(f"\nTo rollback this migration, run: python {sys.argv[0]} rollback")
