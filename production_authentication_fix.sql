-- Restore valid bcrypt password hashes for core users
UPDATE users SET password = '$2b$10$4/s0DwDQJdZsAAzdbmBSmO.2m0Xayj/TUVPY..QS.p3yHBsWNTxRG' WHERE username = 'admin'; -- password: password123
UPDATE users SET password = '$2b$10$z0kRmxc2vWKCQu43I9YNGOvGe8a1ksP.gus7hf0XUY6m.AvAHbjQa' WHERE username = 'testuser'; -- password: password123
UPDATE users SET password = '$2b$10$PLmpaHvaf/17dx9uf5oWgu2Jxfg.yzIIDmxOAw.iUgJAN3A0iANLq' WHERE username = 'testuser_humanization'; -- password: password123

-- Restore Ghost1#Ghost1* account if missing
INSERT INTO users (username, password, role, email, credits, creditexempt, subscriptiontier, created_at, lastlogin) 
VALUES ('Ghost1#Ghost1*', '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2', 'user', 'ghost1@example.com', 100, false, 'FREE', NOW(), NULL)
ON CONFLICT (username) DO UPDATE SET password = '$2b$10$zYGGIDjWO6zr0zYqrqcmruGmJLlNmb1evcTwVWpqlkbpMRjmrvDB2';