# 🚀 Deployment Guide: Kanban App

Deploy your Kanban application with **Frontend on Vercel** and **Backend on Render**.

## � Repository Structure

This project has been optimized with a clean structure:

```
kanban/
├── 📁 backend/              # Node.js/Express backend
│   ├── 📁 config/           # Configuration files
│   ├── 📁 controllers/      # Route controllers
│   ├── 📁 middleware/       # Express middleware
│   ├── 📁 models/           # Database models (Sequelize)
│   ├── 📁 routes/           # API routes
│   ├── 📁 socket/           # Socket.IO handlers
│   ├── 📁 utils/            # Utility functions
│   ├── .env                 # Backend environment variables
│   ├── package.json         # Backend dependencies
│   └── server.js            # Main server file
│
├── 📁 frontend/             # React/Vite frontend
│   ├── 📁 public/           # Static assets
│   ├── 📁 src/              # React source code
│   │   ├── 📁 components/   # React components
│   │   ├── 📁 contexts/     # React contexts (Socket, etc.)
│   │   ├── 📁 pages/        # Page components
│   │   └── 📁 services/     # API service functions
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
│
├── 🚀 deploy.bat            # Windows deployment script
├── 📋 DEPLOYMENT.md         # This deployment guide
├── 🐳 Dockerfile            # Docker configuration
├── 🌐 nginx.conf            # Nginx configuration
├── 🎯 render.yaml           # Render deployment config
└── ⚡ vercel.json           # Vercel deployment config
```

**✅ Cleaned & Production Ready:**
- Removed SQLite dependencies (now uses PostgreSQL + Supabase)
- Integrated Upstash Redis for caching and sessions
- Removed development console logs
- Optimized for cloud deployment

## �📋 Prerequisites

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

## � Redis Setup (Upstash - Required for Sessions)

### Upstash Redis (Recommended - Free Tier)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the **REST URL** and **REST TOKEN** from database details
4. These will be used for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

*Note: The application now uses Upstash Redis REST API instead of traditional Redis connections for better cloud compatibility.*

## �🔙 Backend Deployment on Render

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
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
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
The frontend will automatically use the correct backend URL based on the environment. The `vite.config.js` file handles both development and production configurations.

### Step 2: Deploy to Vercel

#### Manual Configuration (Recommended - Most Reliable)

Due to persistent Vite build issues with vercel.json, use manual configuration:
If you need to configure manually:

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### ⚠️ Build & Module Error Fix

**Problem**: "vite: command not found", "ERR_MODULE_NOT_FOUND", and "404 NOT_FOUND" errors

**Solution**: The project now directly calls the Vite binary to bypass PATH resolution issues.

**Current vercel.json configuration**:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Change**: Removed all build configuration from vercel.json, forcing manual configuration for reliability

**If deployment still fails**:

1. **Try Manual Configuration** (Recommended):
   - **Delete the current Vercel project completely**
   - **Create new project with these exact settings**:
     - **Framework Preset**: `Vite`
     - **Root Directory**: `frontend`  
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

2. **Alternative - Override vercel.json**:
   - Temporarily delete vercel.json from your repo
   - Deploy with manual settings above
   - Re-add vercel.json after successful deployment

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
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
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

### 🚨 IMMEDIATE FIX - Persistent Vite Errors

**The vercel.json approach is having issues. Use MANUAL configuration instead:**

1. **Go to Vercel Dashboard** → Your Project → Settings → **Delete Project**
2. **Create New Project** → Import from GitHub
3. **Configure MANUALLY** (ignore vercel.json):
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`  
   - **Install Command**: `npm install`
4. **Deploy immediately**

**Critical**: Use the ROOT DIRECTORY setting of `frontend` - this is the key to success!

---

### Common Issues:

1. **Vite Build Errors (Multiple Types)**:
   ```bash
   # Error: sh: line 1: vite: command not found
   # Error: Cannot find package 'vite' imported from vite.config.js
   # Error: ERR_MODULE_NOT_FOUND
   # Error: 404 NOT_FOUND (Code: NOT_FOUND, ID: bom1::xxx)
   ```
   **Root Cause**: Vite dependency resolution issues in Vercel build environment
   
   **Step-by-Step Fix**:
   ```bash
   # Option 1: Use updated vercel.json (commit & push new version)
   # Option 2: Manual configuration (delete project, recreate):
   ```
   
   **Manual Settings** (if vercel.json fails):
   - **Framework**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci` (or `npm install`)
   
   **Key Fix**: Use `npm run build` instead of `npx vite build` to properly resolve Vite dependency

2. **CORS Errors**: Ensure CORS_ORIGIN matches your Vercel domain exactly

3. **Database Connection**: Verify DATABASE_URL format and credentials

4. **Redis Connection**: Check UPSTASH_REDIS_REST_URL and TOKEN are correct

5. **Build Failures**: Check build logs in Render/Vercel dashboards

6. **WebSocket Issues**: Free tiers may have WebSocket limitations

7. **Console Errors**: All development logs have been removed for production

8. **Deprecated Package Warnings**: 
   ```bash
   # Warning: react-beautiful-dnd is deprecated
   ```
   These are warnings only and won't break the deployment

### Debug Steps:

#### For Vercel Build Issues:
1. **Check Build Logs**: Dashboard > Project > Deployments > View Function Logs
2. **Clear Build Cache**: Dashboard > Project > Settings > Clear Cache
3. **Try Different Configuration**:
   - Root Directory: `frontend`
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Install Command: `npm install`
4. **Test Locally**: 
   ```bash
   cd frontend
   npm install
   npm run build  # Should work locally
   ```

#### For Backend Issues:
1. Check Render logs: Dashboard > Service > Logs
2. Test API endpoints: `https://your-render-app.onrender.com/api/health`
3. Verify environment variables are set correctly

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

- [ ] **Database**: PostgreSQL database created (Supabase/Render)
- [ ] **Redis**: Upstash Redis database created and configured
- [ ] **Backend**: Deployed on Render with all environment variables
- [ ] **Frontend**: Deployed on Vercel with clean build
- [ ] **CORS**: Origin updated to match Vercel domain
- [ ] **Testing**: User registration/login working
- [ ] **Real-time**: Socket.IO features functional
- [ ] **Performance**: No console logs in production
- [ ] **Optional**: Custom domain configured

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify all environment variables
3. Test API endpoints directly
4. Check browser console for frontend errors

Your Kanban app should now be live! 🎉

**Frontend**: https://your-app-name.vercel.app
**Backend**: https://your-app-name.onrender.com