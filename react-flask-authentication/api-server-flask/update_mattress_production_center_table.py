#!/usr/bin/env python3
"""
Update mattress_production_center table to handle all table types
by adding a table_type column to support MATTRESS, ALONG, WEFT, and BIAS tables
"""

import pyodbc
from api.config import BaseConfig

def update_production_center_table():
    """Update the mattress_production_center table to handle all table types"""

    # Use the same database configuration as the Flask app
    server = BaseConfig.DB_HOST
    port = BaseConfig.DB_PORT
    database = BaseConfig.DB_NAME
    username = BaseConfig.DB_USERNAME
    password = BaseConfig.DB_PASS

    # Connection string using ODBC Driver 18 (same as Flask app)
    conn_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server},{port};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        f"TrustServerCertificate=yes;"
    )
    
    try:
        # Connect to database
        print("🔗 Connecting to database...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Check if table exists
        print("🔍 Checking if mattress_production_center table exists...")
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'mattress_production_center'
        """)
        
        table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            print("❌ mattress_production_center table does not exist!")
            return False
        
        # Check if table_type column already exists
        print("🔍 Checking if table_type column exists...")
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'mattress_production_center' 
            AND COLUMN_NAME = 'table_type'
        """)
        
        column_exists = cursor.fetchone()[0] > 0
        
        if column_exists:
            print("⚠️ table_type column already exists!")
            response = input("Do you want to continue anyway? (y/N): ")
            if response.lower() != 'y':
                print("❌ Operation cancelled.")
                return False
        else:
            # Add table_type column
            print("➕ Adding table_type column...")
            cursor.execute("""
                ALTER TABLE mattress_production_center 
                ADD table_type NVARCHAR(10) NULL
            """)
            
            # Update existing records to have 'MATTRESS' as table_type
            print("🔄 Updating existing records to have 'MATTRESS' table_type...")
            cursor.execute("""
                UPDATE mattress_production_center 
                SET table_type = 'MATTRESS' 
                WHERE table_type IS NULL
            """)
            
            # Make table_type NOT NULL after updating existing records
            print("🔒 Making table_type column NOT NULL...")
            cursor.execute("""
                ALTER TABLE mattress_production_center 
                ALTER COLUMN table_type NVARCHAR(10) NOT NULL
            """)
            
            # Add check constraint for table_type
            print("✅ Adding check constraint for table_type...")
            cursor.execute("""
                ALTER TABLE mattress_production_center 
                ADD CONSTRAINT CK_mattress_production_center_table_type 
                CHECK (table_type IN ('MATTRESS', 'ALONG', 'WEFT', 'BIAS'))
            """)
        
        # Create index on table_type for better performance
        print("📋 Creating index on table_type...")
        try:
            cursor.execute("""
                CREATE INDEX IX_mattress_production_center_table_type 
                ON mattress_production_center (table_type)
            """)
        except pyodbc.Error as e:
            if "already exists" in str(e):
                print("⚠️ Index already exists, skipping...")
            else:
                raise
        
        # Create composite index for combination validation
        print("📋 Creating composite index for combination validation...")
        try:
            cursor.execute("""
                CREATE INDEX IX_mattress_production_center_combination 
                ON mattress_production_center (cutting_room, destination, table_type)
            """)
        except pyodbc.Error as e:
            if "already exists" in str(e):
                print("⚠️ Index already exists, skipping...")
            else:
                raise
        
        # Commit changes
        conn.commit()
        print("✅ mattress_production_center table updated successfully!")
        
        # Display updated table structure
        print("\n📋 Updated table structure:")
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'mattress_production_center'
            ORDER BY ORDINAL_POSITION
        """)
        
        columns = cursor.fetchall()
        for column in columns:
            print(f"  - {column[0]}: {column[1]} ({'NULL' if column[2] == 'YES' else 'NOT NULL'}) {column[3] or ''}")
        
    except pyodbc.Error as e:
        print(f"❌ Database error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
        
    finally:
        if 'conn' in locals():
            conn.close()
            print("🔌 Database connection closed.")
    
    return True

if __name__ == "__main__":
    print("🚀 Updating mattress_production_center table...")
    success = update_production_center_table()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Update the MattressProductionCenter model to include table_type")
        print("2. Update API endpoints to handle all table types")
        print("3. Update the frontend to use the unified table")
    else:
        print("\n💥 Migration failed!")
