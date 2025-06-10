-- ==============================================
-- GhostliAI Operational Schema - Cloud Deployment Package
-- PostgreSQL 15+ Compatible | Render/Railway Ready
-- ==============================================

-- Set proper session variables for deployment
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;

-- Create schema structure first (no foreign key dependencies)
-- ==============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    interval TEXT NOT NULL DEFAULT 'monthly',
    features TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 1,
    trial_period_days INTEGER DEFAULT 0,
    metadata TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    max_upload_size_mb INTEGER DEFAULT 10,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    voucher_code VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'credit',
    value_type VARCHAR(50) DEFAULT 'fixed',
    value_amount VARCHAR(50),
    max_uses INTEGER DEFAULT 100,
    per_user_limit INTEGER DEFAULT 1,
    expiry_date TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    tier_restriction VARCHAR(50),
    total_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER,
    user_id INTEGER,
    redeemed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    credits_awarded INTEGER DEFAULT 0,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS global_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    flag_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    target_audience TEXT DEFAULT 'all',
    rollout_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS system_features (
    id SERIAL PRIMARY KEY,
    feature_name TEXT NOT NULL,
    feature_type TEXT DEFAULT 'core_service',
    configuration TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dependencies TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS master_prompts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    content TEXT NOT NULL,
    summary TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    company_id INTEGER,
    version_label TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS ai_responses (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id INTEGER,
    content TEXT NOT NULL,
    ai_score NUMERIC(5,2),
    ai_feedback TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    question_text TEXT,
    question_index INTEGER,
    numeric_score INTEGER,
    optional_comment TEXT,
    ai_sentiment TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS crypto_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    crypto_type TEXT NOT NULL,
    wallet_address TEXT,
    private_key TEXT,
    public_key TEXT,
    seed_phrase TEXT,
    is_active BOOLEAN DEFAULT true,
    balance NUMERIC(20,8) DEFAULT 0,
    last_checked TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS brand_memory (
    id SERIAL PRIMARY KEY,
    brand_element TEXT NOT NULL,
    element_type TEXT DEFAULT 'guideline',
    content TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS brand_narrative (
    id SERIAL PRIMARY KEY,
    narrative_title TEXT NOT NULL,
    narrative_content TEXT NOT NULL,
    narrative_type TEXT DEFAULT 'brand_voice',
    target_audience TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS change_log (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    change_type TEXT DEFAULT 'feature',
    description TEXT NOT NULL,
    impact_level TEXT DEFAULT 'low',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    is_published BOOLEAN DEFAULT false,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    severity TEXT DEFAULT 'medium',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    resolution_notes TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_source_app ON subscription_plans(source_app);
CREATE INDEX IF NOT EXISTS idx_vouchers_source_app ON vouchers(source_app);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_system_features_name ON system_features(feature_name);

-- ==============================================
-- OPERATIONAL DATA INSERTION
-- ==============================================

-- Core subscription plans
INSERT INTO subscription_plans (name, description, price, interval, features, is_active, position, trial_period_days, metadata, max_upload_size_mb, source_app) VALUES 
('Lite', 'Free access to basic content generation features', 0.00, 'monthly', '["content_generation_basic","writing_brief_lite","export_basic"]', true, 1, 0, '{"tierLevel":"free"}', 10, 'GhostliAI'),
('Pro', 'Full access to all advanced features including Clone Me, humanization settings, and more', 29.99, 'monthly', '["content_generation_basic","content_generation_premium","writing_brief_lite","writing_brief_pro","clone_me","humanization_settings","vocabulary_control","plagiarism_detection","seo_optimization","multilple_export_formats","export_basic"]', true, 2, 7, '{"tierLevel":"premium"}', 50, 'GhostliAI'),
('Pro Annual', 'Full access to advanced features (yearly subscription)', 299.99, 'yearly', '["content_generation_basic","content_generation_premium","writing_brief_lite","writing_brief_pro","clone_me","humanization_settings","vocabulary_control","plagiarism_detection","seo_optimization","multilple_export_formats","export_basic"]', true, 3, 7, '{"tierLevel":"premium","discount":"40%"}', 100, 'GhostliAI');

-- Promotional vouchers (clean templates, no usage history)
INSERT INTO vouchers (voucher_code, type, value_type, value_amount, max_uses, per_user_limit, expiry_date, is_active, tier_restriction, source_app) VALUES 
('WELCOME50', 'credit', 'fixed', '50', 100, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI'),
('PREMIUM100', 'credit', 'fixed', '100', 50, 1, '2025-12-31 23:59:59', true, 'PRO', 'GhostliAI'),
('BOOST25', 'credit', 'fixed', '25', 200, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI'),
('UNLIMITED30', 'subscription', 'days', '30', 20, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI'),
('LAUNCH2025', 'credit', 'fixed', '200', 500, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI');

-- Essential global settings
INSERT INTO global_settings (setting_key, setting_value, description, source_app) VALUES 
('default_first_time_credits', '100', 'Default credits given to new users upon registration', 'GhostliAI'),
('max_content_length', '5000', 'Maximum content length per generation request', 'GhostliAI'),
('ai_model_primary', 'gpt-4o', 'Primary AI model for content generation', 'GhostliAI'),
('credit_cost_per_generation', '10', 'Credits consumed per content generation', 'GhostliAI'),
('credit_cost_per_detection', '5', 'Credits consumed per AI detection scan', 'GhostliAI');

-- Core feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, source_app) VALUES 
('ai_detection_shield', true, 'AI detection and humanization features', 'all', 100, 'GhostliAI'),
('clone_me_system', true, 'Clone Me writing style replication', 'premium', 100, 'GhostliAI'),
('voucher_system', true, 'Voucher and referral system', 'all', 100, 'GhostliAI'),
('crypto_payments', true, 'Cryptocurrency payment support', 'all', 100, 'GhostliAI'),
('paypal_integration', true, 'PayPal payment gateway', 'all', 100, 'GhostliAI'),
('content_export', true, 'Content export functionality', 'all', 100, 'GhostliAI'),
('writing_analytics', true, 'Writing style analytics and insights', 'premium', 100, 'GhostliAI');

-- System features configuration
INSERT INTO system_features (feature_name, feature_type, configuration, is_active, dependencies, source_app) VALUES 
('content_generation', 'ai_service', '{"model": "gpt-4o", "max_tokens": 4000, "temperature": 0.7, "presence_penalty": 0.1}', true, 'openai_api', 'GhostliAI'),
('ai_detection', 'analysis_service', '{"providers": ["copyleaks", "originality"], "threshold": 0.75, "retry_attempts": 3}', true, 'detection_apis', 'GhostliAI'),
('payment_processing', 'financial_service', '{"paypal_enabled": true, "crypto_enabled": true, "supported_currencies": ["BTC", "ETH", "USDT"]}', true, 'paypal_api,crypto_wallets', 'GhostliAI'),
('credit_management', 'core_service', '{"default_credits": 100, "free_tier_limit": 1000, "premium_tier_limit": 10000}', true, 'subscription_plans', 'GhostliAI'),
('content_humanization', 'ai_service', '{"models": ["claude-3", "gpt-4"], "techniques": ["paraphrasing", "vocabulary_variation", "structure_modification"]}', true, 'ai_detection', 'GhostliAI');

-- ==============================================
-- POST-DEPLOYMENT VALIDATION
-- ==============================================

-- Verify essential data presence
DO $$
DECLARE
    plans_count INTEGER;
    vouchers_count INTEGER;
    settings_count INTEGER;
    flags_count INTEGER;
    features_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plans_count FROM subscription_plans WHERE source_app = 'GhostliAI';
    SELECT COUNT(*) INTO vouchers_count FROM vouchers WHERE source_app = 'GhostliAI';
    SELECT COUNT(*) INTO settings_count FROM global_settings WHERE source_app = 'GhostliAI';
    SELECT COUNT(*) INTO flags_count FROM feature_flags WHERE source_app = 'GhostliAI';
    SELECT COUNT(*) INTO features_count FROM system_features WHERE source_app = 'GhostliAI';
    
    RAISE NOTICE 'Deployment Validation Results:';
    RAISE NOTICE 'Subscription Plans: % records', plans_count;
    RAISE NOTICE 'Vouchers: % records', vouchers_count;
    RAISE NOTICE 'Global Settings: % records', settings_count;
    RAISE NOTICE 'Feature Flags: % records', flags_count;
    RAISE NOTICE 'System Features: % records', features_count;
    
    IF plans_count >= 3 AND vouchers_count >= 5 AND settings_count >= 5 AND flags_count >= 7 AND features_count >= 5 THEN
        RAISE NOTICE 'Schema deployment: SUCCESS - All essential data present';
    ELSE
        RAISE EXCEPTION 'Schema deployment: FAILED - Missing essential data';
    END IF;
END $$;

-- ==============================================
-- DEPLOYMENT COMPLETE
-- ==============================================
-- Schema ready for production deployment
-- Compatible with: PostgreSQL 15+, Render, Railway, Heroku
-- Multi-tenant isolation: source_app = 'GhostliAI'
-- No user dependencies: Clean boot guaranteed
-- Essential features: Subscription management, voucher system, payment processing