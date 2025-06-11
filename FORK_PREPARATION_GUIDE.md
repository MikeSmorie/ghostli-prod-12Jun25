# GhostliAI Standalone Recovery - Fork Preparation Guide

## Fork Creation Steps

### 1. Create New Replit Project
- Fork this project to create: `GhostliAI-Standalone-Recovery`
- Ensure complete code isolation from the original contaminated environment

### 2. Database Configuration
- Replace the current `DATABASE_URL` with a fresh PostgreSQL instance
- Use the prepared `.env.standalone` file as your environment template
- Confirm no connection to the shared Omega database ecosystem

### 3. Environment Setup
```bash
# Copy the standalone environment file
cp .env.standalone .env

# Verify database disconnection
echo $DATABASE_URL
# Should show: postgres://ghostli_standalone_db (placeholder)
```

### 4. Pre-Migration Checklist
- ✅ New project created and named correctly
- ✅ Clean `.env` file with standalone database URL
- ✅ No references to contaminated shared environment
- ✅ All authentication code preserved and functional
- ✅ Schema files ready for migration (12 tables confirmed)

### 5. Ready for Schema Migration
Once the fork is complete, the project will be ready for:
- Fresh database schema deployment
- Clean table creation
- Authentication system initialization
- Credit system activation

## Database Schema Overview
The standalone instance will include these clean tables:
1. users (authentication & profiles)
2. activity_logs (user actions)
3. global_settings (system configuration)
4. credit_transactions (payment tracking)
5. error_logs (system monitoring)
6. messages (communications)
7. subscription_plans (billing tiers)
8. user_subscriptions (active subscriptions)
9. payments (transaction records)
10. client_payment_gateways (payment processing)
11. features & plan_features (feature management)
12. Additional crypto/voucher tables (optional features)

## Security Notes
- All password hashing uses bcrypt with 10 salt rounds
- JWT tokens properly configured for session management
- Role-based access control (user, admin, supergod) implemented
- Session security configured for production deployment