#!/usr/bin/env python3
"""
Migration script to remove the unique constraint on marker names in marker_calculator_markers table.
This allows duplicate marker names within the same calculator since it's just a helper tool.
"""

from api import create_app, db
from sqlalchemy import text

def remove_marker_name_constraint():
    """Remove the unique constraint on marker names"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if the constraint exists
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'marker_calculator_markers' 
                AND CONSTRAINT_NAME = 'uq_calculator_marker_name'
            """))
            
            if not result.fetchone():
                print("✅ Unique constraint 'uq_calculator_marker_name' does not exist or already removed")
                return
            
            # Drop the unique constraint
            db.session.execute(text("""
                ALTER TABLE marker_calculator_markers 
                DROP CONSTRAINT uq_calculator_marker_name
            """))
            
            db.session.commit()
            print("✅ Successfully removed unique constraint on marker names - duplicate names are now allowed")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error removing constraint: {str(e)}")
            # This might fail if the constraint doesn't exist, which is okay
            print("Note: This error might be expected if the constraint was already removed")

if __name__ == "__main__":
    remove_marker_name_constraint()
