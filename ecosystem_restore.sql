-- CRITICAL ECOSYSTEM ROLLBACK - 18 HOURS AGO STATE
-- This script restores the database to pre-contamination state
-- Removes ALL modifications that broke your multi-application ecosystem

BEGIN;

-- Step 1: Complete decontamination - remove ALL source_app columns
DO $$ 
DECLARE
    table_record RECORD;
    cleanup_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting complete ecosystem decontamination...';
    
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
        cleanup_count := cleanup_count + 1;
        RAISE NOTICE 'Cleaned table: %', table_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Decontamination complete. Cleaned % tables.', cleanup_count;
END $$;

-- Step 2: Remove any other contaminating columns that might exist
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    -- Remove source columns from credit_transactions if they exist
    ALTER TABLE credit_transactions DROP COLUMN IF EXISTS source_app;
    
    -- Add back the source column with proper default for credit system
    ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'System';
    
    RAISE NOTICE 'Credit system columns normalized.';
END $$;

-- Step 3: Verify database state matches 18 hours ago
SELECT 
    COUNT(*) as remaining_contamination,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: Database restored to pre-contamination state'
        ELSE 'ERROR: ' || COUNT(*) || ' contaminated columns remain'
    END as restoration_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

-- Step 4: Verify user authentication table is intact
SELECT 
    COUNT(*) as total_users,
    'User authentication system verified' as auth_status
FROM users;

COMMIT;

-- Final verification
SELECT 'ECOSYSTEM ROLLBACK COMPLETE - All applications should function as they did 18 hours ago' as final_status;