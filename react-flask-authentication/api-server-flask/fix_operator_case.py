#!/usr/bin/env python3
"""
Script to fix the case sensitivity issue in the operators table.
This will convert all operator_type values to lowercase.
"""

import sys
import os
import traceback

# Add the parent directory to the Python path so we can import from api
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import create_app
from api.models import db
from sqlalchemy import text

def fix_operator_case():
    """Fix the case sensitivity in operator_type field."""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Starting operator_type case fix...")
            
            # Update all operator_type values to lowercase
            result = db.session.execute(text("""
                UPDATE operators 
                SET operator_type = LOWER(operator_type)
                WHERE operator_type != LOWER(operator_type)
            """))
            
            rows_affected = result.rowcount
            print(f"📝 Updated {rows_affected} operator records to lowercase")
            
            # Show current state
            operators = db.session.execute(text("""
                SELECT id, name, operator_type, active 
                FROM operators 
                ORDER BY operator_type, name
            """)).fetchall()
            
            print("\n📊 Current operators in database:")
            print("-" * 60)
            for op in operators:
                status = "✅ Active" if op.active else "❌ Inactive"
                print(f"ID: {op.id:2d} | {op.operator_type:10s} | {op.name:20s} | {status}")
            
            # Commit changes
            db.session.commit()
            print(f"\n✅ Case fix completed successfully!")
            print(f"📊 Total operators: {len(operators)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Case fix failed: {str(e)}")
            print(f"📋 Error details: {traceback.format_exc()}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = fix_operator_case()
    sys.exit(0 if success else 1)
