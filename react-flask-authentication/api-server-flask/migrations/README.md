# Database Migrations

This folder contains database migration scripts for the cutting room management application.

## Available Migrations

### `create_operator_users.py`

Creates default operator user accounts for Spreader and Cutter workstations.

**What it does:**
- Creates 6 Spreader accounts: `Spreader1`, `Spreader2`, ..., `Spreader6`
- Creates 6 Cutter accounts: `Cutter1`, `Cutter2`, ..., `Cutter6`
- Sets email to `NULL` (operator accounts don't need email addresses)
- Sets password to match username (e.g., `Spreader1` password is `Spreader1`, `Cutter2` password is `Cutter2`)
- Assigns correct roles: `Spreader` or `Cutter`
- Sets `jwt_auth_active` to `FALSE` (operator accounts don't need JWT)

**When to run:**
- During initial application setup
- After database reset
- When setting up a new installation

**How to run:**

```bash
# Navigate to the Flask API directory
cd react-flask-authentication/api-server-flask

# Run the migration script
python migrations/create_operator_users.py
```

**Expected output:**

```
============================================================
Creating Default Operator User Accounts
============================================================

✓ Created Spreader1 - password: Spreader1
✓ Created Spreader2 - password: Spreader2
✓ Created Spreader3 - password: Spreader3
✓ Spreader4 already exists - skipping
✓ Spreader5 already exists - skipping
✓ Created Spreader6 - password: Spreader6
✓ Created Cutter1 - password: Cutter1
✓ Created Cutter2 - password: Cutter2
✓ Cutter3 already exists - skipping
✓ Created Cutter4 - password: Cutter4
✓ Created Cutter5 - password: Cutter5
✓ Created Cutter6 - password: Cutter6

✅ Migration completed successfully!
   Created: 9 users
   Skipped: 3 users (already exist)

   Note: Each operator account password matches its username
   (e.g., Spreader1 password is "Spreader1", Cutter2 password is "Cutter2")

============================================================
Migration completed successfully!
============================================================
```

**Notes:**
- The script is **idempotent** - it can be run multiple times safely
- Existing accounts are skipped (not overwritten)
- Operator accounts are **hidden** from the User Roles Management page
- These accounts are system accounts, not regular user accounts

## Creating New Migrations

When creating new migration scripts:

1. Create a new Python file in this directory
2. Import the app and database: `from api import create_app, db`
3. Use `app.app_context()` to access the database
4. Make the script idempotent (safe to run multiple times)
5. Add clear output messages showing what was done
6. Update this README with documentation

