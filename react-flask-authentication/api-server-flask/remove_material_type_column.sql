-- Migration script to remove material_type column and make calculator order-based only
-- This script will:
-- 1. Add marker_width column if missing
-- 2. Remove unique constraint on order + material_type
-- 3. Remove material_type column
-- 4. Remove unique constraint on marker names

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

-- Step 3: Drop constraint on order + material_type if it exists
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND CONSTRAINT_NAME = 'uq_calculator_order_material'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    DROP CONSTRAINT uq_calculator_order_material;
    PRINT 'Dropped order + material_type constraint';
END

-- Step 4: Remove material_type column if it exists
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND COLUMN_NAME = 'material_type'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    DROP COLUMN material_type;
    PRINT 'Removed material_type column from marker_calculator_data';
END

PRINT 'Migration completed successfully! Calculator is now order-based only with dummy tabs.';
