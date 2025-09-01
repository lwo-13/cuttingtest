#!/usr/bin/env python3
"""
Migration script to add combination_id to order_comments table
and migrate existing comments to work with production center combinations.

This script:
1. Adds combination_id column to order_comments table
2. Removes the unique constraint on order_commessa
3. Adds new unique constraint on (order_commessa, combination_id)
4. Migrates existing comments to have combination_id = NULL (for backward compatibility)
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
    """Run the migration to add combination_id to order_comments"""
    app = create_app()
    
    with app.app_context():
        try:
            logger.info("🚀 Starting migration: Add combination_id to order_comments")
            
            # Check if the combination_id column already exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'order_comments' 
                AND COLUMN_NAME = 'combination_id'
            """))
            
            if result.fetchone():
                logger.info("✅ combination_id column already exists, skipping migration")
                return
            
            # Step 1: Drop the existing unique constraint on order_commessa
            logger.info("📝 Dropping existing unique constraint on order_commessa...")
            try:
                db.session.execute(text("""
                    ALTER TABLE order_comments 
                    DROP CONSTRAINT UQ__order_co__order_commessa
                """))
                logger.info("✅ Dropped existing unique constraint")
            except Exception as e:
                logger.warning(f"⚠️ Could not drop constraint (might not exist): {e}")
            
            # Step 2: Add combination_id column
            logger.info("📝 Adding combination_id column...")
            db.session.execute(text("""
                ALTER TABLE order_comments 
                ADD combination_id NVARCHAR(36) NULL
            """))
            logger.info("✅ Added combination_id column")
            
            # Step 3: Add new unique constraint
            logger.info("📝 Adding new unique constraint...")
            db.session.execute(text("""
                ALTER TABLE order_comments 
                ADD CONSTRAINT uq_order_comments_combination 
                UNIQUE (order_commessa, combination_id)
            """))
            logger.info("✅ Added new unique constraint")
            
            # Step 4: Commit the changes
            db.session.commit()
            logger.info("✅ Migration completed successfully!")
            
            # Step 5: Show current state
            result = db.session.execute(text("SELECT COUNT(*) FROM order_comments"))
            count = result.fetchone()[0]
            logger.info(f"📊 Current order_comments count: {count}")
            
            if count > 0:
                logger.info("ℹ️ Existing comments will have combination_id = NULL")
                logger.info("ℹ️ They will be treated as global comments (not tied to specific production centers)")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    run_migration()
