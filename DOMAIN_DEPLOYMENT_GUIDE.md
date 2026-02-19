# Domain Deployment Guide: somalux.co.ke

## Problem Summary
Your system was only accessible on `localhost` because:
1. ✅ FIXED: Backend was listening only on `localhost:5000` instead of `0.0.0.0`
2. ✅ FIXED: Frontend config was using hardcoded localhost in development
3. API endpoints weren't accessible from the domain name

## What Was Fixed

### 1. Backend Server Binding (backend/index.js - Line 6947)
**Before:**
```javascript
server = app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
```

**After:**
```javascript
server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Access via: http://localhost:${PORT} or https://somalux.co.ke`);
```

**What this does:** Backend now listens on ALL network interfaces, not just localhost.

---

## Required Domain Configuration

### 2. DNS Setup
Your domain `somalux.co.ke` MUST point to your server:

```
A Record:
  Host: somalux.co.ke (or @)
  Type: A
  Value: YOUR_SERVER_IP_ADDRESS

A Record (API Subdomain):
  Host: api.somalux.co.ke
  Type: A
  Value: YOUR_SERVER_IP_ADDRESS
```

**How to set this up:**
- Go to your domain registrar (e.g., Namecheap, GoDaddy, AWS Route53)
- Navigate to DNS Settings
- Add A records pointing to your server's public IP

### 3. Frontend API Configuration

**Development** (`.env.development`):
```
REACT_APP_API_URL=http://localhost:5000
```

**Production** (`.env.production`):
```
REACT_APP_API_URL=https://api.somalux.co.ke
```

**Default fallback** (`src/config.js`):
```javascript
const defaultApiUrl = isDevelopment ? 'http://localhost:5000' : 'https://api.somalux.co.ke';
```

---

## Backend Port Configuration

The backend needs to be exposed on the correct port:

### Option A: Direct Port (Development)
```bash
cd backend
npm install
node index.js
```
- Runs on default port 5000
- Accessible at: `https://somalux.co.ke:5000/api/...`

### Option B: Production Deployment (Render, Railway, Heroku)
```bash
PORT=443  # or 80 for HTTP
node index.js
```

### Option C: Reverse Proxy (Nginx)
```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name somalux.co.ke api.somalux.co.ke;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Deploying the Frontend

### Build for Production
```bash
npm run build
```

This creates an optimized build that:
- Uses `https://api.somalux.co.ke` from `.env.production`
- Minifies all code
- Optimizes assets for performance

### Serve with Nginx
```nginx
server {
    listen 80;
    server_name somalux.co.ke www.somalux.co.ke;
    root /var/www/somalux/build;
    
    location / {
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Testing Checklist

### 1. Local Testing
```bash
# Terminal 1: Start Backend
cd backend
npm install
node index.js
# Should show: ✅ Backend running on port 5000

# Terminal 2: Start Frontend
npm install
npm start
# Should show: 🔧 API Configuration: ... isDevelopment: true
```

### 2. Test API Connectivity
```bash
# Test backend status
curl http://localhost:5000/api/status
# Response: { "status": "ok", "service": "somalux-backend" }

# Test ads endpoint
curl http://localhost:5000/api/ads/homepage
# Response: { "success": true, "data": [...] }
```

### 3. Production Testing (with domain)
```bash
# Test from another machine
curl https://api.somalux.co.ke/api/status
curl https://somalux.co.ke

# Check browser console for API errors
# Open: https://somalux.co.ke → DevTools → Network tab
# Watch API calls to confirm they use https://api.somalux.co.ke
```

---

## Environment Files Summary

### Root Directory (`.env` - Used by package.json proxy)
```
REACT_APP_API_URL=https://somalux-q2bw.onrender.com  # Fallback for old deployments
```

### Frontend (`.env.development`)
```
PORT=3000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
```

### Frontend (`.env.production`)
```
REACT_APP_API_URL=https://api.somalux.co.ke
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
```

### Backend (`backend/.env`)
```
PORT=5000
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Troubleshooting

### "Failed to load ads"
**Cause:** Frontend can't reach `/api/ads/...` endpoint
**Solution:**
1. Check REACT_APP_API_URL is set correctly
2. Ensure backend is running: `curl http://localhost:5000/api/status`
3. Check browser DevTools → Network tab for failed requests
4. Verify CORS is enabled in backend (it is - `cors: { origin: true }`)

### "Cannot reach somalux.co.ke"
**Cause:** DNS not configured or server IP incorrect
**Solution:**
1. Verify DNS: `nslookup somalux.co.ke`
2. Confirm server IP is correct
3. Check firewall isn't blocking port 80/443
4. Test with IP directly: `curl http://YOUR_SERVER_IP`

### "Backend running but API returns 404"
**Cause:** Backend isn't listening on `0.0.0.0`
**Solution:**
- Already fixed in line 6947 of backend/index.js
- Restart backend for changes to take effect

### "CORS errors in browser"
**Cause:** Frontend and backend on different domains
**Solution:**
- Backend already has: `cors({ origin: true, credentials: true })`
- This allows all origins; configure specific domains in production:
  ```javascript
  cors({
    origin: ['https://somalux.co.ke', 'https://api.somalux.co.ke'],
    credentials: true
  })
  ```

---

## Key Routes Available

Once deployed, these endpoints should work:

```
Frontend:       https://somalux.co.ke
API Health:     https://api.somalux.co.ke/api/status
Ads:            https://api.somalux.co.ke/api/ads/{placement}
Features:       https://api.somalux.co.ke/api/features
Chat Messages:  https://api.somalux.co.ke/api/messages
Email:          https://api.somalux.co.ke/api/admin/notifications
```

---

## Next Steps

1. **Verify DNS is configured** - Contact your domain registrar
2. **Restart backend** - Kill and restart node process
3. **Test locally first** - Before moving to production
4. **Monitor logs** - Watch server output for errors
5. **Test from browser** - Open DevTools and check Network tab

For additional help, check the API diagnostic endpoints:
- `GET /api/status` - Backend status
- `GET /api/health` - Feature flags status
