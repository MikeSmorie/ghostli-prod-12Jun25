-- GhostliAI Schema Validation Script
-- Run this to validate the exported schema integrity

-- Check table creation and constraints
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'subscription_plans',
    'vouchers', 
    'master_prompts',
    'ai_responses',
    'crypto_wallets',
    'global_settings',
    'feature_flags',
    'system_features',
    'brand_memory',
    'brand_narrative',
    'change_log',
    'error_logs'
)
ORDER BY tablename;

-- Validate source_app tagging
SELECT 
    'subscription_plans' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN source_app = 'GhostliAI' THEN 1 END) as ghostliai_records
FROM subscription_plans
UNION ALL
SELECT 
    'vouchers',
    COUNT(*),
    COUNT(CASE WHEN source_app = 'GhostliAI' THEN 1 END)
FROM vouchers
UNION ALL
SELECT 
    'global_settings',
    COUNT(*),
    COUNT(CASE WHEN source_app = 'GhostliAI' THEN 1 END)
FROM global_settings
UNION ALL
SELECT 
    'feature_flags',
    COUNT(*),
    COUNT(CASE WHEN source_app = 'GhostliAI' THEN 1 END)
FROM feature_flags
UNION ALL
SELECT 
    'system_features',
    COUNT(*),
    COUNT(CASE WHEN source_app = 'GhostliAI' THEN 1 END)
FROM system_features;

-- Check essential data presence
SELECT 'Subscription Plans Check' as validation_type, 
       CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM subscription_plans WHERE source_app = 'GhostliAI'
UNION ALL
SELECT 'Vouchers Check', 
       CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END
FROM vouchers WHERE source_app = 'GhostliAI'
UNION ALL
SELECT 'Global Settings Check', 
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END
FROM global_settings WHERE source_app = 'GhostliAI'
UNION ALL
SELECT 'Feature Flags Check', 
       CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END
FROM feature_flags WHERE source_app = 'GhostliAI'
UNION ALL
SELECT 'System Features Check', 
       CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END
FROM system_features WHERE source_app = 'GhostliAI';