# Deployment Guide

This guide covers deploying the Kanban Collaborative App to various platforms.

## Table of Contents

1. [Render.com Deployment](#rendercom-deployment)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Post-Deployment Setup](#post-deployment-setup)

## Render.com Deployment

### Prerequisites
- GitHub account with your project repository
- Render.com account
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash recommended)
- SendGrid account for emails

### Step 1: Database Setup

#### Option A: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Note down the database URL from Settings > Database
4. Enable necessary extensions in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

#### Option B: Render PostgreSQL
1. In Render dashboard, create new PostgreSQL service
2. Choose instance type (free tier available)
3. Note down connection details

### Step 2: Redis Setup (Upstash)
1. Go to https://upstash.com
2. Create Redis database
3. Note down the Redis URL from Details tab

### Step 3: SendGrid Setup
1. Go to https://sendgrid.com
2. Create account and verify your sender identity
3. Generate API key in Settings > API Keys
4. Verify your sender domain/email

### Step 4: Deploy to Render
1. Connect your GitHub repository to Render
2. Create new Web Service
3. Configure deployment:

**Basic Settings:**
- **Name:** kanban-collaborative-app
- **Environment:** Node
- **Build Command:** `npm run build:production`
- **Start Command:** `cd backend && npm start`
- **Auto-Deploy:** Yes

**Advanced Settings:**
- **Node Version:** 18
- **Root Directory:** Leave blank (uses project root)

## Environment Variables

Set these environment variables in Render dashboard:

### Required Variables
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@host:port/database
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Optional Variables
```
CORS_ORIGIN=https://your-domain.com
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
SESSION_TIMEOUT=86400000
RUN_MIGRATIONS=true
RUN_SEEDS=false
```

### Build Command Setup
Create `package.json` script in project root:
```json
{
  "scripts": {
    "build:production": "cd frontend && npm ci && npm run build && cd ../backend && npm ci --production"
  }
}
```

## Database Setup

### Automatic Migrations
Set `RUN_MIGRATIONS=true` in environment variables to run migrations on startup.

### Manual Migration (if needed)
1. Connect to your database
2. Run migrations manually:
```bash
cd backend
npm run migrate
npm run seed # Optional: seed with demo data
```

## Docker Deployment

### Using Docker Compose (Local/VPS)
```bash
# Clone repository
git clone https://github.com/yourusername/kanban-app.git
cd kanban-app

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Using Single Container
```bash
# Build image
docker build -t kanban-app .

# Run container
docker run -d \
  --name kanban-app \
  -p 3000:3000 \
  -e DATABASE_URL=your_db_url \
  -e REDIS_URL=your_redis_url \
  -e JWT_SECRET=your_jwt_secret \
  -e SENDGRID_API_KEY=your_sendgrid_key \
  kanban-app
```

### Docker Hub Deployment
```bash
# Tag for Docker Hub
docker tag kanban-app yourusername/kanban-app:latest

# Push to Docker Hub
docker push yourusername/kanban-app:latest
```

## CI/CD Pipeline

The project includes GitHub Actions workflows for automated deployment.

### Setup GitHub Secrets
Add these secrets to your GitHub repository:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
VITE_API_URL=https://your-app.onrender.com/api
RENDER_SERVICE_ID=srv-xxx (from Render dashboard)
RENDER_API_KEY=rnd_xxx (from Render Account Settings)
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/... (optional)
SONAR_TOKEN=your-sonar-token (optional)
SNYK_TOKEN=your-snyk-token (optional)
```

### Manual Deployment Trigger
You can trigger deployment manually via GitHub Actions or by pushing to the main branch.

## Post-Deployment Setup

### 1. Verify Deployment
- Check https://your-app.onrender.com/api/health
- Verify database connections
- Test user registration and login

### 2. Setup Cron Jobs
Follow the [Cron Setup Guide](./CRON_SETUP.md) to prevent cold starts.

### 3. Configure Domain (Optional)
1. In Render dashboard, go to your service
2. Add custom domain in Settings
3. Configure DNS records as instructed

### 4. Setup Monitoring
- Configure UptimeRobot or similar for uptime monitoring
- Setup error tracking (Sentry recommended)
- Monitor application logs in Render dashboard

### 5. Seed Initial Data
If you want demo data:
```bash
# In Render shell or locally connected to prod DB
cd backend
npm run seed:templates  # Creates official templates
npm run seed:demo      # Creates demo users and boards (optional)
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check database server status
- Ensure database extensions are installed

**Redis Connection Issues:**
- Verify REDIS_URL format
- Check Redis service status
- Ensure Redis allows external connections

**Email Issues:**
- Verify SendGrid API key and permissions
- Check sender email verification
- Review SendGrid activity logs

### Performance Optimization

1. **Enable Redis caching** for better performance
2. **Configure CDN** for static assets (optional)
3. **Setup horizontal scaling** with multiple Render instances
4. **Optimize database queries** with proper indexes

### Monitoring and Logs

- **Application logs:** Available in Render dashboard
- **Error tracking:** Consider integrating Sentry
- **Performance monitoring:** Use New Relic or similar APM tools
- **Uptime monitoring:** Setup with UptimeRobot or Pingdom

## Scaling Considerations

### Vertical Scaling
- Upgrade Render instance type for more CPU/RAM
- Use higher-tier database instances

### Horizontal Scaling
- Deploy multiple Render instances behind load balancer
- Use Redis for session storage (already configured)
- Implement database read replicas

### Database Scaling
- Enable connection pooling (already configured)
- Use database read replicas for read operations
- Implement caching strategies with Redis

This deployment guide should get your Kanban application running in production successfully. For any issues, check the application logs and ensure all environment variables are correctly configured.