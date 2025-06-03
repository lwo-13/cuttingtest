#!/usr/bin/env python3
"""
Script to manually create the marker calculator tables in the database.
Run this if the tables are not being created automatically.
"""

from api import create_app, db
from api.models import MarkerCalculatorData, MarkerCalculatorMarker, MarkerCalculatorQuantity

def create_calculator_tables():
    """Create the marker calculator tables"""
    app = create_app()
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ All database tables created successfully!")
            
            # Test if the calculator tables exist by trying to query them
            try:
                calculator_count = MarkerCalculatorData.query.count()
                marker_count = MarkerCalculatorMarker.query.count()
                quantity_count = MarkerCalculatorQuantity.query.count()
                
                print(f"✅ MarkerCalculatorData table: {calculator_count} records")
                print(f"✅ MarkerCalculatorMarker table: {marker_count} records")
                print(f"✅ MarkerCalculatorQuantity table: {quantity_count} records")
                print("✅ Calculator tables are working correctly!")
                
            except Exception as e:
                print(f"❌ Error testing calculator tables: {str(e)}")
                
        except Exception as e:
            print(f"❌ Error creating tables: {str(e)}")
            import traceback
            print(traceback.format_exc())

if __name__ == '__main__':
    create_calculator_tables()
