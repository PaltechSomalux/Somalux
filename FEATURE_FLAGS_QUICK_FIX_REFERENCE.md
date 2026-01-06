# ⚡ Quick Reference: Feature Flags 500 Error Fix

## The Issue
```
❌ GET /api/features → 500 Internal Server Error
```

## The Fix
```javascript
// backend/index.js line 421
global.supabaseAdmin = supabaseAdmin; // ← This was missing!
```

## Why It Works
**Before:** Feature flags router couldn't access Supabase client (undefined)
**After:** Router can access Supabase client (properly initialized)

---

## Test It

### 1. Check Backend Startup (Look for this in logs)
```
🔧 Supabase configured: ✅ Yes
```

### 2. Test Endpoint (In browser)
```
https://somalux-q2bw.onrender.com/api/features
```
Should return: **HTTP 200** (not 500)

### 3. Check Frontend Console
```
✅ Features fetched from /api/features
```
(Or `/api/features-simple` if fallback triggered)

---

## Deploy

```bash
git push origin main  # Auto-deploys to Render
# Wait 2-3 minutes for backend to restart
# Check logs: "Supabase configured: ✅ Yes"
```

---

## If Still Broken

### Check 1: Environment Variables
```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```
Both must be set in Render > Environment

### Check 2: Backend Logs
```
❌ Supabase configured: ❌ No
→ Environment variables missing
```

### Check 3: Test Endpoints
```bash
curl https://somalux-q2bw.onrender.com/api/status          # Should work
curl https://somalux-q2bw.onrender.com/api/features-simple # Should work
curl https://somalux-q2bw.onrender.com/api/features        # Should work now
```

---

## Files Modified
- `backend/index.js` (2 lines added)
- `src/context/FeatureFlagsContext.jsx` (fallback endpoint added)

---

## Expected Results

✅ No more 500 errors
✅ Features load from backend (or fallback)
✅ Feature flags work (PDF, admin, etc.)
✅ App stays responsive even if API fails

**Status: Production Ready** 🚀
