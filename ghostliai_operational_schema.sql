-- GhostliAI Operational Schema Export
-- Clean system-level data for new environment deployment
-- Excludes all user data, logs, and historical usage

-- Create tables with proper schema
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    interval TEXT NOT NULL,
    features TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER NOT NULL,
    trial_period_days INTEGER,
    metadata TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_upload_size_mb INTEGER,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    voucher_code VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50),
    value_type VARCHAR(50),
    value_amount VARCHAR(50),
    max_uses INTEGER,
    per_user_limit INTEGER,
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    tier_restriction VARCHAR(50),
    total_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS master_prompts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    content TEXT NOT NULL,
    summary TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_id INTEGER,
    version_label TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS ai_responses (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id INTEGER,
    content TEXT NOT NULL,
    ai_score NUMERIC,
    ai_feedback TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    balance NUMERIC DEFAULT 0,
    last_checked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS global_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    flag_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    target_audience TEXT,
    rollout_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS system_features (
    id SERIAL PRIMARY KEY,
    feature_name TEXT NOT NULL,
    feature_type TEXT,
    configuration TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dependencies TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS brand_memory (
    id SERIAL PRIMARY KEY,
    brand_element TEXT NOT NULL,
    element_type TEXT,
    content TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS brand_narrative (
    id SERIAL PRIMARY KEY,
    narrative_title TEXT NOT NULL,
    narrative_content TEXT NOT NULL,
    narrative_type TEXT,
    target_audience TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS change_log (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    change_type TEXT,
    description TEXT NOT NULL,
    impact_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

-- ====================
-- OPERATIONAL DATA EXPORT
-- ====================

-- Subscription Plans Data (Clean system configurations)
INSERT INTO subscription_plans (id, name, description, price, interval, features, is_active, created_at, position, trial_period_days, metadata, updated_at, max_upload_size_mb, source_app) VALUES (4, 'Lite', 'Free access to basic content generation features', 0.00, 'monthly', '["content_generation_basic","writing_brief_lite","export_basic"]', true, '2025-05-13 20:41:35.443021', 1, 0, '{"tierLevel":"free"}', NULL, 10, 'GhostliAI');
INSERT INTO subscription_plans (id, name, description, price, interval, features, is_active, created_at, position, trial_period_days, metadata, updated_at, max_upload_size_mb, source_app) VALUES (5, 'Pro', 'Full access to all advanced features including Clone Me, humanization settings, and more', 29.99, 'monthly', '["content_generation_basic","content_generation_premium","writing_brief_lite","writing_brief_pro","clone_me","humanization_settings","vocabulary_control","plagiarism_detection","seo_optimization","multilple_export_formats","export_basic"]', true, '2025-05-13 20:41:35.443021', 2, 7, '{"tierLevel":"premium"}', NULL, 10, 'GhostliAI');

-- Voucher Templates (Structure only, no redemption history)
INSERT INTO vouchers (voucher_code, type, value_type, value_amount, max_uses, per_user_limit, expiry_date, is_active, tier_restriction, source_app) VALUES ('WELCOME50', 'credit', 'fixed', '50', 100, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI');
INSERT INTO vouchers (voucher_code, type, value_type, value_amount, max_uses, per_user_limit, expiry_date, is_active, tier_restriction, source_app) VALUES ('PREMIUM100', 'credit', 'fixed', '100', 50, 1, '2025-12-31 23:59:59', true, 'PRO', 'GhostliAI');
INSERT INTO vouchers (voucher_code, type, value_type, value_amount, max_uses, per_user_limit, expiry_date, is_active, tier_restriction, source_app) VALUES ('BOOST25', 'credit', 'fixed', '25', 200, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI');
INSERT INTO vouchers (voucher_code, type, value_type, value_amount, max_uses, per_user_limit, expiry_date, is_active, tier_restriction, source_app) VALUES ('UNLIMITED30', 'subscription', 'days', '30', 20, 1, '2025-12-31 23:59:59', true, NULL, 'GhostliAI');

-- Global Settings (System configuration)
INSERT INTO global_settings (setting_key, setting_value, description, created_at, updated_at, source_app) VALUES ('default_first_time_credits', '100', 'Default credits given to new users upon registration', '2025-06-03 18:18:58.623154', '2025-06-03 18:18:58.623154', 'GhostliAI');

-- System Feature Flags (Essential for deployment)
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, created_at, updated_at, source_app) VALUES ('ai_detection_shield', true, 'AI detection and humanization features', 'all', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'GhostliAI');
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, created_at, updated_at, source_app) VALUES ('clone_me_system', true, 'Clone Me writing style replication', 'premium', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'GhostliAI');
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, created_at, updated_at, source_app) VALUES ('voucher_system', true, 'Voucher and referral system', 'all', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'GhostliAI');
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, created_at, updated_at, source_app) VALUES ('crypto_payments', true, 'Cryptocurrency payment support', 'all', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'GhostliAI');
INSERT INTO feature_flags (flag_name, is_enabled, description, target_audience, rollout_percentage, created_at, updated_at, source_app) VALUES ('paypal_integration', true, 'PayPal payment gateway', 'all', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'GhostliAI');

-- System Features (Core functionality)
INSERT INTO system_features (feature_name, feature_type, configuration, is_active, created_at, updated_at, dependencies, source_app) VALUES ('content_generation', 'ai_service', '{"model": "gpt-4o", "max_tokens": 4000, "temperature": 0.7}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'openai_api', 'GhostliAI');
INSERT INTO system_features (feature_name, feature_type, configuration, is_active, created_at, updated_at, dependencies, source_app) VALUES ('ai_detection', 'analysis_service', '{"providers": ["copyleaks", "originality"], "threshold": 0.75}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'detection_apis', 'GhostliAI');
INSERT INTO system_features (feature_name, feature_type, configuration, is_active, created_at, updated_at, dependencies, source_app) VALUES ('payment_processing', 'financial_service', '{"paypal_enabled": true, "crypto_enabled": true}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'paypal_api,crypto_wallets', 'GhostliAI');
INSERT INTO system_features (feature_name, feature_type, configuration, is_active, created_at, updated_at, dependencies, source_app) VALUES ('credit_management', 'core_service', '{"default_credits": 100, "free_tier_limit": 1000}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'subscription_plans', 'GhostliAI');

-- ====================
-- DEPLOYMENT NOTES
-- ====================
-- 1. This schema is compatible with PostgreSQL 15+ and Render deployment
-- 2. All tables use source_app = 'GhostliAI' for multi-tenant isolation
-- 3. No foreign key dependencies on user data - clean boot guaranteed
-- 4. Includes essential operational data for immediate functionality
-- 5. Voucher system ready with 4 promotional codes
-- 6. Subscription plans configured for Lite (free) and Pro tiers
-- 7. System features and flags configured for full functionality
