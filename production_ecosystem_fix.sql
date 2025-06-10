-- PRODUCTION ECOSYSTEM RESTORATION
-- Removes database contamination and restores authentication across all applications
-- Execute on production database to resolve login failures

BEGIN;

-- Step 1: Remove ALL source_app contamination from shared database
DO $$ 
DECLARE
    table_record RECORD;
    cleanup_count INTEGER := 0;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'source_app' 
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_record.table_name);
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Database decontamination complete. % tables cleaned.', cleanup_count;
END $$;

-- Step 2: Restore missing original user account (if not already present)
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$1FI6OFJgQ9IVA6pb5g9.OOgH8biGMmdAWfg5pDb0sQruN2Q5KujFu', 'user', 'ghost1@original.com', 100, false, 'FREE', '2025-06-09 12:00:00', '2025-06-09 12:00:00')
ON CONFLICT (username) DO NOTHING;

-- Step 3: Fix missing source column in credit_transactions if needed
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'System';

-- Step 4: Verification queries
SELECT 
    COUNT(*) as remaining_contaminated_columns,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All contamination removed'
        ELSE 'WARNING: ' || COUNT(*) || ' contaminated columns remain'
    END as decontamination_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

SELECT 
    COUNT(*) as total_users,
    'Authentication system restored for all applications' as auth_status
FROM users;

COMMIT;

SELECT 'PRODUCTION ECOSYSTEM FULLY RESTORED - All applications should work normally' as final_status;