# Render Deployment Guide - GhostliAI Production

## Pre-Deployment Checklist

✅ **Application Status**: Production-ready
- Database: Clean PostgreSQL instance with 36 tables
- Authentication: JWT system operational
- Content Generation: OpenAI integration working
- Credit System: Transaction integrity maintained
- Error Handling: Comprehensive coverage implemented

## Render Deployment Steps

### 1. Access Render Dashboard
- Go to: https://dashboard.render.com
- Log in with your account

### 2. Clean Previous Deployment
- Delete existing `ghostliai` service if present
- Settings → Delete Web Service

### 3. Create New Web Service
- Click "New Web Service"
- Select "Deploy from GitHub"
- Choose repository: `ghostli-prod-12Jun25`

### 4. Configuration Settings

| Setting | Value |
|---------|-------|
| **Name** | `ghostli-prod-12jun25` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Auto-Deploy** | Disabled (manual control) |

### 5. Environment Variables

Copy from `.env.production.template`:

```
NODE_ENV=production
DATABASE_URL=[your_neon_postgresql_url]
JWT_SECRET=[secure_random_string_32_chars]
OPENAI_API_KEY=[your_openai_key]
PAYPAL_CLIENT_ID=[your_paypal_client_id]
PAYPAL_CLIENT_SECRET=[your_paypal_secret]
SENDGRID_API_KEY=[optional_email_service]
```

### 6. Health Check Configuration
- Health Check Path: `/api/system/health`
- This endpoint validates database connectivity and system status

### 7. Production Verification Tests

After deployment, test these endpoints:

1. **Health Check**: `GET /api/system/health`
2. **Registration**: `POST /api/auth/register`
3. **Login**: `POST /api/auth/login`
4. **Content Generation**: `POST /api/content/generate`
5. **Credit Balance**: `GET /api/credits/balance`

## Security Features Enabled

- CORS protection
- Rate limiting on authentication endpoints
- JWT token expiration (24h)
- Helmet security headers
- Password hashing with bcrypt
- SQL injection protection via Drizzle ORM

## Database Schema

Production database includes:
- User management (authentication, roles, credits)
- Content generation tracking
- Payment processing
- Feature flags and subscriptions
- Activity logging and audit trails

## Monitoring

The application includes:
- Database connection health checks
- OpenAI API monitoring
- Credit transaction logging
- Error tracking and reporting
- System performance metrics

## Post-Deployment Actions

1. Verify all endpoints return expected responses
2. Test user registration and login flow
3. Confirm content generation with credit deduction
4. Validate PayPal payment integration
5. Check system health monitoring

The application is ready for production traffic with comprehensive error handling and monitoring capabilities.