#!/usr/bin/env python3
"""
Script to check the current state of order_comments table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import create_app
from api.models import db
from sqlalchemy import text
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_table():
    """Check the current state of order_comments table"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🔍 Checking order_comments table state")
            
            # Check table structure
            logger.info("📋 Table structure:")
            columns_result = db.session.execute(text("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'order_comments'
                ORDER BY ORDINAL_POSITION
            """))
            
            for column in columns_result.fetchall():
                logger.info(f"  - {column[0]}: {column[1]} ({'NULL' if column[2] == 'YES' else 'NOT NULL'})")
            
            # Check constraints
            logger.info("🔒 Constraints:")
            constraints_result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'order_comments'
            """))
            
            for constraint in constraints_result.fetchall():
                logger.info(f"  - {constraint[0]}: {constraint[1]}")
            
            # Check current data
            logger.info("📊 Current data:")
            data_result = db.session.execute(text("""
                SELECT 
                    order_commessa, 
                    combination_id, 
                    CASE WHEN comment_text IS NULL THEN 'NULL' 
                         WHEN LEN(comment_text) > 50 THEN LEFT(comment_text, 50) + '...'
                         ELSE comment_text END as comment_preview
                FROM order_comments
                ORDER BY order_commessa, combination_id
            """))
            
            for row in data_result.fetchall():
                logger.info(f"  - Order: {row[0]}, Combination: {row[1]}, Comment: {row[2]}")
            
            # Check for duplicates
            logger.info("🔍 Checking for duplicates:")
            duplicates_result = db.session.execute(text("""
                SELECT order_commessa, combination_id, COUNT(*) as count
                FROM order_comments
                GROUP BY order_commessa, combination_id
                HAVING COUNT(*) > 1
            """))
            
            duplicates = duplicates_result.fetchall()
            if duplicates:
                logger.warning("⚠️ Found duplicates:")
                for dup in duplicates:
                    logger.warning(f"  - Order: {dup[0]}, Combination: {dup[1]}, Count: {dup[2]}")
            else:
                logger.info("✅ No duplicates found")
            
        except Exception as e:
            logger.error(f"❌ Check failed: {e}")

if __name__ == "__main__":
    check_table()
