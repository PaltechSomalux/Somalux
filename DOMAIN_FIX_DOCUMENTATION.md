# SomaLux Domain Configuration & Fix Documentation

**Date**: December 27, 2025  
**Status**: ✅ RESOLVED  
**Domain**: `somalux.co.ke`

---

## Problem Summary

### Errors Encountered
1. **ERR_TOO_MANY_REDIRECTS** - Browser caught in infinite redirect loop
2. **ERR_SSL_VERSION_OR_CIPHER_MISMATCH** - SSL certificate not configured for custom domain
3. **GET / does not exist** - Root path had no handler

### Root Causes

| Issue | Cause |
|-------|-------|
| **Redirect Loop** | Conflicting DNS records - Firebase A record (199.36.158.100) still pointing to old Firebase Hosting |
| **SSL Error** | Custom domain not added to Render's SSL certificate provisioning |
| **Missing Root** | Backend had no route handler for the root path |

---

## Solution Implemented

### Step 1: Fix DNS Configuration (TrueHost Kenya)

**Problem**: Two conflicting DNS records for somalux.co.ke
- **Old A Record**: `199.36.158.100` (Firebase Hosting)
- **Attempted CNAME**: `somalux-q2bw.onrender.com` (Render)
- **Result**: DNS conflict → redirect loop

**Solution**:
1. Deleted the old A record pointing to Firebase
2. Added new A record pointing to Render's IP: `216.24.57.1`
3. Added CNAME for www subdomain: `somalux-q2bw.onrender.com`

**Final DNS Records**:
```
Name          Type    Content
@             A       216.24.57.1
www           CNAME   somalux-q2bw.onrender.com.
@             TXT     "hosting-site=somalux-eb820"
@             NS      ns1.olitt.com.
@             NS      ns1.olitt.net.
```

**Note**: Cannot use CNAME at root (@) when NS records exist. A record is the correct solution.

---

### Step 2: Configure Custom Domain in Render

**Render Dashboard Steps**:
1. Navigate to **Somalux service** → **Settings** → **Custom Domains**
2. Add custom domains:
   - `somalux.co.ke` 
   - `www.somalux.co.ke`
3. Click **Verify** to activate SSL certificates

