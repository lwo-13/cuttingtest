#!/usr/bin/env python3
"""
Script to update empty pcs_actual fields in the mattress_sizes table.
This script calculates pcs_actual = pcs_layer * layers_a for all mattresses
where layers_a is not null and pcs_actual is null or 0.
"""

import pyodbc
import sys
from datetime import datetime

# Database configuration (same as your Flask app)
DB_HOST = '172.27.57.201'
DB_PORT = '1433'
DB_NAME = 'CuttingRoom'
DB_USERNAME = 'sa'
DB_PASSWORD = 'sqladmin'

def get_database_connection():
    """Create and return a database connection"""
    try:
        # Connection string for SQL Server with ODBC Driver 18
        connection_string = (
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={DB_HOST},{DB_PORT};"
            f"DATABASE={DB_NAME};"
            f"UID={DB_USERNAME};"
            f"PWD={DB_PASSWORD};"
            f"TrustServerCertificate=yes;"
            f"charset=utf8"
        )
        
        connection = pyodbc.connect(connection_string)
        print(f"✅ Successfully connected to database: {DB_NAME}")
        return connection
        
    except Exception as e:
        print(f"❌ Error connecting to database: {str(e)}")
        sys.exit(1)

def update_pcs_actual_fields():
    """Update pcs_actual fields where they are empty but layers_a exists"""
    
    connection = get_database_connection()
    cursor = connection.cursor()
    
    try:
        # First, let's see how many records need updating
        check_query = """
        SELECT COUNT(*) as count_to_update
        FROM mattress_sizes ms
        INNER JOIN mattress_details md ON ms.mattress_id = md.mattress_id
        WHERE md.layers_a IS NOT NULL 
        AND md.layers_a > 0
        AND (ms.pcs_actual IS NULL OR ms.pcs_actual = 0)
        """
        
        cursor.execute(check_query)
        count_result = cursor.fetchone()
        records_to_update = count_result[0] if count_result else 0
        
        print(f"📊 Found {records_to_update} records that need pcs_actual updates")
        
        if records_to_update == 0:
            print("✅ No records need updating. All pcs_actual fields are already populated.")
            return
        
        # Show some examples of what will be updated
        preview_query = """
        SELECT TOP 5
            ms.id,
            ms.mattress_id,
            ms.size,
            ms.pcs_layer,
            md.layers_a,
            ms.pcs_actual as current_pcs_actual,
            (ms.pcs_layer * md.layers_a) as calculated_pcs_actual
        FROM mattress_sizes ms
        INNER JOIN mattress_details md ON ms.mattress_id = md.mattress_id
        WHERE md.layers_a IS NOT NULL 
        AND md.layers_a > 0
        AND (ms.pcs_actual IS NULL OR ms.pcs_actual = 0)
        ORDER BY ms.id
        """
        
        cursor.execute(preview_query)
        preview_results = cursor.fetchall()
        
        print("\n📋 Preview of records to be updated (first 5):")
        print("ID\tMattress ID\tSize\tPcs Layer\tLayers A\tCurrent Pcs Actual\tCalculated Pcs Actual")
        print("-" * 90)
        
        for row in preview_results:
            print(f"{row[0]}\t{row[1]}\t\t{row[2]}\t{row[3]}\t\t{row[4]}\t\t{row[5] or 'NULL'}\t\t\t{row[6]}")
        
        # Ask for confirmation
        print(f"\n⚠️  This will update {records_to_update} records.")
        confirmation = input("Do you want to proceed? (y/N): ").strip().lower()
        
        if confirmation != 'y':
            print("❌ Operation cancelled by user.")
            return
        
        # Perform the update
        update_query = """
        UPDATE ms
        SET 
            ms.pcs_actual = ms.pcs_layer * md.layers_a,
            ms.updated_at = GETDATE()
        FROM mattress_sizes ms
        INNER JOIN mattress_details md ON ms.mattress_id = md.mattress_id
        WHERE md.layers_a IS NOT NULL 
        AND md.layers_a > 0
        AND (ms.pcs_actual IS NULL OR ms.pcs_actual = 0)
        """
        
        print("\n🔄 Executing update...")
        cursor.execute(update_query)
        updated_rows = cursor.rowcount
        
        # Commit the changes
        connection.commit()
        
        print(f"✅ Successfully updated {updated_rows} records!")
        
        # Show some updated records for verification
        verification_query = """
        SELECT TOP 5
            ms.id,
            ms.mattress_id,
            ms.size,
            ms.pcs_layer,
            md.layers_a,
            ms.pcs_actual,
            ms.updated_at
        FROM mattress_sizes ms
        INNER JOIN mattress_details md ON ms.mattress_id = md.mattress_id
        WHERE md.layers_a IS NOT NULL 
        AND md.layers_a > 0
        AND ms.pcs_actual IS NOT NULL
        AND ms.pcs_actual > 0
        ORDER BY ms.updated_at DESC
        """
        
        cursor.execute(verification_query)
        verification_results = cursor.fetchall()
        
        print("\n✅ Verification - Recently updated records (first 5):")
        print("ID\tMattress ID\tSize\tPcs Layer\tLayers A\tPcs Actual\tUpdated At")
        print("-" * 80)
        
        for row in verification_results:
            updated_at = row[6].strftime('%Y-%m-%d %H:%M:%S') if row[6] else 'N/A'
            print(f"{row[0]}\t{row[1]}\t\t{row[2]}\t{row[3]}\t\t{row[4]}\t\t{row[5]}\t\t{updated_at}")
        
    except Exception as e:
        print(f"❌ Error during update: {str(e)}")
        connection.rollback()
        raise
    
    finally:
        cursor.close()
        connection.close()
        print("\n🔌 Database connection closed.")

def main():
    """Main function"""
    print("🚀 Starting pcs_actual update script...")
    print(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("-" * 60)
    
    try:
        update_pcs_actual_fields()
        print("\n🎉 Script completed successfully!")
        
    except Exception as e:
        print(f"\n💥 Script failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
