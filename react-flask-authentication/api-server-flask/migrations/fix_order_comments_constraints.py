#!/usr/bin/env python3
"""
Migration script to fix order_comments table constraints.
This script properly removes the old unique constraint and ensures the new one is in place.
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

def run_migration():
    """Fix the order_comments table constraints"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🚀 Starting constraint fix for order_comments")
            
            # Step 1: Find and drop all unique constraints on order_commessa
            logger.info("📝 Finding existing unique constraints...")
            
            # Query to find all unique constraints on the table
            constraints_result = db.session.execute(text("""
                SELECT 
                    tc.CONSTRAINT_NAME,
                    tc.CONSTRAINT_TYPE,
                    ccu.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                    ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                WHERE tc.TABLE_NAME = 'order_comments' 
                AND tc.CONSTRAINT_TYPE = 'UNIQUE'
                AND ccu.COLUMN_NAME = 'order_commessa'
            """))
            
            constraints = constraints_result.fetchall()
            
            for constraint in constraints:
                constraint_name = constraint[0]
                logger.info(f"📝 Dropping constraint: {constraint_name}")
                try:
                    db.session.execute(text(f"""
                        ALTER TABLE order_comments 
                        DROP CONSTRAINT [{constraint_name}]
                    """))
                    logger.info(f"✅ Dropped constraint: {constraint_name}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not drop constraint {constraint_name}: {e}")
            
            # Step 2: Check if our new constraint exists
            logger.info("📝 Checking for new constraint...")
            new_constraint_result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'order_comments' 
                AND CONSTRAINT_NAME = 'uq_order_comments_combination'
            """))
            
            if not new_constraint_result.fetchone():
                logger.info("📝 Adding new unique constraint...")
                db.session.execute(text("""
                    ALTER TABLE order_comments 
                    ADD CONSTRAINT uq_order_comments_combination 
                    UNIQUE (order_commessa, combination_id)
                """))
                logger.info("✅ Added new unique constraint")
            else:
                logger.info("✅ New constraint already exists")
            
            # Step 3: Commit the changes
            db.session.commit()
            logger.info("✅ Constraint fix completed successfully!")
            
            # Step 4: Show current constraints
            logger.info("📊 Current constraints on order_comments:")
            final_constraints = db.session.execute(text("""
                SELECT 
                    tc.CONSTRAINT_NAME,
                    tc.CONSTRAINT_TYPE,
                    STRING_AGG(ccu.COLUMN_NAME, ', ') as COLUMNS
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                    ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                WHERE tc.TABLE_NAME = 'order_comments' 
                AND tc.CONSTRAINT_TYPE = 'UNIQUE'
                GROUP BY tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE
            """))
            
            for constraint in final_constraints.fetchall():
                logger.info(f"  - {constraint[0]}: {constraint[2]}")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    run_migration()
