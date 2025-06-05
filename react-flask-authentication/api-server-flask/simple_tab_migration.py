#!/usr/bin/env python3
"""
Simple script to add tab_number column step by step
"""

from api import create_app, db
from sqlalchemy import text

def simple_migration():
    """Add tab_number column step by step"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🚀 Starting simple tab_number migration...")
            
            # Step 1: Add tab_number column
            print("Step 1: Adding tab_number column...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ADD tab_number VARCHAR(10) NULL
                """))
                db.session.commit()
                print("✅ Added tab_number column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("✅ tab_number column already exists")
                    db.session.rollback()
                else:
                    raise
            
            # Step 2: Update existing records
            print("Step 2: Updating existing records with tab_number '01'...")
            result = db.session.execute(text("""
                UPDATE marker_calculator_data 
                SET tab_number = '01' 
                WHERE tab_number IS NULL
            """))
            db.session.commit()
            print(f"✅ Updated {result.rowcount} records with tab_number '01'")
            
            # Step 3: Check for duplicates before making column NOT NULL
            print("Step 3: Checking for duplicates...")
            result = db.session.execute(text("""
                SELECT order_commessa, COUNT(*) as count
                FROM marker_calculator_data 
                WHERE tab_number = '01'
                GROUP BY order_commessa
                HAVING COUNT(*) > 1
            """))
            
            duplicates = result.fetchall()
            if duplicates:
                print(f"Found {len(duplicates)} orders with duplicate records:")
                for dup in duplicates:
                    print(f"  - Order: {dup[0]}, Count: {dup[1]}")
                
                # Remove duplicates, keeping the latest record
                print("Removing duplicates...")
                for dup in duplicates:
                    order_commessa = dup[0]
                    
                    # Get all record IDs for this order, ordered by most recent first
                    result = db.session.execute(text("""
                        SELECT id FROM marker_calculator_data 
                        WHERE order_commessa = :order_commessa 
                        AND tab_number = '01'
                        ORDER BY updated_at DESC, created_at DESC, id DESC
                    """), {'order_commessa': order_commessa})
                    
                    record_ids = [row[0] for row in result.fetchall()]
                    
                    if len(record_ids) > 1:
                        # Keep the first (most recent) record, delete the rest
                        ids_to_delete = record_ids[1:]
                        for record_id in ids_to_delete:
                            # First delete related markers
                            db.session.execute(text("""
                                DELETE FROM marker_calculator_markers 
                                WHERE calculator_data_id = :record_id
                            """), {'record_id': record_id})
                            
                            # Then delete the main record
                            db.session.execute(text("""
                                DELETE FROM marker_calculator_data 
                                WHERE id = :record_id
                            """), {'record_id': record_id})
                        
                        print(f"  - Deleted {len(ids_to_delete)} duplicate records for order {order_commessa}")
                
                db.session.commit()
                print("✅ Removed all duplicate records")
            else:
                print("✅ No duplicate records found")
            
            # Step 4: Make column NOT NULL
            print("Step 4: Making tab_number column NOT NULL...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ALTER COLUMN tab_number VARCHAR(10) NOT NULL
                """))
                db.session.commit()
                print("✅ Made tab_number column NOT NULL")
            except Exception as e:
                print(f"⚠️  Could not make column NOT NULL: {str(e)}")
                db.session.rollback()
            
            # Step 5: Add unique constraint
            print("Step 5: Adding unique constraint...")
            try:
                db.session.execute(text("""
                    ALTER TABLE marker_calculator_data 
                    ADD CONSTRAINT uq_calculator_order_tab 
                    UNIQUE (order_commessa, tab_number)
                """))
                db.session.commit()
                print("✅ Added unique constraint")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("✅ Unique constraint already exists")
                    db.session.rollback()
                else:
                    print(f"⚠️  Could not add unique constraint: {str(e)}")
                    db.session.rollback()
            
            print("🎉 Migration completed!")
            
            # Verify final state
            print("\n📊 Final verification:")
            result = db.session.execute(text("""
                SELECT COUNT(*) as total,
                       COUNT(DISTINCT order_commessa) as unique_orders
                FROM marker_calculator_data
            """))
            stats = result.fetchone()
            print(f"✅ Total records: {stats[0]}")
            print(f"✅ Unique orders: {stats[1]}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    simple_migration()