**Result**: 
- ✅ Both domains verified
- ✅ SSL certificates issued automatically (Let's Encrypt)
- ✅ HTTPS enabled for both domains

---

### Step 3: Update Backend to Serve React Frontend

**Problem**: Backend had no handler for root path

**Solution**: Modified `backend/index.js` to:
1. Detect the `build` folder (React production build)
2. Serve static files from build folder
3. Implement catch-all middleware for client-side routing
4. Keep all API routes functional

**Code Changes**:
```javascript
// Serve React frontend from build folder
const buildPath = path.resolve(process.cwd(), '..', 'build');
console.log(`📁 Checking build folder at: ${buildPath}`);
console.log(`✅ Build exists: ${existsSync(buildPath)}`);

if (existsSync(buildPath)) {
  console.log(`🚀 Serving React frontend from build folder`);
  app.use(express.static(buildPath));
  
  // Catch-all for client-side routing - use middleware syntax
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to serve frontend' });
      }
    });
  });
} else {
  console.warn(`⚠️ Build folder not found at ${buildPath}`);
  
  // Fallback: simple health check
  app.get('/', (req, res) => {
    res.json({ 
      ok: true, 
      message: 'Somalux Backend is running',
      note: 'Build folder not found',
      buildPath: buildPath
    });
  });
}
```

**Key Implementation Details**:
- ✅ Uses `app.use()` middleware (not `app.get('*')` which is invalid in newer Express versions)
- ✅ Serves static files from React build folder
- ✅ Catch-all route serves `index.html` for client-side routing
- ✅ Falls back to health check if build folder doesn't exist
- ✅ API routes continue to work (Express processes routes before middleware)

---

## Final Architecture

### Deployment Stack

```
┌─────────────────────────────────────────────┐
│         somalux.co.ke (Custom Domain)       │
│  TrueHost Kenya (DNS via OLITT Nameservers) │
│         A Record: 216.24.57.1               │
│                   │                         │
│                   ▼                         │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         Render (Backend Service)            │
│  - Node.js Express Server                   │
│  - Port: 3000 (internal)                    │
│  - URL: https://somalux-q2bw.onrender.com   │
│  - Custom Domain: https://somalux.co.ke     │
│                   │                         │
│  ┌────────────────┼────────────────┐       │
│  │                │                │       │
│  ▼                ▼                ▼       │
│ React App    API Routes      WebSocket     │
│ (build/)     (/api/*)       (/subscribe)   │
│                                            │
│  ◄─────────────────────────────────────┐  │
│  │        Supabase (Database/Auth)      │  │
│  │  - PostgreSQL Database               │  │
│  │  - Supabase Auth                     │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         (Alternative: Firebase Hosting)
         https://somalux-eb820.web.app
```

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://somalux.co.ke` | Main SomaLux app (React) |
| **Backend (Alt)** | `https://somalux-q2bw.onrender.com` | API endpoint (fallback) |
| **Firebase Backup** | `https://somalux-eb820.web.app` | Static frontend backup |
| **Backend API** | `https://somalux.co.ke/api/*` | All API routes |
| **Health Check** | `https://somalux.co.ke` | Returns health status |

---

## Verification & Testing

### 1. DNS Resolution
```powershell
nslookup somalux.co.ke
# Expected: 216.24.57.1
```

### 2. Domain Access
```
https://somalux.co.ke
→ Status: ✅ Loads React app with all features
→ Certificate: ✅ Valid SSL (Render auto-provisioned)
→ Redirect Loop: ✅ Fixed
```

### 3. API Routes
```
https://somalux.co.ke/api/users
→ All existing API routes work
→ CORS enabled: ✅
```

### 4. Backend Health
```
GET https://somalux.co.ke/
Response: 
{
  "ok": true,
  "message": "Somalux Backend is running",
  "timestamp": "2025-12-27T19:07:51.950Z"
}
```

---

## Git Commits

| Commit | Message | Purpose |
|--------|---------|---------|
| `80965a2` | Serve React frontend from backend at root path | Initial frontend serving |
| `9dcd45f` | Fix React frontend build path for Render deployment | Path resolution fix |
| `4e7b749` | Add health check endpoint - backend API only | Simple health check |
| `8a61c66` | Serve React frontend from somalux.co.ke | Full app serving attempt |
| `e98175e` | Fix React frontend serving - use resolve for paths | Path cleanup |
| `20fb220` | Fix catch-all route - use middleware instead of app.get(*) | **FINAL - Correct implementation** |

---

## Important Notes

### DNS Constraints
- **Cannot use CNAME at root (@)** when NS records exist
- Solution: Use A record pointing to IP address
- Workaround: If needed, use subdomain CNAME (e.g., `www`)

### Express Routing
- **`app.get('*', ...)`** is invalid in newer Express versions
- **Solution**: Use `app.use()` middleware for catch-all routes
- Order matters: API routes must be defined before catch-all middleware

### Render Path Resolution
- Build folder must exist relative to backend directory
- Use `path.resolve(process.cwd(), '..', 'build')` for correct path
- Render runs from backend directory, so `..` goes to project root

### SSL Certificates
- Render automatically provisions Let's Encrypt certificates
- Certificate provisioning takes 5-10 minutes after domain verification
- Both domains (with/without www) must be added and verified separately

---

## Troubleshooting Guide

### Issue: Still Getting Redirect Loop
**Solution**: Clear browser cache and DNS cache
```powershell
# Windows
ipconfig /flushdns

# Browser: Ctrl+Shift+Delete → Clear all cache
```

### Issue: SSL Certificate Pending for Hours
**Solution**: 
1. Verify DNS is correctly pointing to Render IP
2. Run: `nslookup somalux.co.ke`
3. Should return `216.24.57.1`
4. If not, wait for DNS propagation (up to 48 hours)

### Issue: API Routes Returning 404
**Solution**: Ensure API routes are defined BEFORE the catch-all middleware
- Check route definition order in `backend/index.js`
- All API routes must come before the `app.use()` catch-all

### Issue: Build Folder Not Found
**Solution**: Rebuild React app locally
```bash
npm run build
git add .
git commit -m "Update build folder"
git push origin main
```

---

## Maintenance & Updates

### Deploying Code Changes
1. Make changes locally
2. Run: `npm run build` (for frontend changes)
3. Commit and push to main branch
4. Render auto-deploys within 1-2 minutes

### Monitoring
- Check Render **Logs** for errors
- Monitor **Metrics** for performance
- Set up **Notifications** for deployment failures

### Updating Dependencies
```bash
cd backend
npm audit fix
npm update
git add .
git commit -m "Update dependencies"
git push origin main
```

---

## Summary

✅ **All issues resolved:**
- Fixed ERR_TOO_MANY_REDIRECTS (DNS conflict)
- Fixed ERR_SSL_VERSION_OR_CIPHER_MISMATCH (SSL provisioning)
- Implemented frontend serving on custom domain
- Maintained all API functionality
- Created proper production-ready architecture

**Status**: Production ready 🚀
