#!/usr/bin/env python3
"""
Migration script to add marker_width column to marker_calculator_markers table.
Run this script to update the existing database schema.
"""

from api import create_app, db
from sqlalchemy import text

def add_width_column():
    """Add marker_width column to marker_calculator_markers table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if the column already exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'marker_calculator_markers' 
                AND COLUMN_NAME = 'marker_width'
            """))
            
            if result.fetchone():
                print("✅ marker_width column already exists in marker_calculator_markers table")
                return
            
            # Add the marker_width column
            db.session.execute(text("""
                ALTER TABLE marker_calculator_markers 
                ADD marker_width FLOAT NULL
            """))
            
            db.session.commit()
            print("✅ Successfully added marker_width column to marker_calculator_markers table")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error adding marker_width column: {str(e)}")
            raise

if __name__ == "__main__":
    add_width_column()
