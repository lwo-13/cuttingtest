-- Migration script to add tab_number column for tab-specific calculator persistence
-- This script will:
-- 1. Add marker_width column if missing
-- 2. Add tab_number column
-- 3. Update existing records with default tab number
-- 4. Add unique constraint on order + tab_number
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

-- Step 3: Add tab_number column to marker_calculator_data if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND COLUMN_NAME = 'tab_number'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    ADD tab_number VARCHAR(10) NULL;
    PRINT 'Added tab_number column to marker_calculator_data table';
    
    -- Update existing records with default tab number '01'
    UPDATE marker_calculator_data 
    SET tab_number = '01' 
    WHERE tab_number IS NULL;
    
    -- Make the column NOT NULL after updating existing records
    ALTER TABLE marker_calculator_data 
    ALTER COLUMN tab_number VARCHAR(10) NOT NULL;
    PRINT 'Updated existing records with default tab_number 01';
END
ELSE
BEGIN
    PRINT 'tab_number column already exists';
END

-- Step 4: Add unique constraint for order + tab_number
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'marker_calculator_data' 
    AND CONSTRAINT_NAME = 'uq_calculator_order_tab'
)
BEGIN
    ALTER TABLE marker_calculator_data 
    ADD CONSTRAINT uq_calculator_order_tab 
    UNIQUE (order_commessa, tab_number);
    PRINT 'Added unique constraint for order + tab_number';
END

PRINT 'Migration completed successfully! Calculator now supports tab-specific persistence.';
