# Render Deployment Guide - Digital Signage Platform

## 🚨 CRITICAL: Rate Limiting Protection for Free Tier

This application has been optimized for Render's free tier with aggressive rate limiting protection.

## Backend Deployment (Render)

### 1. Create Web Service
- Repository: Your GitHub repo
- Branch: main
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Environment: Node.js

### 2. Environment Variables
```
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

### 3. Rate Limiting Configuration
The backend is configured with conservative rate limits:
- Dashboard endpoints: 50 requests per 5 minutes (10 req/min)
- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

## Frontend Deployment (Vercel/Netlify)

### 1. Environment Variables
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_DISABLE_POLLING=false
NODE_ENV=production
```

### 2. Build Settings
- Build Command: `npm run build`
- Output Directory: `.next`
- Node Version: 18.x

## 🔧 Polling Configuration

### Current Settings (Production-Safe)
- Dashboard polling: **5 minutes** (300,000ms)
- Screen status: **5 minutes** (300,000ms)
- All other polling: **5 minutes** (300,000ms)

### Circuit Breaker Protection
- Any 429 rate limit error **completely stops** that poller
- Max 3 retry attempts before permanent shutdown
- Minimum 2-minute delays between retries

## 🚨 Emergency Polling Disable

If you need to completely disable polling:

1. Set environment variable: `NEXT_PUBLIC_DISABLE_POLLING=true`
2. Redeploy frontend
3. All polling will be disabled globally

## 📊 Expected Request Volume

With current settings:
- **Maximum**: ~12 requests per minute per user
- **Typical**: ~6 requests per minute per user
- **Free tier limit**: Usually 100-500 requests per hour

## 🔍 Monitoring

Monitor your Render dashboard for:
- Request volume
- Response times
- Error rates (especially 429s)

If you see consistent 429 errors, increase polling intervals further or enable the emergency disable.

## 🛠️ Troubleshooting

### High Request Volume
1. Check for multiple browser tabs
2. Clear browser cache (Ctrl+Shift+Delete)
3. Increase polling intervals in code
4. Enable emergency disable

### Rate Limit Errors
1. Circuit breakers should stop polling automatically
2. Check Render logs for error patterns
3. Consider upgrading to paid tier for higher limits

## 📈 Scaling Recommendations

For production with multiple users:
1. Upgrade to Render paid tier
2. Implement WebSocket connections instead of polling
3. Add Redis for rate limiting
4. Use CDN for static assets