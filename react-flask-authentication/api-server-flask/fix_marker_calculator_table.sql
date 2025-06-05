-- Fix marker_calculator_markers table by adding missing marker_width column
-- and removing the unique constraint on marker names

-- Step 1: Add marker_width column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'marker_calculator_markers' 
    AND COLUMN_NAME = 'marker_width'
)
BEGIN
    ALTER TABLE marker_calculator_markers 
    ADD marker_width FLOAT NULL;
    PRINT 'Successfully added marker_width column to marker_calculator_markers table';
END
ELSE
BEGIN
    PRINT 'marker_width column already exists in marker_calculator_markers table';
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
    PRINT 'Successfully removed unique constraint on marker names - duplicate names are now allowed';
END
ELSE
BEGIN
    PRINT 'Unique constraint uq_calculator_marker_name does not exist or already removed';
END

PRINT 'Migration completed successfully!';
