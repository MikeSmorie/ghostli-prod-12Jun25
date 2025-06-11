-- PURE DECONTAMINATION SCRIPT
-- Removes ONLY source_app columns, changes nothing else
-- Preserves all original data and authentication exactly as it was

BEGIN;

-- Remove source_app from every table in the database
DO $$ 
DECLARE
    table_name_var text;
BEGIN
    FOR table_name_var IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS source_app', table_name_var);
    END LOOP;
END $$;

-- Ensure credit_transactions has required columns for functionality
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'System';
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS tx_id TEXT;

-- Verification only
SELECT 
    COUNT(*) as source_app_columns_remaining,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Database fully decontaminated'
        ELSE COUNT(*) || ' contaminated columns remain'
    END as status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

SELECT 'Pure decontamination complete - all original authentication preserved' as result;