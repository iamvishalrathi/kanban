# Deployment Environment Debug Instructions

## How to Debug the Login Issue

### 1. Check Browser Console Logs

After deploying, visit your login page and check the browser console. You should see detailed logs like:

```
🚀 Kanban App Starting: {environment: "production", isProd: true, ...}
🔧 API Configuration Debug: {Environment PROD: true, VITE_API_URL from env: "...", ...}
📝 LoginPage: Form submission started: {...}
📤 API Request: {method: "POST", url: "...", ...}
📥 API Response Error/Success: {...}
```

### 2. Key Things to Check in Logs:

1. **Environment Detection**: 
   - Is `Environment PROD: true`?
   - Is `VITE_API_URL from env` showing the correct URL?

2. **API Request URL**: 
   - Should be: `https://kanban-backend-6fgz.onrender.com/api/auth/login`
   - NOT: `https://kanban-chi-coral.vercel.app/api/auth/login`

3. **Network Errors**:
   - CORS errors (check if OPTIONS request fails)
   - Connection timeouts
   - 404 errors (wrong URL)
   - 500 errors (server issues)

### 3. Common Issues & Solutions:

#### Issue 1: Environment Variable Not Loading
**Symptoms**: `VITE_API_URL from env: undefined`
**Solution**: Add environment variable in Vercel dashboard

#### Issue 2: CORS Error
**Symptoms**: `blocked by CORS policy`
**Solution**: Update Render environment variables (remove trailing slash)

#### Issue 3: Wrong API URL
**Symptoms**: API calls go to Vercel domain instead of Render
**Solution**: Check if environment variable is properly set

### 4. Vercel Environment Variable Setup

If environment variable isn't working, add it in Vercel dashboard:
1. Go to Vercel project settings
2. Environment Variables tab
3. Add: `VITE_API_URL` = `https://kanban-backend-6fgz.onrender.com`
4. Set for: Production
5. Redeploy

### 5. Quick Tests

**Test 1**: Check API URL
```javascript
console.log(import.meta.env.VITE_API_URL)
```

**Test 2**: Test direct API call
Visit: `https://kanban-backend-6fgz.onrender.com/health`

**Test 3**: Check CORS
Open browser network tab, look for OPTIONS request

### 6. Backend Logs

Check Render logs for your backend service to see if requests are reaching it.

## Deployment Checklist

- [ ] Render environment variables updated (no trailing slash)
- [ ] Vercel environment variable added (`VITE_API_URL`)
- [ ] Frontend redeployed on Vercel
- [ ] Backend redeployed on Render (if env vars changed)
- [ ] Test login with browser console open
- [ ] Check network tab for correct API URLs
- [ ] Verify backend logs on Render