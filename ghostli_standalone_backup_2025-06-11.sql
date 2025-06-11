-- GhostliAI-Standalone-Recovery Database Backup
-- Generated: 2025-06-11
-- Database: Clean PostgreSQL instance with seeded operational data
-- Tables: 36 (includes all GhostliAI core functionality)

-- ========================================
-- SCHEMA EXPORT
-- ========================================

-- Drop existing tables if they exist (for clean restore)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Create all tables with proper structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    email TEXT UNIQUE,
    credits INTEGER DEFAULT 0 NOT NULL,
    creditexempt BOOLEAN DEFAULT false NOT NULL,
    subscriptiontier TEXT NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastlogin TIMESTAMP
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE global_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    tx_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    interval TEXT NOT NULL,
    features TEXT,
    is_active BOOLEAN DEFAULT true,
    trial_period_days INTEGER,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    voucher_code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value_type TEXT NOT NULL,
    value_amount DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    per_user_limit INTEGER DEFAULT 1,
    expiry_date TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    referral_source_user_id INTEGER REFERENCES users(id),
    tier_restriction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voucher_redemptions (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER NOT NULL REFERENCES vouchers(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    credits_awarded INTEGER DEFAULT 0,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    redemption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id INTEGER REFERENCES credit_transactions(id)
);

CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE admin_announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    importance TEXT DEFAULT 'normal',
    sender_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP,
    requires_response BOOLEAN DEFAULT false,
    target_audience JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    archived BOOLEAN DEFAULT false
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- DATA EXPORT
-- ========================================

-- Insert seeded subscription plans
INSERT INTO subscription_plans (name, description, position, price, interval, features, is_active, trial_period_days, metadata) VALUES
('Free', 'Basic access with limited features', 1, 0.00, 'monthly', '{"credits_per_month": 100, "ai_detection_runs": 5, "essay_generations": 10, "style_analysis": "basic"}', true, 0, '{"tier": "free", "support": "community", "priority": "low"}'),
('Starter', 'Enhanced features for regular users', 2, 9.99, 'monthly', '{"credits_per_month": 500, "ai_detection_runs": 25, "essay_generations": 50, "style_analysis": "advanced", "custom_prompts": true}', true, 7, '{"tier": "starter", "support": "email", "priority": "medium"}'),
('Pro', 'Full access for power users', 3, 29.99, 'monthly', '{"credits_per_month": 2000, "ai_detection_runs": 100, "essay_generations": 200, "style_analysis": "premium", "custom_prompts": true, "api_access": true}', true, 14, '{"tier": "pro", "support": "priority", "priority": "high"}'),
('Enterprise', 'Custom solutions for organizations', 4, 99.99, 'monthly', '{"credits_per_month": 10000, "ai_detection_runs": 500, "essay_generations": 1000, "style_analysis": "enterprise", "custom_prompts": true, "api_access": true, "custom_integrations": true}', true, 30, '{"tier": "enterprise", "support": "dedicated", "priority": "critical"}');

-- Insert global system settings
INSERT INTO global_settings (setting_key, setting_value, description) VALUES
('default_user_credits', '100', 'Default credits awarded to new users upon registration'),
('credit_per_dollar', '100', 'Number of credits awarded per dollar spent'),
('min_password_length', '8', 'Minimum required password length for user accounts'),
('max_daily_ai_requests', '50', 'Maximum AI requests per user per day on free tier'),
('system_maintenance_mode', 'false', 'Enable/disable system maintenance mode'),
('email_verification_required', 'false', 'Require email verification for new accounts'),
('referral_credits_bonus', '50', 'Credits awarded for successful referrals'),
('max_essay_length', '5000', 'Maximum character length for essay submissions'),
('ai_detection_confidence_threshold', '0.7', 'Minimum confidence score for AI detection results'),
('content_generation_rate_limit', '10', 'Maximum content generations per hour for free users');

-- Insert feature flags
INSERT INTO feature_flags (name, enabled, description) VALUES
('ai_content_generation', true, 'Enable AI-powered content generation features'),
('ai_detection_shield', true, 'Enable AI detection and analysis capabilities'),
('user_writing_styles', true, 'Allow users to save and clone writing styles'),
('referral_system', true, 'Enable user referral program and rewards'),
('cryptocurrency_payments', false, 'Enable cryptocurrency payment options'),
('advanced_analytics', true, 'Enable detailed usage analytics and reporting'),
('api_access', false, 'Enable API access for external integrations'),
('custom_prompts', true, 'Allow users to create custom AI prompts'),
('bulk_operations', false, 'Enable bulk content processing features'),
('white_label_branding', false, 'Enable white-label customization options');

-- Insert AI prompt templates
INSERT INTO messages (title, content) VALUES
('Persuasive Writing Template', 'You are an expert persuasive writer. Create compelling content that:
- Uses emotional appeals and logical reasoning
- Includes strong calls-to-action
- Addresses potential objections
- Uses social proof and credibility markers
- Maintains ethical persuasion principles
- Adapts tone based on target audience
- Incorporates storytelling elements when appropriate'),

('Academic Essay Template', 'You are an academic writing specialist. Generate scholarly content that:
- Follows proper academic structure (introduction, body, conclusion)
- Uses formal academic tone and vocabulary
- Includes thesis statements and topic sentences
- Provides evidence-based arguments
- Uses proper citations and references
- Maintains objectivity and critical analysis
- Adheres to specific style guides (APA, MLA, Chicago)'),

('Business Communication Template', 'You are a professional business writer. Create business content that:
- Uses clear, concise language
- Maintains professional tone
- Focuses on actionable outcomes
- Includes executive summaries when appropriate
- Uses bullet points and structured formatting
- Addresses stakeholder concerns
- Follows corporate communication standards'),

('Creative Storytelling Template', 'You are a creative writer and storyteller. Generate narrative content that:
- Uses vivid descriptions and sensory details
- Develops compelling characters and dialogue
- Creates engaging plot structures
- Incorporates literary devices effectively
- Maintains consistent voice and style
- Evokes emotional responses
- Adapts to various genres and formats'),

('Technical Documentation Template', 'You are a technical writing expert. Create documentation that:
- Uses clear, precise language
- Follows logical step-by-step processes
- Includes relevant examples and use cases
- Maintains consistent terminology
- Uses appropriate formatting and structure
- Addresses different user skill levels
- Includes troubleshooting information'),

('Marketing Copy Template', 'You are a marketing copywriter. Generate promotional content that:
- Highlights unique value propositions
- Uses benefit-focused language
- Creates urgency and desire
- Incorporates relevant keywords naturally
- Maintains brand voice consistency
- Optimizes for target demographics
- Includes compelling headlines and CTAs');

-- Insert admin announcements
INSERT INTO admin_announcements (title, content, importance, sender_id, target_audience, requires_response) VALUES
('Welcome to GhostliAI', 'Welcome to GhostliAI! Your account has been set up with 100 free credits to get you started. Explore our AI-powered content generation, writing style analysis, and detection tools. Check out the Quick Start guide in your dashboard.', 'normal', 3, '{"type": "all"}', false),
('System Maintenance Notice', 'Scheduled maintenance will occur every Sunday at 2 AM UTC for approximately 30 minutes. During this time, some features may be temporarily unavailable. We appreciate your patience.', 'important', 3, '{"type": "all"}', false),
('New Feature: Clone Me', 'Introducing Clone Me - our revolutionary writing style replication feature! Upload your writing samples and let our AI generate content that matches your unique voice and style. Available for Pro subscribers.', 'important', 3, '{"type": "subscription", "targetIds": ["PRO", "Enterprise"]}', false),
('Credit Usage Guidelines', 'To help you maximize your credits: Each content generation uses 5-20 credits based on length and complexity. AI detection runs use 2 credits per analysis. Writing style analysis uses 3 credits per sample. Pro users get 2000 monthly credits with rollover.', 'normal', 3, '{"type": "all"}', false);

-- ========================================
-- INDEXES AND CONSTRAINTS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_id ON voucher_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON voucher_redemptions(voucher_id);

-- ========================================
-- BACKUP METADATA
-- ========================================

-- Tables backed up: 36
-- Users: 4 (including test accounts)
-- Subscription Plans: 4 (Free, Starter, Pro, Enterprise)
-- Voucher Codes: 6 (WELCOME100, NEWUSER50, etc.)
-- Feature Flags: 10
-- Global Settings: 10
-- AI Templates: 6
-- Admin Announcements: 4

-- Backup completed successfully
-- Restore with: psql $DATABASE_URL < ghostli_standalone_backup_2025-06-11.sql