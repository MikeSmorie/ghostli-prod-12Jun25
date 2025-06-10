# GhostliAI Cloud Deployment Guide

## Overview
This package contains a clean, production-ready operational schema for GhostliAI, extracted from the multi-tenant database and prepared for deployment on cloud platforms like Render, Railway, or Heroku.

## What's Included

### Core Files
- `ghostliai_deployment_package.sql` - Complete schema with operational data
- `validate_schema.sql` - Post-deployment validation script
- `DEPLOYMENT_GUIDE.md` - This deployment guide

### Schema Contents
- **12 core tables** with proper structure and indexes
- **3 subscription plans** (Lite free, Pro monthly, Pro annual)
- **5 promotional vouchers** ready for launch
- **5 global settings** for system configuration
- **7 feature flags** controlling core functionality
- **5 system features** with full configuration
- **Multi-tenant isolation** via `source_app = 'GhostliAI'` tagging

## Deployment Instructions

### 1. Database Setup
```bash
# Create PostgreSQL 15+ database on your cloud provider
# Copy the connection string to use as DATABASE_URL
```

### 2. Schema Import
```bash
# Import the operational schema
psql $DATABASE_URL -f ghostliai_deployment_package.sql
```

### 3. Validation
```bash
# Run validation to ensure successful import
psql $DATABASE_URL -f validate_schema.sql
```

### 4. Environment Variables
Set these required environment variables:
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PORT=5000
NODE_ENV=production
```

## Key Features Ready

### ✅ Subscription Management
- Free tier: Basic content generation (100 default credits)
- Pro tier: Full features including Clone Me system ($29.99/month)
- Annual discount: 40% savings on yearly plans

### ✅ Voucher System
- `WELCOME50` - 50 credits for new users
- `PREMIUM100` - 100 credits for Pro tier
- `BOOST25` - 25 credits general use
- `UNLIMITED30` - 30 days free subscription
- `LAUNCH2025` - 200 credits launch promotion

### ✅ Payment Integration
- PayPal gateway configured
- Cryptocurrency support enabled
- Credit-based consumption model

### ✅ AI Features
- GPT-4o primary model
- AI detection shield
- Content humanization
- Clone Me writing style replication

## Database Isolation

All data is tagged with `source_app = 'GhostliAI'` ensuring:
- Complete isolation from other applications
- Safe multi-tenant operation
- Clean data separation
- No cross-application dependencies

## Production Readiness

### Security Features
- No hardcoded secrets
- Proper data type validation
- Index optimization
- Connection pooling ready

### Scalability
- Efficient query patterns
- Proper indexing strategy
- Normalized data structure
- Performance monitoring ready

### Monitoring
- Error logging table configured
- Change log tracking
- System health validation
- Automated deployment verification

## Post-Deployment Checklist

1. **Database Connectivity** - Verify connection string works
2. **Schema Validation** - Run validation script successfully
3. **Environment Variables** - All required secrets configured
4. **Feature Flags** - Verify all 7 flags are enabled
5. **Payment Testing** - Test PayPal sandbox integration
6. **Credit System** - Verify default credit allocation
7. **Voucher System** - Test voucher redemption flow
8. **Content Generation** - Test AI content creation
9. **AI Detection** - Verify detection shield functionality
10. **Performance** - Monitor initial response times

## Support

This deployment package ensures:
- Zero foreign key dependencies on user data
- Clean boot without migration errors
- Immediate operational capability
- Full feature set activation

The schema is designed for seamless cloud deployment with guaranteed functionality from first boot.