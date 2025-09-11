# 🚀 Deployment Guide: Kanban App

Deploy your Kanban application with **Frontend on Vercel** and **Backend on Render**.

## 📋 Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account
- [Render](https://render.com) account
- Your code pushed to GitHub repository

## 🗄️ Database Setup (Required First)

### Option 1: Supabase (Recommended - Free Tier)
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Get your PostgreSQL connection string from Settings > Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option 2: Render PostgreSQL
1. In Render dashboard, create new PostgreSQL database
2. Copy the connection string provided

## 🔙 Backend Deployment on Render

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** > **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `kanban-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

### Step 3: Set Environment Variables
In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=your_database_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
CORS_ORIGIN=https://your-app-name.vercel.app
REDIS_ENABLED=false
SENDGRID_API_KEY=your_sendgrid_key_optional
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Important**: 
- Generate a strong JWT_SECRET (32+ characters)
- Replace DATABASE_URL with your actual database connection string
- Replace CORS_ORIGIN with your Vercel domain (you'll get this after frontend deployment)

### Step 4: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment to complete (~5-10 minutes)
3. Copy your Render URL: `https://your-app-name.onrender.com`

## 🎨 Frontend Deployment on Vercel

### Step 1: Update Frontend Configuration
1. Open `frontend/vite.config.prod.js`
2. Replace `your-render-app.onrender.com` with your actual Render URL

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

### Step 3: Set Environment Variables (Optional)
In Vercel dashboard, add if needed:
```env
NODE_ENV=production
```

### Step 4: Deploy Frontend
1. Click **"Deploy"**
2. Wait for deployment (~3-5 minutes)
3. Get your Vercel URL: `https://your-app-name.vercel.app`

## 🔄 Final Configuration

### Update CORS Origin
1. Go back to Render dashboard
2. Update `CORS_ORIGIN` environment variable with your Vercel URL
3. Redeploy backend service

### Test Your Deployment
1. Visit your Vercel URL
2. Test user registration/login
3. Test board creation and real-time features

## 🛠️ Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_32_character_minimum_secret_key
CORS_ORIGIN=https://your-app.vercel.app
REDIS_ENABLED=false
SENDGRID_API_KEY=optional_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (Vercel)
```env
NODE_ENV=production
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure CORS_ORIGIN matches your Vercel domain exactly
2. **Database Connection**: Verify DATABASE_URL format and credentials
3. **Build Failures**: Check build logs in Render/Vercel dashboards
4. **WebSocket Issues**: Free tiers may have WebSocket limitations

### Debug Steps:
1. Check Render logs: Dashboard > Service > Logs
2. Check Vercel logs: Dashboard > Project > Functions
3. Test API endpoints: `https://your-render-app.onrender.com/api/health`

## 📊 Free Tier Limitations

### Render Free Tier:
- Service sleeps after 15 minutes of inactivity
- 750 hours/month free
- Slower cold start times

### Vercel Free Tier:
- 100GB bandwidth/month
- Unlimited deployments
- Edge network included

## 🚀 Going Live Checklist

- [ ] Database created and accessible
- [ ] Backend deployed on Render
- [ ] Environment variables configured
- [ ] Frontend deployed on Vercel
- [ ] CORS origin updated
- [ ] User registration/login working
- [ ] Real-time features functional
- [ ] Custom domain configured (optional)

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify all environment variables
3. Test API endpoints directly
4. Check browser console for frontend errors

Your Kanban app should now be live! 🎉

**Frontend**: https://your-app-name.vercel.app
**Backend**: https://your-app-name.onrender.com