#!/usr/bin/env python3
"""
Test script to check if the Operator model can be imported and used correctly.
"""

import sys
import os

# Add the API directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'react-flask-authentication', 'api-server-flask'))

def test_operator_model():
    """Test the Operator model import and basic functionality."""
    print("🔍 Testing Operator model...")
    
    try:
        # Test imports
        print("📦 Testing imports...")
        from api import create_app
        from api.models import db, Operator
        print("   ✅ Imports successful")
        
        # Test app creation
        print("🏗️ Testing app creation...")
        app = create_app()
        print("   ✅ App creation successful")
        
        # Test database context
        print("🗄️ Testing database context...")
        with app.app_context():
            print("   ✅ Database context successful")
            
            # Test table creation
            print("📋 Testing table creation...")
            db.create_all()
            print("   ✅ Table creation successful")
            
            # Test model methods
            print("🔧 Testing model methods...")
            operators = Operator.get_by_type('spreader', active_only=True)
            print(f"   ✅ Found {len(operators)} spreader operators")
            
            # Test query
            print("🔍 Testing query...")
            all_operators = Operator.query.all()
            print(f"   ✅ Found {len(all_operators)} total operators")
            
            # Test creating a test operator (but don't commit)
            print("➕ Testing operator creation...")
            test_operator = Operator(
                name="Test Operator",
                operator_type="spreader",
                active=True
            )
            db.session.add(test_operator)
            # Don't commit - just test the creation
            db.session.rollback()
            print("   ✅ Operator creation test successful")
        
        print("\n✅ All tests passed! The Operator model is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        print(f"📋 Error details: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_operator_model()
    sys.exit(0 if success else 1)
