#!/usr/bin/env python3
"""
Script to create the nav_bom table if it doesn't exist.
This script should be run once to set up the BOM functionality.
"""

import sys
import os

# Add the api directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from api import create_app
from api.models import db, NavBom
from sqlalchemy import text

def create_nav_bom_table():
    """Create the nav_bom table if it doesn't exist"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if table exists
            table_exists = db.session.execute(text("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'nav_bom'
            """)).scalar()
            
            if table_exists:
                print("✅ nav_bom table already exists")
                
                # Check table structure
                columns = db.session.execute(text("""
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'nav_bom'
                    ORDER BY ORDINAL_POSITION
                """)).fetchall()
                
                print("📋 Table structure:")
                for col in columns:
                    print(f"   {col[0]} ({col[1]}) - {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
                
                # Check if there's any data
                count = db.session.execute(text("SELECT COUNT(*) FROM nav_bom")).scalar()
                print(f"📊 Records in table: {count}")
                
                if count > 0:
                    # Show sample data
                    sample = db.session.execute(text("""
                        SELECT TOP 3 [Shortcut Dimension 2 Code], [Item No_], [Quantity], [PFVertical Component], [Source]
                        FROM nav_bom
                    """)).fetchall()
                    
                    print("📋 Sample data:")
                    for row in sample:
                        print(f"   Order: {row[0]}, Item: {row[1]}, Qty: {row[2]}, Color: {row[3]}, Source: {row[4]}")
                
            else:
                print("⚠️ nav_bom table does not exist")
                print("🔧 Creating nav_bom table...")
                
                # Create the table using SQLAlchemy
                db.create_all()
                
                print("✅ nav_bom table created successfully")
                
                # Verify creation
                table_exists_after = db.session.execute(text("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = 'nav_bom'
                """)).scalar()
                
                if table_exists_after:
                    print("✅ Table creation verified")
                else:
                    print("❌ Table creation failed")
            
            return True
            
        except Exception as e:
            print(f"❌ Error working with nav_bom table: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

def test_bom_model():
    """Test the NavBom model with sample data"""
    app = create_app()
    
    with app.app_context():
        try:
            # Test creating a sample BOM record (don't save to DB)
            test_bom = NavBom(
                shortcut_dimension_2_code="TEST001",
                item_no="FABRIC001",
                quantity=10.5,
                pf_vertical_component="RED",
                source="Fabric"
            )
            
            # Test the to_dict method
            bom_dict = test_bom.to_dict()
            print("✅ NavBom model test successful")
            print(f"   Sample data: {bom_dict}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing NavBom model: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("🔧 Setting up BOM functionality...")
    print("=" * 60)
    
    # Create/check the table
    print("\n📋 Checking nav_bom table:")
    table_success = create_nav_bom_table()
    
    # Test the model
    print("\n🧪 Testing NavBom model:")
    model_success = test_bom_model()
    
    print("\n" + "=" * 60)
    if table_success and model_success:
        print("✅ BOM setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Ensure your nav_bom table has data")
        print("2. Restart your Flask server")
        print("3. Test the BOM functionality in the UI")
    else:
        print("❌ BOM setup encountered issues. Please check the errors above.")
    
    print("\n💡 Note: If the nav_bom table exists but is empty,")
    print("   you may need to populate it with data from your ERP system.")
