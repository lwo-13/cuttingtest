#!/usr/bin/env python3
"""
Database Migration Script for Width Change Approval Workflow
Creates the new tables: width_change_requests and marker_requests
"""

import sys
import os
from datetime import datetime

# Add the api-server-flask directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'react-flask-authentication', 'api-server-flask'))

try:
    from api import create_app
    from api.models import db, WidthChangeRequest, MarkerRequest
    print("✅ Successfully imported Flask app and models")
except ImportError as e:
    print(f"❌ Error importing Flask app or models: {e}")
    print("Make sure you're running this script from the project root directory")
    sys.exit(1)

def create_tables():
    """Create the new tables for width change approval workflow"""
    
    print("🚀 Starting database table creation...")
    
    # Create Flask app instance
    app = create_app()
    
    with app.app_context():
        try:
            # Check if tables already exist
            inspector = db.inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            tables_to_create = []
            
            if 'width_change_requests' not in existing_tables:
                tables_to_create.append('width_change_requests')
            else:
                print("⚠️  Table 'width_change_requests' already exists, skipping...")
            
            if 'marker_requests' not in existing_tables:
                tables_to_create.append('marker_requests')
            else:
                print("⚠️  Table 'marker_requests' already exists, skipping...")
            
            if not tables_to_create:
                print("✅ All tables already exist. No migration needed.")
                return True
            
            print(f"📝 Creating tables: {', '.join(tables_to_create)}")
            
            # Create only the new tables
            if 'width_change_requests' in tables_to_create:
                WidthChangeRequest.__table__.create(db.engine, checkfirst=True)
                print("✅ Created table: width_change_requests")
            
            if 'marker_requests' in tables_to_create:
                MarkerRequest.__table__.create(db.engine, checkfirst=True)
                print("✅ Created table: marker_requests")
            
            # Verify tables were created
            inspector = db.inspect(db.engine)
            updated_tables = inspector.get_table_names()
            
            success = True
            for table in tables_to_create:
                if table in updated_tables:
                    print(f"✅ Verified table '{table}' exists")
                else:
                    print(f"❌ Failed to create table '{table}'")
                    success = False
            
            if success:
                print("\n🎉 Database migration completed successfully!")
                print("\nNew tables created:")
                print("  • width_change_requests - Stores width change requests from spreaders")
                print("  • marker_requests - Stores marker creation requests for planners")
                print("\nNext steps:")
                print("  1. Assign 'Shift Manager' role to appropriate users")
                print("  2. Test the width change approval workflow")
                print("  3. Check the new menu items in the UI")
            
            return success
            
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return False

def show_table_info():
    """Display information about the tables that will be created"""
    
    print("\n📋 Table Information:")
    print("\n1. width_change_requests:")
    print("   - Stores all width change requests from spreader operators")
    print("   - Links to mattresses table")
    print("   - Tracks approval status and shift manager decisions")
    print("   - Supports both 'change_marker' and 'new_marker' request types")
    
    print("\n2. marker_requests:")
    print("   - Stores marker creation requests for planners")
    print("   - Created automatically when 'new_marker' width changes are approved")
    print("   - Tracks assignment to planners and completion status")
    print("   - Links back to the originating width change request")
    
    print("\n🔗 Relationships:")
    print("   - width_change_requests.mattress_id → mattresses.id")
    print("   - width_change_requests.selected_marker_id → marker_headers.id")
    print("   - marker_requests.width_change_request_id → width_change_requests.id")
    print("   - marker_requests.created_marker_id → marker_headers.id")

def main():
    """Main function to run the migration"""
    
    print("=" * 60)
    print("Width Change Approval Workflow - Database Migration")
    print("=" * 60)
    
    # Show table information
    show_table_info()
    
    # Ask for confirmation
    print("\n" + "=" * 60)
    response = input("Do you want to proceed with creating these tables? (y/N): ").strip().lower()
    
    if response not in ['y', 'yes']:
        print("❌ Migration cancelled by user")
        return
    
    # Create tables
    success = create_tables()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Migration failed!")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
