# Cron Job Setup for Keeping Render Instance Active

This document provides instructions for setting up cron jobs to prevent your Render.com deployment from going to sleep due to inactivity.

## Why Do We Need Cron Jobs?

Render.com's free tier puts services to sleep after 15 minutes of inactivity. This results in "cold starts" where the first request after sleep can take 30+ seconds to respond. By setting up cron jobs to ping your service regularly, we keep it active and responsive.

## Cron Job Providers

### 1. Cron-Job.org (Recommended - Free)

**Website:** https://cron-job.org

**Setup Instructions:**
1. Create a free account at cron-job.org
2. Click "Create cronjob" 
3. Configure the job:
   - **Title:** Kanban App Warmup
   - **URL:** `https://your-app-name.onrender.com/api/warmup`
   - **Schedule:** Every 10 minutes (`*/10 * * * *`)
   - **HTTP Method:** GET
   - **Timeout:** 30 seconds
4. Enable notifications for failures (optional)
5. Save and activate the cron job

**Advanced Configuration:**
```
Title: Kanban App Warmup
URL: https://your-render-app.onrender.com/api/warmup
Schedule: */10 * * * * (every 10 minutes)
Timezone: UTC
HTTP Method: GET
Request Headers: 
  User-Agent: CronJobWarmup/1.0
Timeout: 30 seconds
Max Redirects: 3
Notification Email: your-email@domain.com (on failure)
```

### 2. UptimeRobot (Alternative - Free)

**Website:** https://uptimerobot.com

**Setup Instructions:**
1. Create account and log in
2. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Kanban App
   - **URL:** `https://your-app-name.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes (minimum on free plan)
3. Configure alert contacts (optional)
4. Create monitor

### 3. Pingdom (Professional - Paid)

**Website:** https://pingdom.com

For production applications requiring more detailed monitoring.

### 4. GitHub Actions (Alternative - Free)

Create a scheduled workflow in your repository:

```yaml
# .github/workflows/keepalive.yml
name: Keep Alive

on:
  schedule:
    # Run every 10 minutes
    - cron: '*/10 * * * *'

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Application
        run: |
          curl -f https://your-app-name.onrender.com/api/warmup || exit 1
```

## Optimal Configuration

### Recommended Settings:
- **Frequency:** Every 10-14 minutes (stays within free tier limits)
- **Endpoint:** Use `/api/warmup` for comprehensive warmup
- **Timeout:** 30-60 seconds
- **Retry:** 2-3 times on failure
- **Monitoring Hours:** 24/7 or business hours only (depending on usage)

### Multiple Region Setup (Advanced):
```
Job 1: Americas (every 10 min during US business hours)
Job 2: Europe (every 10 min during EU business hours)  
Job 3: Asia (every 10 min during Asia business hours)
Job 4: Overnight (every 30 min during low traffic)
```

## Endpoint Information

Your Kanban application provides several endpoints for monitoring:

### `/api/health` - Basic Health Check
- **Purpose:** Quick health status
- **Response Time:** ~50ms
- **Use Case:** Simple uptime monitoring

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `/api/warmup` - Comprehensive Warmup
- **Purpose:** Warm up database connections and services
- **Response Time:** ~200-500ms
- **Use Case:** Preventing cold starts

```json
{
  "status": "warmed-up",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": "245ms",
  "message": "Instance is now warm and ready to serve requests"
}
```

### `/api/ping` - Lightweight Ping
- **Purpose:** Basic connectivity test with system info
- **Response Time:** ~20ms
- **Use Case:** Network connectivity verification

```json
{
  "status": "pong",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20524032,
    "external": 1234567
  }
}
```

## Best Practices

1. **Use `/api/warmup`** for cron jobs as it properly warms up the application
2. **Set appropriate intervals** - every 10-14 minutes is optimal
3. **Configure failure notifications** to detect issues early
4. **Use HTTPS** for secure monitoring
5. **Set proper User-Agent** to identify cron job traffic
6. **Monitor costs** - some providers charge for high-frequency monitoring

## Troubleshooting

### Common Issues:
- **503 Service Unavailable:** App is starting up (normal for first request)
- **Timeout:** Increase timeout to 60 seconds for cold starts
- **Too Many Requests:** Reduce frequency if hitting rate limits

### Monitoring Multiple Environments:
- **Development:** `https://kanban-dev.onrender.com/api/warmup`
- **Staging:** `https://kanban-staging.onrender.com/api/warmup`
- **Production:** `https://kanban-prod.onrender.com/api/warmup`

## Cost Optimization

### Free Tier Limits:
- **Render.com:** 750 hours/month (sufficient for 24/7 with warmup)
- **Cron-Job.org:** Unlimited cron jobs on free plan
- **UptimeRobot:** 50 monitors, 5-minute intervals

### Recommendations:
1. Start with cron-job.org (completely free)
2. Use 10-minute intervals to balance availability and resource usage
3. Monitor during peak hours only if budget is a concern
4. Upgrade to paid plans for production applications

## Example Cron-Job.org Configuration

```
Title: Kanban Production Warmup
URL: https://kanban-collab-app.onrender.com/api/warmup
Description: Keeps the Kanban application warm to prevent cold starts
Schedule Type: Interval
Interval: 10 minutes
Timezone: UTC
HTTP Method: GET
Headers:
  User-Agent: KanbanWarmupBot/1.0
  Accept: application/json
Timeout: 45 seconds
Max Execution Time: 60 seconds
Failure Notification: your-email@domain.com
Success Notification: Disabled (to avoid spam)
```

This setup will keep your Render.com deployed Kanban application responsive and ready for users at all times.