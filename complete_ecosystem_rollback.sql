-- COMPLETE ECOSYSTEM ROLLBACK - ALL 100+ TABLES
-- Removes source_app contamination from entire shared database
-- Execute this on production to stop the phone calls

BEGIN;

-- Drop source_app from ALL known tables in the ecosystem
ALTER TABLE action_plans DROP COLUMN IF EXISTS source_app;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE ai_protocol_triggers DROP COLUMN IF EXISTS source_app;
ALTER TABLE ai_responses DROP COLUMN IF EXISTS source_app;
ALTER TABLE allocations DROP COLUMN IF EXISTS source_app;
ALTER TABLE api_key_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE assets DROP COLUMN IF EXISTS source_app;
ALTER TABLE assets_best_practices DROP COLUMN IF EXISTS source_app;
ALTER TABLE beneficiaries DROP COLUMN IF EXISTS source_app;
ALTER TABLE brand_memory DROP COLUMN IF EXISTS source_app;
ALTER TABLE brand_narrative DROP COLUMN IF EXISTS source_app;
ALTER TABLE business_profiles DROP COLUMN IF EXISTS source_app;
ALTER TABLE campaign_interviews DROP COLUMN IF EXISTS source_app;
ALTER TABLE campaign_time_metrics DROP COLUMN IF EXISTS source_app;
ALTER TABLE campaigns DROP COLUMN IF EXISTS source_app;
ALTER TABLE change_log DROP COLUMN IF EXISTS source_app;
ALTER TABLE channel_benchmarks DROP COLUMN IF EXISTS source_app;
ALTER TABLE clarity_task_comments DROP COLUMN IF EXISTS source_app;
ALTER TABLE clarity_tasks DROP COLUMN IF EXISTS source_app;
ALTER TABLE client_form_branding DROP COLUMN IF EXISTS source_app;
ALTER TABLE client_form_questions DROP COLUMN IF EXISTS source_app;
ALTER TABLE client_form_templates DROP COLUMN IF EXISTS source_app;
ALTER TABLE client_forms DROP COLUMN IF EXISTS source_app;
ALTER TABLE client_payment_gateways DROP COLUMN IF EXISTS source_app;
ALTER TABLE clocking_completions DROP COLUMN IF EXISTS source_app;
ALTER TABLE clocking_schedules DROP COLUMN IF EXISTS source_app;
ALTER TABLE company_archive_items DROP COLUMN IF EXISTS source_app;
ALTER TABLE credit_transactions DROP COLUMN IF EXISTS source_app;
ALTER TABLE crypto_exchange_rates DROP COLUMN IF EXISTS source_app;
ALTER TABLE crypto_transactions DROP COLUMN IF EXISTS source_app;
ALTER TABLE crypto_wallets DROP COLUMN IF EXISTS source_app;
ALTER TABLE daily_check_ins DROP COLUMN IF EXISTS source_app;
ALTER TABLE departments DROP COLUMN IF EXISTS source_app;
ALTER TABLE dispute_resolution_summary DROP COLUMN IF EXISTS source_app;
ALTER TABLE dispute_rooms DROP COLUMN IF EXISTS source_app;
ALTER TABLE error_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE executors DROP COLUMN IF EXISTS source_app;
ALTER TABLE feature_flags DROP COLUMN IF EXISTS source_app;
ALTER TABLE features DROP COLUMN IF EXISTS source_app;
ALTER TABLE founder_intelligence DROP COLUMN IF EXISTS source_app;
ALTER TABLE founder_intelligence_meta DROP COLUMN IF EXISTS source_app;
ALTER TABLE global_settings DROP COLUMN IF EXISTS source_app;
ALTER TABLE initiatives DROP COLUMN IF EXISTS source_app;
ALTER TABLE interdepartment_requests DROP COLUMN IF EXISTS source_app;
ALTER TABLE jurisdiction_profiles DROP COLUMN IF EXISTS source_app;
ALTER TABLE jurisdictions DROP COLUMN IF EXISTS source_app;
ALTER TABLE jurisdictions_data DROP COLUMN IF EXISTS source_app;
ALTER TABLE keyword_search_results DROP COLUMN IF EXISTS source_app;
ALTER TABLE keyword_tracking DROP COLUMN IF EXISTS source_app;
ALTER TABLE life_coach_users DROP COLUMN IF EXISTS source_app;
ALTER TABLE master_prompts DROP COLUMN IF EXISTS source_app;
ALTER TABLE messages DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_10_downloadables DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_1_vision DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_2_values DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_3_actionplans DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_4_obstacles DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_5_milestones DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_6_feedback DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_7_goals DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_8_metrics DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_9_reflections DROP COLUMN IF EXISTS source_app;
ALTER TABLE module_progress DROP COLUMN IF EXISTS source_app;
ALTER TABLE news_items DROP COLUMN IF EXISTS source_app;
ALTER TABLE news_results DROP COLUMN IF EXISTS source_app;
ALTER TABLE news_sources DROP COLUMN IF EXISTS source_app;
ALTER TABLE newsjack_channels DROP COLUMN IF EXISTS source_app;
ALTER TABLE newsjack_outputs DROP COLUMN IF EXISTS source_app;
ALTER TABLE omniprompt_conversations DROP COLUMN IF EXISTS source_app;
ALTER TABLE payments DROP COLUMN IF EXISTS source_app;
ALTER TABLE performance_graphs DROP COLUMN IF EXISTS source_app;
ALTER TABLE plan_features DROP COLUMN IF EXISTS source_app;
ALTER TABLE private_journal DROP COLUMN IF EXISTS source_app;
ALTER TABLE prompt_context_sources DROP COLUMN IF EXISTS source_app;
ALTER TABLE prompt_execution_logs DROP COLUMN IF EXISTS source_app;
ALTER TABLE prompt_templates DROP COLUMN IF EXISTS source_app;
ALTER TABLE questionnaire_responses DROP COLUMN IF EXISTS source_app;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS source_app;
ALTER TABLE reconciliation_metrics DROP COLUMN IF EXISTS source_app;
ALTER TABLE reconciliation_reports DROP COLUMN IF EXISTS source_app;
ALTER TABLE reminders DROP COLUMN IF EXISTS source_app;
ALTER TABLE room_participants DROP COLUMN IF EXISTS source_app;
ALTER TABLE silo_students DROP COLUMN IF EXISTS source_app;
ALTER TABLE silos DROP COLUMN IF EXISTS source_app;
ALTER TABLE sops DROP COLUMN IF EXISTS source_app;
ALTER TABLE strategy_131_sessions DROP COLUMN IF EXISTS source_app;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS source_app;
ALTER TABLE system_features DROP COLUMN IF EXISTS source_app;
ALTER TABLE task_submissions DROP COLUMN IF EXISTS source_app;
ALTER TABLE tasks DROP COLUMN IF EXISTS source_app;
ALTER TABLE token_purchases DROP COLUMN IF EXISTS source_app;
ALTER TABLE topic_trends DROP COLUMN IF EXISTS source_app;
ALTER TABLE triage_items DROP COLUMN IF EXISTS source_app;
ALTER TABLE trusts DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_essays DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_favorites DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_messages DROP COLUMN IF EXISTS source_app;
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS source_app;
ALTER TABLE users DROP COLUMN IF EXISTS source_app;
ALTER TABLE voice_transcripts DROP COLUMN IF EXISTS source_app;
ALTER TABLE voucher_redemptions DROP COLUMN IF EXISTS source_app;
ALTER TABLE vouchers DROP COLUMN IF EXISTS source_app;
ALTER TABLE wills DROP COLUMN IF EXISTS source_app;
ALTER TABLE youtube_api_keys DROP COLUMN IF EXISTS source_app;
ALTER TABLE youtube_pulse DROP COLUMN IF EXISTS source_app;

-- Additional dynamic cleanup for any new tables
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
        RAISE NOTICE 'Emergency cleanup: %', table_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Emergency cleanup processed % additional tables.', cleanup_count;
END $$;

-- Fix credit system requirements
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'System';
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS tx_id TEXT;

-- Restore original account access
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$1FI6OFJgQ9IVA6pb5g9.OOgH8biGMmdAWfg5pDb0sQruN2Q5KujFu', 'user', 'ghost1@original.com', 100, false, 'FREE', '2025-06-09 12:00:00', '2025-06-09 12:00:00')
ON CONFLICT (username) DO NOTHING;

-- Final ecosystem verification
SELECT 
    COUNT(*) as remaining_contamination,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: Complete ecosystem decontamination achieved'
        ELSE 'CRITICAL: ' || COUNT(*) || ' contaminated columns still exist'
    END as ecosystem_status
FROM information_schema.columns 
WHERE column_name = 'source_app' 
AND table_schema = 'public';

COMMIT;

SELECT 'COMPLETE ECOSYSTEM ROLLBACK FINISHED - All 100+ applications should now function normally' as final_result;