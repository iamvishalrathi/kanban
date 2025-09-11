# Deployment Checklist

## Pre-Deployment
- [ ] Code is working locally
- [ ] All environment variables documented
- [ ] Database schema ready
- [ ] Dependencies updated
- [ ] Build process tested

## Backend (Render)
- [ ] GitHub repository pushed
- [ ] Render web service created
- [ ] Environment variables set:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET (32+ characters)
  - [ ] CORS_ORIGIN
  - [ ] REDIS_ENABLED=false
- [ ] Build and start commands configured
- [ ] Service deployed successfully
- [ ] Health endpoint accessible

## Frontend (Vercel)
- [ ] vite.config.prod.js updated with Render URL
- [ ] Vercel project created
- [ ] Build configuration set
- [ ] Environment variables set (if any)
- [ ] Deployment successful
- [ ] Site accessible

## Post-Deployment
- [ ] CORS_ORIGIN updated in Render with Vercel URL
- [ ] Backend redeployed
- [ ] User registration tested
- [ ] Login functionality tested
- [ ] Board creation tested
- [ ] Real-time features tested
- [ ] WebSocket connection tested

## Optional Enhancements
- [ ] Custom domain configured
- [ ] HTTPS enforced
- [ ] Performance monitoring setup
- [ ] Error tracking configured
- [ ] Backup strategy implemented

## Production Environment URLs
- Frontend: https://your-app-name.vercel.app
- Backend: https://your-app-name.onrender.com
- API Health: https://your-app-name.onrender.com/api/health