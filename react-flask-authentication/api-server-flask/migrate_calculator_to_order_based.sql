-- Migration script to change marker calculator from table-based to order-based with material types
-- This script will:
-- 1. Add marker_width column if missing
-- 2. Add material_type column 
-- 3. Remove table_id column
-- 4. Update constraints
-- 5. Remove unique constraint on marker names

-- Step 1: Add marker_width column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_markers' 
    AND COLUMN_NAME = 'marker_width'
)
BEGIN
    ALTER TABLE marker_calculator_markers 
    ADD marker_width FLOAT NULL;
    PRINT 'Added marker_width column to marker_calculator_markers table';
END
ELSE
BEGIN
    PRINT 'marker_width column already exists';
END

-- Step 2: Remove unique constraint on marker names if it exists
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'marker_calculator_markers' 
    AND CONSTRAINT_NAME = 'uq_calculator_marker_name'
)
BEGIN
    ALTER TABLE marker_calculator_markers 
    DROP CONSTRAINT uq_calculator_marker_name;
    PRINT 'Removed unique constraint on marker names';
END

-- Step 3: Add material_type column to marker_calculator_data if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND COLUMN_NAME = 'material_type'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    ADD material_type VARCHAR(100) NULL;
    PRINT 'Added material_type column to marker_calculator_data table';
    
    -- Update existing records with default material type
    UPDATE marker_calculator_data 
    SET material_type = 'mattress' 
    WHERE material_type IS NULL;
    
    -- Make the column NOT NULL after updating existing records
    ALTER TABLE marker_calculator_data 
    ALTER COLUMN material_type VARCHAR(100) NOT NULL;
    PRINT 'Updated existing records with default material_type';
END
ELSE
BEGIN
    PRINT 'material_type column already exists';
END

-- Step 4: Drop old constraint if it exists
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND CONSTRAINT_NAME = 'uq_calculator_table_order'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    DROP CONSTRAINT uq_calculator_table_order;
    PRINT 'Dropped old table_id constraint';
END

-- Step 5: Add new constraint for order + material_type uniqueness
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND CONSTRAINT_NAME = 'uq_calculator_order_material'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    ADD CONSTRAINT uq_calculator_order_material 
    UNIQUE (order_commessa, material_type);
    PRINT 'Added new constraint for order + material_type uniqueness';
END

-- Step 6: Drop table_id column if it exists (after backing up data if needed)
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND COLUMN_NAME = 'table_id'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    DROP COLUMN table_id;
    PRINT 'Removed table_id column from marker_calculator_data';
END

PRINT 'Migration completed successfully! Calculator is now order-based with material types.';
