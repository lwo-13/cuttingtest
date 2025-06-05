-- Migration script to remove the unique constraint on marker names in marker_calculator_markers table
-- This allows duplicate marker names within the same calculator since it's just a helper tool

-- Check if the constraint exists and drop it
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
