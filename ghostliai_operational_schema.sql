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
    code TEXT UNIQUE NOT NULL,
    discount_amount NUMERIC,
    discount_percentage INTEGER,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS master_prompts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    prompt_text TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS ai_responses (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER,
    response_text TEXT NOT NULL,
    model_used TEXT,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_score NUMERIC,
    is_system_owned BOOLEAN DEFAULT false,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS crypto_wallets (
    id SERIAL PRIMARY KEY,
    currency TEXT NOT NULL,
    wallet_address TEXT,
    network TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configuration TEXT,
    source_app TEXT DEFAULT 'GhostliAI'
);

CREATE TABLE IF NOT EXISTS global_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
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
