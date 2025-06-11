# GhostliAI-Standalone-Recovery Credentials Snapshot
**Generated**: 2025-06-11
**Environment**: Clean PostgreSQL Database

## Database Access

### Current Database Configuration
- **Database URL**: Available in environment variable `DATABASE_URL`
- **Schema**: PostgreSQL 17.x compatible
- **Tables**: 36 tables with complete operational data
- **Status**: Clean, seeded, production-ready

### Database Backup Location
- **File**: `ghostli_standalone_backup_2025-06-11.sql`
- **Size**: Complete schema + operational data
- **Restore Command**: `psql $DATABASE_URL < ghostli_standalone_backup_2025-06-11.sql`

## Application Access Credentials

### Admin Account
- **Username**: `adminuser`
- **Password**: `adminpass123`
- **Role**: `admin`
- **User ID**: 3
- **Initial Credits**: 100
- **Permissions**: Full system access, admin routes, user management

### Test User Accounts (for testing purposes)
1. **testuser1**
   - Password: `testpass123`
   - Credits: 200 (redeemed WELCOME100 voucher)
   - User ID: 1

2. **testuser2**
   - Password: `testpass456`
   - Credits: 100
   - User ID: 2

3. **R1cover** (registered via UI)
   - Password: User-defined
   - Credits: 100
   - User ID: 4

## API Keys and External Services

### Required Environment Variables
```env
# Core Application
DATABASE_URL=<postgresql-connection-string>
OPENAI_API_KEY=<provided-by-user>
PAYPAL_CLIENT_ID=<provided-by-user>
PAYPAL_CLIENT_SECRET=<provided-by-user>

# Optional Services
SENDGRID_API_KEY=<not-configured>
```

### API Key Sources
- **OpenAI**: https://platform.openai.com/api-keys
- **PayPal Developer**: https://developer.paypal.com/
- **SendGrid**: https://sendgrid.com/ (optional)

## System Configuration

### Operational Data Seeded
- **Subscription Plans**: 4 tiers (Free, Starter, Pro, Enterprise)
- **Voucher Codes**: 6 active codes with various benefits
- **Global Settings**: 10 system configuration parameters
- **Feature Flags**: 10 system control flags
- **AI Templates**: 6 writing prompt templates
- **Admin Announcements**: 4 onboarding messages

### Security Configuration
- **JWT Authentication**: Active with proper token validation
- **Rate Limiting**: 10 content generations per minute
- **Role-Based Access**: Admin/user permissions enforced
- **Input Validation**: Zod schemas for all API endpoints
- **Password Hashing**: bcrypt with salt

## Backup Strategy

### Files to Secure
1. **Database Backup**: `ghostli_standalone_backup_2025-06-11.sql`
2. **Codebase**: Complete project directory (exclude node_modules, .env)
3. **Configuration**: Environment variables documented
4. **Documentation**: DEPLOYMENT_GUIDE.md, this credentials file

### Recovery Procedure
1. Restore database from SQL backup
2. Deploy codebase to hosting environment
3. Configure environment variables
4. Run health checks and verification
5. Update admin credentials for security

## Security Notes

### Immediate Actions Required for Production
- Change admin password from default `adminpass123`
- Generate new JWT secret for production
- Configure HTTPS with SSL certificates
- Set up proper CORS origins
- Enable production logging and monitoring

### Credential Management
- Store API keys in secure environment variable management
- Never commit secrets to version control
- Use separate credentials for development/staging/production
- Implement credential rotation policy

## System Status

### Verified Working Features
- User registration and authentication
- Content generation with OpenAI integration
- Voucher redemption system
- Subscription plan management
- Admin functionality
- Rate limiting and security measures

### Database Health
- 36 tables created successfully
- All foreign key relationships intact
- Indexes configured for performance
- Operational data seeded and verified

---

**Important**: This file contains sensitive information. Store securely and never commit to public repositories.
**Backup Status**: Complete and verified
**Recovery Tested**: Database restore confirmed functional