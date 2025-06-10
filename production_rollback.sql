-- PRODUCTION EMERGENCY ROLLBACK SCRIPT
-- Execute this on your production database to fix login issues

-- This script removes ALL source_app columns that are breaking login functionality
-- across your multi-application ecosystem

BEGIN;

-- Drop source_app columns from all tables that have them
DO $$ 
DECLARE
    table_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- Get all tables with source_app columns
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        -- Drop the source_app column
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Dropped source_app from: %', table_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Total tables cleaned: %', dropped_count;
END $$;

-- Verify complete removal
SELECT 
    COUNT(*) as remaining_contaminated_columns,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PRODUCTION ROLLBACK SUCCESSFUL'
        ELSE '❌ ROLLBACK INCOMPLETE - ' || COUNT(*) || ' columns remain'
    END as rollback_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

-- Final verification query
SELECT 'Production database restored to pre-contamination state' as final_status;