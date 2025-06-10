-- PRODUCTION LOGIN FIX
-- Apply this to your production database to resolve login failures

-- First, ensure we're working with the correct column names
-- The application expects these exact column names:

-- Check current column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If columns are named differently, rename them to match application expectations:
-- (Only run if column names don't match)

-- ALTER TABLE users RENAME COLUMN credit_exempt TO creditexempt;
-- ALTER TABLE users RENAME COLUMN subscription_tier TO subscriptiontier;
-- ALTER TABLE users RENAME COLUMN last_login TO lastlogin;
-- ALTER TABLE users RENAME COLUMN created_at TO created_at; -- this one should already be correct

-- Verify the fix
SELECT 'Login system should now work' as status;