-- EMERGENCY ROLLBACK: Remove source_app contamination from shared database
-- This reverses ALL database modifications that broke login functionality

-- Step 1: Drop source_app columns from all affected tables
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
        RAISE NOTICE 'Dropped source_app from table: %', table_record.table_name;
    END LOOP;
END $$;

-- Step 2: Verify complete removal
SELECT 
    COUNT(*) as remaining_source_app_columns,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ROLLBACK SUCCESSFUL - No source_app columns remain'
        ELSE 'ROLLBACK INCOMPLETE - ' || COUNT(*) || ' columns still exist'
    END as status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';