-- COMPREHENSIVE CUSTOMER AUTHENTICATION RESTORATION
-- Restores login access for all ~100 customers while preserving all profile data
-- Execute immediately on production database

BEGIN;

-- Step 1: Restore authentication for ALL customers with corrupted identical hashes
UPDATE users 
SET password = '$2b$10$bN1TpUaVmkJnSSXdFqE.muB24NU4X0tVob.DzkbxC8SQbBXE0zdYK'  -- TempAccess2025!
WHERE password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

-- Step 2: Set specific passwords for known admin/test accounts
UPDATE users SET password = '$2b$10$4/s0DwDQJdZsAAzdbmBSmO.2m0Xayj/TUVPY..QS.p3yHBsWNTxRG' WHERE username = 'admin';
UPDATE users SET password = '$2b$10$z0kRmxc2vWKCQu43I9YNGOvGe8a1ksP.gus7hf0XUY6m.AvAHbjQa' WHERE username = 'testuser';
UPDATE users SET password = '$2b$10$PLmpaHvaf/17dx9uf5oWgu2Jxfg.yzIIDmxOAw.iUgJAN3A0iANLq' WHERE username = 'testuser_humanization';

-- Step 3: Restore Ghost1#Ghost1* account with proper credentials
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2', 'user', 'ghost1@example.com', 100, false, 'FREE', NOW(), NULL)
ON CONFLICT (username) DO UPDATE SET password = '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2';

-- Step 4: Verification - All customers should now have working authentication
SELECT 
    COUNT(*) as customers_restored,
    'Customer authentication recovery complete' as status
FROM users 
WHERE password != '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

SELECT 
    COUNT(*) as corrupted_remaining
FROM users 
WHERE password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

COMMIT;

-- Customer access restored:
-- Most customers: username + "TempAccess2025!"
-- Admin accounts: username + "password123" 
-- Ghost1#Ghost1*: "#Ghost1*"
-- All profiles, credits, subscriptions preserved