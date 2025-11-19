"""
Migration script to create default Spreader and Cutter operator user accounts.

This script creates 6 Spreader accounts (Spreader1-6) and 6 Cutter accounts (Cutter1-6)
where each account's password matches its username. These are system accounts used for
operator logins at physical workstations and do not require email addresses.

Run this script once during initial setup or after database reset.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api import create_app, db
from api.models import Users
from werkzeug.security import generate_password_hash

def create_operator_users():
    """Create default Spreader and Cutter operator accounts if they don't exist."""

    app = create_app()

    with app.app_context():

        created_count = 0
        skipped_count = 0

        # Create Spreader accounts (Spreader1 to Spreader6)
        for i in range(1, 7):
            username = f'Spreader{i}'
            password = username  # Password matches username

            # Check if user already exists
            existing_user = Users.query.filter_by(username=username).first()
            if existing_user:
                print(f'✓ {username} already exists - skipping')
                skipped_count += 1
                continue

            # Create new spreader user
            new_user = Users(
                username=username,
                email=None,
                password=generate_password_hash(password),
                role='Spreader',
                jwt_auth_active=False  # Operator accounts don't need JWT
            )
            db.session.add(new_user)
            print(f'✓ Created {username} - password: {password}')
            created_count += 1
        
        # Create Cutter accounts (Cutter1 to Cutter6)
        for i in range(1, 7):
            username = f'Cutter{i}'
            password = username  # Password matches username

            # Check if user already exists
            existing_user = Users.query.filter_by(username=username).first()
            if existing_user:
                print(f'✓ {username} already exists - skipping')
                skipped_count += 1
                continue

            # Create new cutter user
            new_user = Users(
                username=username,
                email=None,
                password=generate_password_hash(password),
                role='Cutter',
                jwt_auth_active=False  # Operator accounts don't need JWT
            )
            db.session.add(new_user)
            print(f'✓ Created {username} - password: {password}')
            created_count += 1
        
        # Commit all changes
        try:
            db.session.commit()
            print(f'\n✅ Migration completed successfully!')
            print(f'   Created: {created_count} users')
            print(f'   Skipped: {skipped_count} users (already exist)')
            print(f'\n   Note: Each operator account password matches its username')
            print(f'   (e.g., Spreader1 password is "Spreader1", Cutter2 password is "Cutter2")')
        except Exception as e:
            db.session.rollback()
            print(f'\n❌ Error committing changes: {e}')
            return False
        
        return True

if __name__ == '__main__':
    print('=' * 60)
    print('Creating Default Operator User Accounts')
    print('=' * 60)
    print()
    
    success = create_operator_users()
    
    if success:
        print('\n' + '=' * 60)
        print('Migration completed successfully!')
        print('=' * 60)
    else:
        print('\n' + '=' * 60)
        print('Migration failed!')
        print('=' * 60)
        sys.exit(1)

