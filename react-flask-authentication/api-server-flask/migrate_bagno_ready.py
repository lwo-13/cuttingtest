#!/usr/bin/env python3
"""
Migration script to rename pcs_bundle to bagno_ready and change type to Boolean
"""

import pyodbc
from api.config import BaseConfig

def run_migration():
    """Run the database migration"""
    
    # Connection string for SQL Server
    connection_string = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={BaseConfig.DB_HOST},{BaseConfig.DB_PORT};"
        f"DATABASE={BaseConfig.DB_NAME};"
        f"UID={BaseConfig.DB_USERNAME};"
        f"PWD={BaseConfig.DB_PASS};"
        f"TrustServerCertificate=yes;"
    )
    
    try:
        # Connect to database
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("🔄 Starting migration: pcs_bundle -> bagno_ready (Boolean)")
        
        # Step 1: Check if pcs_bundle column exists
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'mattress_details' 
            AND COLUMN_NAME IN ('pcs_bundle', 'bagno_ready')
        """)
        
        existing_columns = {row[0]: row[1] for row in cursor.fetchall()}
        print(f"📋 Existing columns: {existing_columns}")
        
        if 'bagno_ready' in existing_columns:
            print("✅ bagno_ready column already exists. Migration may have already been run.")
            return
            
        if 'pcs_bundle' not in existing_columns:
            print("❌ pcs_bundle column not found. Nothing to migrate.")
            return
            
        # Step 2: Add new bagno_ready column as BIT (Boolean)
        print("➕ Adding bagno_ready column...")
        cursor.execute("""
            ALTER TABLE mattress_details 
            ADD bagno_ready BIT NULL DEFAULT 0
        """)
        
        # Step 3: Copy data from pcs_bundle to bagno_ready
        # Convert: NULL/0 -> 0 (False), any other value -> 1 (True)
        print("📋 Copying data from pcs_bundle to bagno_ready...")
        cursor.execute("""
            UPDATE mattress_details 
            SET bagno_ready = CASE 
                WHEN pcs_bundle IS NULL OR pcs_bundle = 0 THEN 0 
                ELSE 1 
            END
        """)
        
        # Step 4: Drop the old pcs_bundle column
        print("🗑️ Dropping old pcs_bundle column...")
        cursor.execute("ALTER TABLE mattress_details DROP COLUMN pcs_bundle")
        
        # Commit changes
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify the result
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'mattress_details' 
            AND COLUMN_NAME = 'bagno_ready'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verification: bagno_ready column created - Type: {result[1]}, Nullable: {result[2]}")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        raise
        
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_migration()
