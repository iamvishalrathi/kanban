# Upstash Redis Setup Guide

## Step 1: Create Upstash Redis Instance

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up or log in with your account
3. Click "Create Database"
4. Choose these settings:
   - **Name**: `kanban-redis` (or any name you prefer)
   - **Type**: Regional
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
   - **Primary Region**: Same as above
   - **TLS**: Enable (recommended)

## Step 2: Get Your Connection Credentials

After creating the database:

1. Go to your database details page
2. In the "REST API" section, you'll find:
   - **UPSTASH_REDIS_REST_URL**: Copy this URL
   - **UPSTASH_REDIS_REST_TOKEN**: Copy this token

## Step 3: Update Environment Variables

Update your `.env` file with the credentials:

```bash
# Redis Configuration - Upstash Redis
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-database-name.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## Step 4: Test Your Redis Connection

Run the test script:
```bash
node setup-redis.js
```

## Step 5: Production Environment

For production (Render), add the same environment variables to your Render service:

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add these variables:
   - `REDIS_ENABLED` = `true`
   - `UPSTASH_REDIS_REST_URL` = your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN` = your Upstash Redis REST token

## Benefits of Using Upstash Redis

1. **Serverless**: No infrastructure management required
2. **Global**: Low latency with edge locations
3. **REST API**: Easy integration with any platform
4. **Pricing**: Pay-per-request model, generous free tier
5. **Compatibility**: Redis-compatible commands

## Redis Usage in Your Kanban App

Redis will be used for:
- Session storage
- Caching database queries
- Real-time features (WebSocket connections)
- Rate limiting (already implemented)

## Testing Your Setup

After configuring, your Redis test should show:
```
🔴 Testing Upstash Redis connection...
✅ Redis connection successful!
📊 Redis Info:
   URL: https://your-database.upstash.io
   Status: Connected
```