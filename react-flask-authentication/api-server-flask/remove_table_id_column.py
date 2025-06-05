#!/usr/bin/env python3
"""
Script to remove the unused table_id column from marker_calculator_data
"""

from api import create_app, db
from sqlalchemy import text

def remove_table_id_column():
    """Remove the unused table_id column"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Checking for unused table_id column...")
            
            # Check if table_id column exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND COLUMN_NAME = 'table_id'
            """))
            
            column_info = result.fetchone()
            if column_info:
                print(f"✅ Found table_id column:")
                print(f"   - Data Type: {column_info[1]}")
                print(f"   - Nullable: {column_info[2]}")
                
                # Check for any constraints that depend on table_id column
                print("🔍 Checking for constraints that depend on table_id...")

                # Check for unique constraints
                result = db.session.execute(text("""
                    SELECT CONSTRAINT_NAME
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                    WHERE TABLE_NAME = 'marker_calculator_data'
                    AND CONSTRAINT_NAME = 'uq_calculator_table_order'
                """))

                old_constraint = result.fetchone()
                if old_constraint:
                    constraint_name = old_constraint[0]
                    print(f"🗑️  Dropping old unique constraint: {constraint_name}")
                    db.session.execute(text(f"""
                        ALTER TABLE marker_calculator_data
                        DROP CONSTRAINT {constraint_name}
                    """))
                    print(f"✅ Dropped constraint: {constraint_name}")

                # Check for foreign key constraints
                result = db.session.execute(text("""
                    SELECT
                        fk.name AS constraint_name,
                        OBJECT_NAME(fk.parent_object_id) AS table_name,
                        COL_NAME(fc.parent_object_id, fc.parent_column_id) AS column_name,
                        OBJECT_NAME(fk.referenced_object_id) AS referenced_table_name,
                        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column_name
                    FROM sys.foreign_keys AS fk
                    INNER JOIN sys.foreign_key_columns AS fc
                        ON fk.object_id = fc.constraint_object_id
                    WHERE OBJECT_NAME(fk.parent_object_id) = 'marker_calculator_data'
                    AND COL_NAME(fc.parent_object_id, fc.parent_column_id) = 'table_id'
                """))

                fk_constraints = result.fetchall()

                # Drop foreign key constraints if they exist
                for fk in fk_constraints:
                    constraint_name = fk[0]
                    print(f"🗑️  Dropping foreign key constraint: {constraint_name}")
                    db.session.execute(text(f"""
                        ALTER TABLE marker_calculator_data
                        DROP CONSTRAINT {constraint_name}
                    """))
                    print(f"✅ Dropped constraint: {constraint_name}")
                
                # Now drop the column
                print("🗑️  Removing table_id column...")
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    DROP COLUMN table_id
                """))
                
                db.session.commit()
                print("✅ Successfully removed table_id column from marker_calculator_data")
                
            else:
                print("✅ table_id column does not exist - already cleaned up")
            
            # Verify current structure
            print("\n📊 Current marker_calculator_data structure:")
            result = db.session.execute(text("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_data'
                ORDER BY ORDINAL_POSITION
            """))
            
            columns = result.fetchall()
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                print(f"   - {col[0]}: {col[1]} {nullable}")
            
            print("\n🎉 Cleanup completed! Calculator is now purely order-based with tab persistence.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during cleanup: {str(e)}")
            raise

if __name__ == "__main__":
    remove_table_id_column()
