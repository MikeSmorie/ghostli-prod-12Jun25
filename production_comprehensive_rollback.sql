-- COMPREHENSIVE PRODUCTION ROLLBACK
-- Removes source_app contamination from all tables in your ecosystem
-- Execute on production database to restore all applications

BEGIN;

-- Drop source_app from all known contaminated tables
ALTER TABLE users DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS source_app;
ALTER TABLE credit_transactions DROP COLUMN IF EXISTS source_app;
ALTER TABLE vouchers DROP COLUMN IF EXISTS source_app;
ALTER TABLE voucher_redemptions DROP COLUMN IF EXISTS source_app;
ALTER TABLE referrals DROP COLUMN IF EXISTS source_app;
ALTER TABLE payments DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS source_app;
ALTER TABLE ai_responses DROP COLUMN IF EXISTS source_app;
ALTER TABLE cloned_content DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_writing_styles DROP COLUMN IF EXISTS source_app;
ALTER TABLE global_settings DROP COLUMN IF EXISTS source_app;
ALTER TABLE master_prompts DROP COLUMN IF EXISTS source_app;
ALTER TABLE prompt_execution_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE feature_flags DROP COLUMN IF EXISTS source_app;
ALTER TABLE system_features DROP COLUMN IF EXISTS source_app;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE error_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE messages DROP COLUMN IF EXISTS source_app;

-- Dynamic cleanup for any tables we might have missed
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
        RAISE NOTICE 'Cleaned table: %', table_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Dynamic cleanup completed. % additional tables processed.', cleanup_count;
END $$;

-- Ensure required columns exist for credit system
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'System';
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS tx_id TEXT;

-- Restore original user account if missing
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$1FI6OFJgQ9IVA6pb5g9.OOgH8biGMmdAWfg5pDb0sQruN2Q5KujFu', 'user', 'ghost1@original.com', 100, false, 'FREE', '2025-06-09 12:00:00', '2025-06-09 12:00:00')
ON CONFLICT (username) DO NOTHING;

-- Final verification
SELECT 
    COUNT(*) as remaining_contamination,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: Production ecosystem fully restored'
        ELSE 'WARNING: ' || COUNT(*) || ' contaminated columns remain'
    END as restoration_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

SELECT 'PRODUCTION ROLLBACK COMPLETE - All applications restored to working state' as final_status;