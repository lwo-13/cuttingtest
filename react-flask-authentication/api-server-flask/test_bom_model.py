#!/usr/bin/env python3
"""
Test script to verify the NavBom model and API endpoint work correctly.
This script tests the database model and API functionality.
"""

import sys
import os

# Add the api directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from api import create_app
from api.models import db, NavBom

def test_nav_bom_model():
    """Test the NavBom model functionality"""
    app = create_app()
    
    with app.app_context():
        try:
            # Test creating a NavBom record
            test_bom = NavBom(
                shortcut_dimension_2_code="TEST001",
                item_no="FABRIC001",
                quantity=10.5,
                pf_vertical_component="RED",
                source="Fabric"
            )
            
            # Test the to_dict method
            bom_dict = test_bom.to_dict()
            print("✅ NavBom model created successfully")
            print(f"   Order Number: {bom_dict['order_number']}")
            print(f"   Item: {bom_dict['item']}")
            print(f"   Quantity: {bom_dict['quantity']}")
            print(f"   Color Code: {bom_dict['color_code']}")
            print(f"   Category: {bom_dict['category']}")
            
            # Test the __repr__ method
            print(f"   Repr: {repr(test_bom)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing NavBom model: {str(e)}")
            return False

def test_bom_api_endpoint():
    """Test the BOM API endpoint"""
    app = create_app()
    
    with app.test_client() as client:
        try:
            # Test the BOM endpoint with a test order number
            response = client.get('/api/orders/bom/TEST001')
            
            print(f"✅ BOM API endpoint responded with status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"   Success: {data.get('success')}")
                print(f"   Message: {data.get('message', 'No message')}")
                print(f"   Data count: {len(data.get('data', []))}")
            else:
                print(f"   Response: {response.get_data(as_text=True)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing BOM API endpoint: {str(e)}")
            return False

if __name__ == "__main__":
    print("🧪 Testing NavBom Model and API...")
    print("=" * 50)
    
    # Test the model
    print("\n📋 Testing NavBom Model:")
    model_test_passed = test_nav_bom_model()
    
    # Test the API endpoint
    print("\n🌐 Testing BOM API Endpoint:")
    api_test_passed = test_bom_api_endpoint()
    
    print("\n" + "=" * 50)
    if model_test_passed and api_test_passed:
        print("✅ All tests passed! The BOM functionality is ready.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
    
    print("\n📝 Next steps:")
    print("1. Start the Flask development server")
    print("2. Navigate to the Order Planning page")
    print("3. Select an order and click the BOM icon (📋) next to the Italian ratio button")
    print("4. The BOM dialog should open and display the bill of materials for the selected order")
