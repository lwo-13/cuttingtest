-- Fix order_comments table constraints
-- This script removes the old unique constraint and ensures the new one is in place

-- Step 1: Find and drop the existing unique constraint on order_commessa
DECLARE @ConstraintName NVARCHAR(200)
SELECT @ConstraintName = tc.CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
    ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'order_comments' 
AND tc.CONSTRAINT_TYPE = 'UNIQUE'
AND ccu.COLUMN_NAME = 'order_commessa'

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL NVARCHAR(MAX) = 'ALTER TABLE order_comments DROP CONSTRAINT [' + @ConstraintName + ']'
    EXEC sp_executesql @SQL
    PRINT 'Dropped constraint: ' + @ConstraintName
END
ELSE
BEGIN
    PRINT 'No old constraint found to drop'
END

-- Step 2: Add the new unique constraint if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'order_comments' 
    AND CONSTRAINT_NAME = 'uq_order_comments_combination'
)
BEGIN
    ALTER TABLE order_comments 
    ADD CONSTRAINT uq_order_comments_combination 
    UNIQUE (order_commessa, combination_id)
    PRINT 'Added new constraint: uq_order_comments_combination'
END
ELSE
BEGIN
    PRINT 'New constraint already exists'
END

-- Step 3: Show current constraints
PRINT 'Current unique constraints on order_comments:'
SELECT 
    tc.CONSTRAINT_NAME,
    STRING_AGG(ccu.COLUMN_NAME, ', ') as COLUMNS
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
    ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'order_comments' 
AND tc.CONSTRAINT_TYPE = 'UNIQUE'
GROUP BY tc.CONSTRAINT_NAME
