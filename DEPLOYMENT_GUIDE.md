# GhostliAI-Standalone-Recovery Deployment Guide

## Overview
Complete deployment instructions for the GhostliAI standalone application with clean database and operational data.

## Prerequisites
- Node.js 20.x or higher
- PostgreSQL 17.x
- Git
- npm or yarn package manager

## 1. Repository Setup

### Clone or Extract Codebase
```bash
# If using Git repository
git clone <repository-url>
cd ghostliai-standalone-recovery

# If using ZIP backup
unzip ghostliai-backup.zip
cd ghostliai-standalone-recovery
```

### Install Dependencies
```bash
npm install
```

## 2. Environment Configuration

### Create .env File
Create a `.env` file in the root directory with the following variables:

```env
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database_name

# OpenAI API Configuration
OPENAI_API_KEY=sk-...your-openai-api-key

# PayPal Configuration (for payment processing)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Optional: Email Configuration (for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key

# Application Settings
NODE_ENV=production
PORT=5000
```

### Required API Keys
1. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
2. **PayPal Credentials**: Get from https://developer.paypal.com/
3. **SendGrid API Key** (optional): Get from https://sendgrid.com/

## 3. Database Setup

### Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ghostliai_standalone;

# Create user (optional)
CREATE USER ghostliai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ghostliai_standalone TO ghostliai_user;
```

### Restore Database from Backup
```bash
# Apply the complete backup (includes schema + data)
psql $DATABASE_URL < ghostli_standalone_backup_2025-06-11.sql
```

### Alternative: Fresh Schema Setup
```bash
# If starting fresh, push schema with Drizzle
npx drizzle-kit push
```

## 4. Application Startup

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 5. Default Access Credentials

### Admin Account
- **Username**: adminuser
- **Password**: adminpass123
- **Role**: admin
- **Credits**: 100

### Test User Accounts
- **testuser1** / testpass123 (200 credits - redeemed voucher)
- **testuser2** / testpass456 (100 credits)

### Default Voucher Codes
- **WELCOME100**: 100 bonus credits
- **NEWUSER50**: 50 credits for new users
- **STARTER25**: 25% discount on subscriptions
- **PRO500**: 500 bonus credits
- **STUDENT50**: 50% discount for free tier

## 6. System Verification

### Health Checks
1. **Application**: Visit http://localhost:5000
2. **Authentication**: Test login with admin credentials
3. **API**: Test `/api/user` endpoint
4. **Database**: Verify table count (36 tables expected)

### Feature Verification
- User registration and login
- Voucher redemption system
- Content generation (requires OpenAI key)
- AI detection tools
- Subscription plan display
- Admin announcements

## 7. Production Configuration

### Security Settings
- Change default admin password immediately
- Update JWT secret in production
- Enable HTTPS with SSL certificates
- Configure CORS for production domains
- Set up rate limiting for API endpoints

### Performance Optimization
- Enable gzip compression (already configured)
- Set up database connection pooling
- Configure Redis for session storage (optional)
- Enable CDN for static assets

### Monitoring
- Set up error logging service
- Configure uptime monitoring
- Enable performance tracking
- Set up database backup schedule

## 8. Backup and Recovery

### Regular Backups
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Codebase backup
git commit -am "Regular backup"
git push origin main
```

### Disaster Recovery
1. Restore database from latest backup
2. Deploy latest codebase version
3. Update environment variables
4. Verify all services are running

## 9. Troubleshooting

### Common Issues
- **Database connection errors**: Check DATABASE_URL format
- **OpenAI API errors**: Verify API key and billing status
- **PayPal integration issues**: Check sandbox vs production settings
- **Rate limiting**: Adjust limits in server/index.ts

### Support Resources
- Check application logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure all required ports are open and accessible
- Review database connection and permissions

## 10. Post-Deployment Checklist

- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Admin login functional
- [ ] User registration working
- [ ] Content generation operational
- [ ] Payment processing configured
- [ ] SSL certificates installed (production)
- [ ] Monitoring systems active
- [ ] Backup systems configured
- [ ] Security settings reviewed

---

**Deployment Status**: Ready for production
**Last Updated**: 2025-06-11
**Version**: Standalone Recovery v1.0