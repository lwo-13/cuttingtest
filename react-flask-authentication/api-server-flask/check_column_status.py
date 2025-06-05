#!/usr/bin/env python3
"""
Script to check the current status of the tab_number column
"""

from api import create_app, db
from sqlalchemy import text

def check_column_status():
    """Check if tab_number column exists and its current state"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔍 Checking database column status...")
            
            # Check if tab_number column exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND COLUMN_NAME = 'tab_number'
            """))
            
            column_info = result.fetchone()
            if column_info:
                print(f"✅ tab_number column exists:")
                print(f"   - Data Type: {column_info[1]}")
                print(f"   - Nullable: {column_info[2]}")
            else:
                print("❌ tab_number column does not exist")
                return
            
            # Check current data in the table
            result = db.session.execute(text("""
                SELECT COUNT(*) as total_records
                FROM marker_calculator_data
            """))
            total = result.fetchone()[0]
            print(f"📊 Total records in marker_calculator_data: {total}")
            
            if total > 0:
                # Check tab_number values
                result = db.session.execute(text("""
                    SELECT tab_number, COUNT(*) as count
                    FROM marker_calculator_data 
                    GROUP BY tab_number
                    ORDER BY tab_number
                """))
                
                tab_counts = result.fetchall()
                print("📋 Tab number distribution:")
                for tab, count in tab_counts:
                    print(f"   - Tab '{tab}': {count} records")
                
                # Check for potential duplicates
                result = db.session.execute(text("""
                    SELECT order_commessa, tab_number, COUNT(*) as count
                    FROM marker_calculator_data 
                    GROUP BY order_commessa, tab_number
                    HAVING COUNT(*) > 1
                """))
                
                duplicates = result.fetchall()
                if duplicates:
                    print(f"⚠️  Found {len(duplicates)} duplicate order+tab combinations:")
                    for dup in duplicates:
                        print(f"   - Order: {dup[0]}, Tab: {dup[1]}, Count: {dup[2]}")
                else:
                    print("✅ No duplicate order+tab combinations found")
            
            # Check if unique constraint exists
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND CONSTRAINT_NAME = 'uq_calculator_order_tab'
            """))
            
            if result.fetchone():
                print("✅ Unique constraint 'uq_calculator_order_tab' exists")
            else:
                print("❌ Unique constraint 'uq_calculator_order_tab' does not exist")
            
        except Exception as e:
            print(f"❌ Error checking column status: {str(e)}")
            raise

if __name__ == "__main__":
    check_column_status()
