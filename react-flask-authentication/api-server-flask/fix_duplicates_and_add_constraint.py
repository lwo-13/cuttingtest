#!/usr/bin/env python3
"""
Script to fix duplicate records and add the unique constraint
"""

from api import create_app, db
from sqlalchemy import text

def fix_duplicates_and_add_constraint():
    """Fix duplicate records and add unique constraint"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🚀 Fixing duplicate records and adding unique constraint...")
            
            # Step 1: Check for duplicates
            print("Step 1: Checking for duplicate records...")
            result = db.session.execute(text("""
                SELECT order_commessa, tab_number, COUNT(*) as count
                FROM marker_calculator_data 
                GROUP BY order_commessa, tab_number
                HAVING COUNT(*) > 1
            """))
            
            duplicates = result.fetchall()
            if duplicates:
                print(f"Found {len(duplicates)} duplicate combinations:")
                for dup in duplicates:
                    print(f"  - Order: {dup[0]}, Tab: {dup[1]}, Count: {dup[2]}")
                
                # Step 2: Remove duplicates, keeping only the latest record for each combination
                print("Step 2: Removing duplicate records (keeping latest)...")
                
                for dup in duplicates:
                    order_commessa = dup[0]
                    tab_number = dup[1]
                    
                    # Delete all but the most recent record for this combination
                    db.session.execute(text("""
                        DELETE FROM marker_calculator_data 
                        WHERE order_commessa = :order_commessa 
                        AND tab_number = :tab_number 
                        AND id NOT IN (
                            SELECT TOP 1 id 
                            FROM marker_calculator_data 
                            WHERE order_commessa = :order_commessa 
                            AND tab_number = :tab_number 
                            ORDER BY updated_at DESC, created_at DESC, id DESC
                        )
                    """), {
                        'order_commessa': order_commessa,
                        'tab_number': tab_number
                    })
                    
                print("✅ Removed duplicate records")
            else:
                print("✅ No duplicate records found")
            
            # Step 3: Add unique constraint if it doesn't exist
            print("Step 3: Adding unique constraint...")
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'marker_calculator_data' 
                AND CONSTRAINT_NAME = 'uq_calculator_order_tab'
            """))
            
            if not result.fetchone():
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
            print("🎉 Successfully fixed duplicates and added constraint!")
            
            # Step 4: Verify the fix
            print("Step 4: Verifying the fix...")
            result = db.session.execute(text("""
                SELECT COUNT(*) as total_records,
                       COUNT(DISTINCT order_commessa, tab_number) as unique_combinations
                FROM marker_calculator_data
            """))
            
            stats = result.fetchone()
            print(f"✅ Total records: {stats[0]}")
            print(f"✅ Unique combinations: {stats[1]}")
            
            if stats[0] == stats[1]:
                print("✅ All records are unique - migration completed successfully!")
            else:
                print("⚠️  Warning: Still have duplicate records")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during fix: {str(e)}")
            raise

if __name__ == "__main__":
    fix_duplicates_and_add_constraint()
