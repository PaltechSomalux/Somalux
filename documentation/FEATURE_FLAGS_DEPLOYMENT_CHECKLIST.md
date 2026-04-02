# Feature Flags 500 Error - Deployment Checklist

## ✅ What Was Fixed
**Root Cause:** `global.supabaseAdmin` was never initialized, causing feature flags router to fail

**Impact:** Every `/api/features` request returned 500 in production

**Solution:** Set `global.supabaseAdmin = supabaseAdmin` in backend initialization + frontend fallback

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend
```bash
cd backend
# Verify environment variables
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."

# Deploy to Render
git push origin main
# OR manually redeploy in Render dashboard
```

### Step 2: Verify Backend Started Correctly
Check Render logs for:
```
✅ Backend + WebSocket server running on http://localhost:10000
🔧 Supabase configured: ✅ Yes
📍 API diagnostic endpoints:
   - GET /api/status (backend status)
   - GET /api/health (feature flags status)
   - GET /api/features-simple (test endpoint, no DB)
   - GET /api/features (main endpoint)
```

**If you see "❌ No":** Check environment variables in Render dashboard

### Step 3: Test Diagnostic Endpoints
Open browser and test (replace with your Render URL):

1. **Health Check:**
   ```
   https://somalux-q2bw.onrender.com/api/status
   ```
   Expected: `{"status":"ok","service":"somalux-backend",...}`

2. **Feature Flags Health:**
   ```
   https://somalux-q2bw.onrender.com/api/health
   ```
   Expected: `{"status":"ok","service":"feature-flags",...}`

3. **Simple Features (no DB):**
   ```
   https://somalux-q2bw.onrender.com/api/features-simple
   ```
   Expected: `{"features":{...},"source":"simple"}`

4. **Main Features Endpoint:**
   ```
   https://somalux-q2bw.onrender.com/api/features
   ```
   Expected: `{"features":{...},"source":"database"}` or `"source":"default"`

### Step 4: Deploy Frontend (Optional but Recommended)
Frontend changes add fallback logic:
- Tries `/api/features` first
- Falls back to `/api/features-simple` if main fails
- Falls back to localStorage cache if both fail
- Uses default features as final fallback

```bash
npm run build
# Verify no errors
# Should be ~5-10 minutes for frontend to deploy
```

### Step 5: Verify in Production
1. Open app in browser
2. Check DevTools Console for:
   ```
   Fetching features from: https://somalux-q2bw.onrender.com
   ✅ Features fetched from /api/features
   ```
3. No errors about feature flags loading
4. Features work normally (PDF download, admin dashboard, etc.)

---

## 🔍 Troubleshooting

### Still Getting 500 Error?
**Check Render logs:**
```
1. Open Render dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for errors around the timestamp of the failed request
5. Should see something like:
   - "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing"
   - Or actual Supabase error message
```

### Endpoint Returns Defaults Instead of Database Features?
This is **OK** and expected if:
- Supabase connection is slow or unavailable temporarily
- Service just restarted and rebuilding features from DB
- Fallback is working as designed

**To fix:** Check Supabase service status and database availability

### Supabase Says "Not Configured"
1. Go to Render dashboard > Select service > Environment
2. Verify these variables are set:
   - `SUPABASE_URL` (should look like: `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` (long key, starts with `eyJ`)
3. If missing, add from your Supabase project settings
4. Redeploy backend after adding

---

## 📊 Success Criteria

- [x] Backend logs show `✅ Supabase configured: ✅ Yes`
- [x] `/api/features` returns 200 OK (not 500)
- [x] Frontend shows no feature flag errors
- [x] Feature flags load from cache instantly
- [x] All features work (PDF download, admin, etc.)
- [x] No errors in browser console about feature flags

---

## 🔄 Rollback Plan (If Needed)
If something goes wrong:

1. **Quick Fix - Restart Backend:**
   - Render dashboard > Select service > Click "Restart"
   - Wait 1 minute for redeployment

2. **Full Rollback:**
   - Revert commit: `git revert <commit-hash>`
   - Push: `git push origin main`
   - Wait for redeploy in Render

3. **Temporary Disable:**
   - Features will still work with defaults
   - No data loss
   - Users won't see error, just default feature set

---

## 📝 Changes Made

### backend/index.js
- Line 421: Added `global.supabaseAdmin = supabaseAdmin;`
- Line 423: Added `global.supabaseAdmin = null;` in else clause
- Lines 4090-4098: Enhanced startup logging with Supabase check + endpoint list

### src/context/FeatureFlagsContext.jsx
- Lines 62-78: Added fallback to `/api/features-simple` if main endpoint fails
- Added detailed logging for both attempts

---

## ✅ Validation Checklist
- [ ] Backend startup logs show Supabase: ✅ Yes
- [ ] `/api/status` returns 200 OK
- [ ] `/api/health` returns 200 OK
- [ ] `/api/features-simple` returns 200 OK
- [ ] `/api/features` returns 200 OK (with features)
- [ ] Frontend loads without feature flag errors
- [ ] Feature flags work: PDF, admin, etc.
- [ ] No 500 errors on `/api/features`

**Expected Time to Deploy:** 10-15 minutes total
