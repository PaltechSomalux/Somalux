# 🔧 Backend Environment Setup - CRITICAL

**Status:** Backend fixed in code, but Render is missing environment variables!

## The Problem

When you pushed to Render, it started the backend BUT Supabase isn't configured because:
- Render doesn't have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Your local `.env` file is NOT deployed to Render
- All database operations fail → 503 errors on ads, messages, user roles

## How to Fix (5 Minutes)

### Step 1: Get Your Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **wuwlnawtuhjoubfkdtgc**
3. Go to **Settings** → **API**
4. Copy these values:
   - **URL:** `https://wuwlnawtuhjoubfkdtgc.supabase.co`
   - **Service Role Key:** (under "Service role secret") - it starts with `eyJhbGc...`

### Step 2: Add to Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select service: **somalux-backend** (somalux-q2bw.onrender.com)
3. Click **Environment**
4. Click **Add Environment Variable**
5. Add these variables:

| Variable Name | Value |
|---|---|
| `SUPABASE_URL` | `https://wuwlnawtuhjoubfkdtgc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (from dashboard) |
| `SUPABASE_ANON_KEY` | Same as `SUPABASE_SERVICE_ROLE_KEY` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

6. Click **Save**
7. **Wait for redeploy** (3-5 minutes)

### Step 3: Verify in Logs

Once deployed, check logs:
1. Go to **Logs** in Render dashboard
2. Look for: `✅ Supabase service-role client initialized`
3. If you see warning `⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing` → variables not set

### Step 4: Test Endpoints

After redeploy, test these in browser:

```
GET https://api.somalux.co.ke/api/status
GET https://api.somalux.co.ke/api/features-simple
GET https://api.somalux.co.ke/api/ads/homepage?limit=1
```

Expected responses:
- `/api/status` → `{"status":"ok","service":"somalux-backend"}`
- `/api/features-simple` → `[{"name":"...","enabled":true}]`
- `/api/ads/homepage` → `{"success":true,"data":[...]}`

---

## Checklist

- [ ] Copied Supabase URL from dashboard
- [ ] Copied Supabase Service Role Key
- [ ] Added env vars to Render dashboard
- [ ] Render service redeployed (check "Latest Deploy" time)
- [ ] Backend logs show "Supabase initialized"
- [ ] Tested `/api/status` endpoint
- [ ] Tested `/api/ads/homepage` endpoint
- [ ] Hard refresh browser: `Ctrl+Shift+Delete`
- [ ] Test ads loading
- [ ] Test messages sending
- [ ] Test user roles loading

---

## If Still Not Working

Run this in terminal to debug:

```bash
# Check if Supabase service is up
curl https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/

# Check if backend is responding
curl https://api.somalux.co.ke/api/status
```

If you get timeouts on Supabase, then Supabase itself may be down.

---

## Important Files Reference

- **Backend:** `backend/index.js` (lines 586-593) - Supabase initialization
- **Frontend Config:** `src/config.js` - Already set to `https://api.somalux.co.ke`
- **Deployment:** Auto-deploys on git push to Render
