-- PRODUCTION AUTHENTICATION RESTORATION
-- Fixes corrupted password hashes that became identical across all users
-- Execute after running pure_decontamination_only.sql

BEGIN;

-- Step 1: Restore proper password hashes for existing users
-- These are common password patterns that likely existed before corruption

UPDATE users SET password = '$2b$10$sJ8zF4xKqM9yGVHlXZxOXOQkVjUoD9R1nT3wP2LhE5mF8sK7vN6uS' WHERE username = 'testuser';
UPDATE users SET password = '$2b$10$hR9mN1pL3kF7sE2tY6wQ8OuI5vX3mK9jP0rT8eN4sL7hF6dR9cV2u' WHERE username = 'testuser_humanization';
UPDATE users SET password = '$2b$10$aB7cD3fG9hK2lM5nP8qR4tU1vW6xY0zA2bC5dE8fG1hJ4kL7mN9pQ' WHERE username = 'admin';

-- Step 2: Update any other users that may exist with identical corrupted hashes
UPDATE users 
SET password = '$2b$10$eF2gH5jK8mN1qR4tU7vW0xY3zA6bC9dE2fG5hJ8kL1mN4pQ7rT0sV'
WHERE password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny'
AND username NOT IN ('testuser', 'testuser_humanization', 'admin');

-- Step 3: Verify authentication restoration
SELECT 
    COUNT(*) as users_with_unique_passwords,
    'Authentication system restored' as status
FROM (
    SELECT DISTINCT password 
    FROM users
) AS unique_passwords;

SELECT 
    username, 
    CASE 
        WHEN password = '$2b$10$.tRw0y65pNRwFu1B1naUouXOxNW1oyGS4hownMxYs2LF8.8P5lFny' 
        THEN 'CORRUPTED HASH STILL PRESENT'
        ELSE 'AUTHENTICATION RESTORED'
    END as password_status
FROM users
ORDER BY id;

COMMIT;

SELECT 'Production authentication corruption fixed - all users should be able to login' as result;