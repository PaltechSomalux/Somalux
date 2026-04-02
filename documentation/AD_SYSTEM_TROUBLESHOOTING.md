# Ad System - Troubleshooting Guide

## Error: "Failed to fetch ads" or 404

### Cause 1: Backend Not Running
```
Error: GET http://localhost:5000/api/admin/ads/all - 404 Not Found
```

**Check:**
```powershell
netstat -ano | findstr "5000"
```

**If no result:**
- Backend is NOT running
- Go to `backend/` folder
- Run: `node index.js`

**If listening:**
- Backend is running
- Problem is elsewhere (see other causes)

---

### Cause 2: Database Tables Don't Exist

```
Error: relation "ads" does not exist
```

**Fix:**
1. Open Supabase SQL Editor
2. Copy contents of: `backend/migrations/012_enhanced_ad_analytics.sql`
3. Paste and execute in Supabase
4. Refresh browser

---

### Cause 3: Wrong Environment Variables

```
Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing
```

**Check `backend/index.js` and `backend/routes/adsApi.js`:**
```javascript
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);
```

**Fix:**
1. Create `.env` file in `backend/` folder:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
2. Restart backend: `node index.js`

---

## Error: "Image not loading" or "Not allowed to load local resource"

### ✅ Correct: Use HTTP(S) URLs

```javascript
✅ https://example.com/image.jpg
✅ http://localhost:5000/ads/image.jpg
✅ /ads/image.jpg
```

### ❌ Incorrect: Local file paths

```javascript
❌ file:///D:/Aerospace/ars.jpg
❌ C:\Users\YourName\image.jpg
❌ file://localhost/image.jpg
```

**Why:** Browser security blocks local file access.

**Solution:** See `AD_IMAGE_SETUP.md` for image hosting options

---

## Error: "Countdown not displaying"

### Check 1: CSS Loaded
- Open DevTools (F12)
- Go to Elements tab
- Look for `.ad-countdown` element
- If not visible, CSS didn't load

**Fix:** Clear browser cache (Ctrl+Shift+Delete)

### Check 2: Ad Returned from Backend
- Open DevTools → Network tab
- Trigger ad display
- Look for `/api/ads/:placement` request
- Check response has `countdown_seconds` field

**If missing:**
```json
{
  "success": true,
  "data": [{
    "id": 1,
    "title": "Test Ad",
    "countdown_seconds": 10,  // ← Should be here
    "is_skippable": true
  }]
}
```

### Check 3: Component Mounting
- Console should show no errors
- Ad container should appear
- If error: check AdBanner.jsx imports

---

## Error: "Form won't submit" or "Ad not saving"

### Check 1: Required Fields
All marked with `*` are required:
```
✓ Title (required)
✓ Image URL (required) - must be HTTP(S) or /ads/
✓ Placement (required)
○ Click URL (optional)
○ Start Date (optional)
○ End Date (optional)
○ Countdown (default: 10)
○ Skippable (default: Yes)
```

### Check 2: Image URL Format
- Must start with `http://` or `https://`
- Cannot be local file path
- Must be accessible from browser

**Valid examples:**
```
✅ https://example.com/ad.jpg
✅ https://imgur.com/abc123.jpg
✅ http://localhost:5000/ads/banner.jpg
```

### Check 3: Server Response
- Open DevTools → Network tab
- Click "Save Ad"
- Look for POST `/api/admin/ads`
- Check response status: 200 = success, 400+ = error

**If 500 error:** Check backend console for detailed error

---

## Error: Analytics Empty or Not Updating

### Check 1: Ad Has Events
- Go to analytics dashboard
- Select an ad
- Wait a few seconds
- Refresh page

**If still empty:**
- Create a new ad
- Display it on a page with `<AdBanner />`
- View the ad (triggers impression)
- Click or dismiss
- Refresh analytics

### Check 2: Events Table Exists
In Supabase SQL:
```sql
SELECT COUNT(*) FROM ad_analytics;
```

Should return a number > 0 if events logged.

If 0 or error:
- Run migration: `012_enhanced_ad_analytics.sql`

### Check 3: Date Range
- Default range: Last 30 days
- Adjust if ad is older
- Click "Refresh" after changing dates

---

## Common Fixes Checklist

```
□ Backend running?
  → netstat -ano | findstr "5000"
  
□ Database migration executed?
  → Check Supabase for ad_analytics table
  
□ Image URL valid?
  → Must be HTTP(S), not file://
  
□ Environment variables set?
  → Check .env file in backend folder
  
□ Browser console clean?
  → F12 → Check for red errors
  
□ Port 5000 available?
  → taskkill /F /IM node.exe
  → Restart backend
```

---

## Debug Steps

### Step 1: Check Backend Health
```powershell
# Test if backend responds
curl http://localhost:5000/api/ads/homepage
```

Should return:
```json
{"success": true, "data": [...]}
```

### Step 2: Check Supabase Connection
In backend console, should see:
```
Supabase initialized successfully
Listening on port 5000
```

### Step 3: Check Frontend Logs
- Open DevTools (F12)
- Console tab
- Look for error messages
- Common: "Failed to fetch ads"

### Step 4: Verify Database Schema
In Supabase SQL:
```sql
-- Check ads table
SELECT * FROM ads LIMIT 1;

-- Check analytics table
SELECT * FROM ad_analytics LIMIT 1;

-- Check both exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Reset / Start Over

If things are broken:

### Option 1: Restart Backend
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Go to backend folder
cd backend

# Start again
node index.js
```

### Option 2: Clear Browser Cache
```
Ctrl + Shift + Delete
→ Select "All time"
→ Check "Cookies" and "Cached images"
→ Clear
```

### Option 3: Fresh Database
In Supabase SQL:
```sql
-- Delete all ad data
DELETE FROM ad_analytics;
DELETE FROM ads;

-- Then run migration again
-- 012_enhanced_ad_analytics.sql
```

### Option 4: Clear Local Storage
DevTools → Application → Local Storage → Clear All

---

## Getting Help

### Provide This Information:

1. **Error message** (copy-paste exact text)
2. **Browser console errors** (F12 → Console)
3. **Backend logs** (terminal output)
4. **What you tried** before error occurred
5. **Screenshot** if visual issue

### Where to Check:

| Issue | Check | How |
|-------|-------|-----|
| Endpoint 404 | Backend logs | Terminal output |
| Image not showing | Browser console | F12 → Console |
| DB connection | Backend console | Terminal output |
| Form not submitting | Network tab | F12 → Network tab |
| Analytics empty | SQL query | Supabase SQL editor |

---

## Performance Tips

### Slow Ads Loading?
- Images too large: Compress to <200KB
- Too many ads: Limit to 3-5 per page
- Database slow: Add index (already done)

### Analytics Dashboard Slow?
- Too much data: Reduce date range
- Too many ads: Filter by placement
- DB slow: Check for missing indexes

### Improve Performance:
```sql
-- Already included in migration:
CREATE INDEX idx_ad_analytics_ad_id ON ad_analytics(ad_id);
CREATE INDEX idx_ad_analytics_event ON ad_analytics(event_type);
CREATE INDEX idx_ad_analytics_date ON ad_analytics(created_at DESC);
```

---

## Still Stuck?

Check these in order:
1. Is backend running? (port 5000 listening)
2. Is database migration applied? (ad_analytics table exists)
3. Are image URLs HTTP(S)? (not file://)
4. Do you have Supabase credentials? (.env file)
5. Browser cache cleared? (Ctrl+Shift+Delete)

If all ✓ but still failing:
- Check exact error message in browser console
- Look at backend terminal for detailed logs
- Verify Supabase query with SQL editor
