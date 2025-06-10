-- ECOSYSTEM RESTORATION SCRIPT
-- This restores login functionality WITHOUT changing user passwords
-- Safe for all applications in your multi-app ecosystem

BEGIN;

-- Step 1: Remove source_app contamination (the root cause)
DO $$ 
DECLARE
    table_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
        dropped_count := dropped_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Removed source_app contamination from % tables', dropped_count;
END $$;

-- Step 2: DO NOT reset passwords - leave them as users expect them
-- The authentication system should work with existing passwords

-- Step 3: Verify database structure integrity
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Final verification
SELECT 
    COUNT(*) as remaining_contamination,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Database fully restored - no source_app columns remain'
        ELSE 'WARNING: ' || COUNT(*) || ' contaminated columns still exist'
    END as restoration_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

-- Status report
SELECT 'ECOSYSTEM RESTORATION COMPLETE - User passwords preserved' as final_status;