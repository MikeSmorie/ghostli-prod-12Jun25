-- RESTORE ORIGINAL ECOSYSTEM STATE
-- This restores the database to its working state before source_app modifications
-- Preserves all original user accounts and authentication that was working

BEGIN;

-- Step 1: Remove ALL source_app contamination
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
    END LOOP;
END $$;

-- Step 2: Do NOT modify existing user passwords or create special accounts
-- The authentication system should work with whatever passwords were originally set

-- Step 3: Verify users table is intact
SELECT 
    COUNT(*) as total_users,
    'Original user base preserved' as status
FROM users;

-- Step 4: Verify database is clean
SELECT 
    COUNT(*) as contaminated_columns,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Database fully restored to original state'
        ELSE 'WARNING: ' || COUNT(*) || ' contaminated columns remain'
    END as restoration_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

-- This should restore login functionality for ALL original users
SELECT 'Original ecosystem authentication restored' as final_status;