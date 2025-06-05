-- Migration script to add marker_width column to marker_calculator_markers table
-- Run this SQL script against your database to add the width field

-- Check if the column already exists (this will fail if column doesn't exist, which is expected)
-- You can ignore the error if the column doesn't exist yet

-- Add the marker_width column to marker_calculator_markers table
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
