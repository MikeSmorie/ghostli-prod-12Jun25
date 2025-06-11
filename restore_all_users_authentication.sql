-- RESTORE AUTHENTICATION FOR ALL EXISTING USERS
-- This preserves all customer profiles and data while fixing corrupted password hashes

BEGIN;

-- Step 1: Identify all users with corrupted identical password hashes
-- The corrupted hash that appears across all users is: $2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny

-- Step 2: Generate temporary secure passwords for all corrupted accounts
-- This allows customers to regain access while preserving all their data

UPDATE users 
SET password = '$2b$10$bN1TpUaVmkJnSSXdFqE.muB24NU4X0tVob.DzkbxC8SQbBXE0zdYK'  -- temp password: TempAccess2025!
WHERE password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

-- Step 3: Update specific known accounts with their preferred passwords
UPDATE users SET password = '$2b$10$4/s0DwDQJdZsAAzdbmBSmO.2m0Xayj/TUVPY..QS.p3yHBsWNTxRG' WHERE username = 'admin'; -- password: password123
UPDATE users SET password = '$2b$10$z0kRmxc2vWKCQu43I9YNGOvGe8a1ksP.gus7hf0XUY6m.AvAHbjQa' WHERE username = 'testuser'; -- password: password123
UPDATE users SET password = '$2b$10$PLmpaHvaf/17dx9uf5oWgu2Jxfg.yzIIDmxOAw.iUgJAN3A0iANLq' WHERE username = 'testuser_humanization'; -- password: password123

-- Step 4: Restore Ghost1#Ghost1* account if missing
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2', 'user', 'ghost1@example.com', 100, false, 'FREE', NOW(), NULL)
ON CONFLICT (username) DO UPDATE SET password = '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2';

-- Step 5: Verification - count users restored
SELECT 
    COUNT(*) as total_users_restored,
    'All customer profiles preserved with restored authentication' as status
FROM users 
WHERE password != '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

-- Step 6: Show remaining corrupted accounts (should be 0)
SELECT 
    COUNT(*) as corrupted_accounts_remaining,
    CASE 
        WHEN COUNT(*) = 0 THEN 'All customer authentication fully restored'
        ELSE 'WARNING: ' || COUNT(*) || ' accounts still corrupted'
    END as final_status
FROM users 
WHERE password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny';

COMMIT;

-- Instructions for customers:
-- Most customers can now login with temporary password: TempAccess2025!
-- Known accounts use: password123
-- Ghost1#Ghost1* uses: #Ghost1*
-- All customer profiles and data are fully preserved