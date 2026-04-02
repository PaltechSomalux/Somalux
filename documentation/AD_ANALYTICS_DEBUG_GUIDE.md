# 🔧 Ad Analytics Debugging & Testing Guide

## ✅ What Was Fixed

### 1. **Enhanced Logging Throughout**
- Frontend AdBanner: logs each fetch, impression, click, dismiss
- Backend API: logs each request, database operations, counts
- Admin Dashboard: logs analytics fetches and data received

### 2. **Improved Error Handling**
- Better error messages in console
- Validation of required fields (adId, placement)
- Graceful fallbacks if tables don't exist

### 3. **Direct Database Updates** 
- Removed unreliable RPC functions
- Using direct SQL SELECT → UPDATE pattern
- Ensures counters are properly incremented

---

## 🧪 Step-by-Step Testing

### STEP 1: Verify Database Tables Exist

**In Supabase SQL Editor, run:**
```sql
-- Check if ads table exists and has data
SELECT COUNT(*) as total_ads FROM ads;
SELECT id, title, placement, is_active FROM ads LIMIT 5;

-- Check if ad_analytics table exists
SELECT COUNT(*) as total_events FROM ad_analytics;
SELECT event_type, COUNT(*) FROM ad_analytics GROUP BY event_type;

-- Check table structure
\d ads;
\d ad_analytics;
```

**Expected results:**
- ads table exists with columns: id, title, placement, total_impressions, total_clicks, total_dismisses
- ad_analytics table exists with columns: ad_id, event_type, device_type, view_duration

### STEP 2: Check Backend is Running

**Terminal output should show:**
```
✅ Backend + WebSocket server running on http://localhost:5000
```

If not, restart backend:
```powershell
cd d:\Work\SomaLux\backend
node index.js
```

### STEP 3: Create a Test Ad

1. Go to **Books Admin → Ads Management**
2. Click **+ Add New Ad**
3. Fill in:
   - **Title:** "Test Analytics Ad"
   - **Image:** Upload any image
   - **Click URL:** https://google.com
   - **Placement:** `homepage` (important - must match later)
   - **Countdown:** 10 seconds
   - **Skippable:** Yes
4. Click **Submit**

### STEP 4: Open Browser DevTools

1. Open your app: http://localhost:3000 (or your dev server)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Clear console: `console.clear()`

### STEP 5: Verify Ads Fetch

1. Navigate to **Books** page (where ad should display)
2. Look in console for:
   ```
   🔍 [AdBanner] Fetching ads for placement: homepage
   ```

3. Should see response:
   ```
   ✅ [AdBanner] Ads fetched: [{...ad object with title, id, placement...}]
   📺 [AdBanner] Ad loaded - Title: Test Analytics Ad Duration: 10
   ```

**If you see "No ads available":**
- Check placement matches: must be "homepage" not "Homepage"
- Check is_active = true in database
- Check ad exists in database

### STEP 6: Verify Impression Logging

1. Wait for ad to appear (full screen)
2. Look in console for:
   ```
   📊 [Impression] Sending: {adId: "xxx...", placement: "homepage", ...}
   ✅ [Impression] Response: {success: true, message: "Impression logged"}
   ```

3. In backend terminal, should see:
   ```
   📊 [IMPRESSION] Ad ID: xxx Placement: homepage Device: desktop
   ✅ [IMPRESSION] Updated count to: 1
   ```

**If impression not logging:**
- Check browser console for errors
- Check backend logs for errors
- Verify ad_analytics table exists
- Check database connection

### STEP 7: Verify Click Logging

1. Click on the ad image
2. Look in console for:
   ```
   🖱️ [Click] Sending: {adId: "xxx...", viewDuration: 3, ...}
   ✅ [Click] Response: {success: true, message: "Click logged"}
   ```

3. In backend terminal:
   ```
   🖱️ [CLICK] Ad ID: xxx Placement: homepage Device: desktop Duration: 3s
   ✅ [CLICK] Updated count to: 1
   ```

4. New tab should open to google.com

### STEP 8: Verify Dismiss Logging

1. Refresh page to see ad again
2. Click **X** button to close
3. Look in console for:
   ```
   ❌ [Dismiss] Sending: {adId: "xxx...", viewDuration: 2, ...}
   ✅ [Dismiss] Response: {success: true, message: "Dismiss logged"}
   ```

4. In backend terminal:
   ```
   ❌ [DISMISS] Ad ID: xxx Placement: homepage Device: desktop Duration: 2s
   ✅ [DISMISS] Updated count to: 1
   ```

### STEP 9: Verify Analytics Dashboard

1. Go to **Books Admin → Ad Analytics**
2. In browser console, should see:
   ```
   📊 [Analytics] Fetching all ads...
   ✅ [Analytics] Ads fetched: [{title: "Test Analytics Ad", total_impressions: 1, ...}]
   ```

3. In backend terminal:
   ```
   📊 [GET /admin/analytics/all] Fetching all ads with metrics...
   ✅ [GET /admin/analytics/all] Found 1 ads
   ```

4. **Ad should appear in dropdown:**
   - Select "Test Analytics Ad"
   - Should show:
     - Impressions: 1
     - Clicks: 1
     - Dismisses: 1
     - CTR: 100% (1 click / 1 impression)

5. In console should see:
   ```
   📈 [Analytics] Fetching detailed metrics for ad: xxx
   ✅ [Analytics] Metrics received: {metrics: {impressions: 1, clicks: 1, ...}}
   ```

---

## 🔍 Troubleshooting

### Issue: "No ads available" on page

**Solution:**
1. Verify ad exists: `SELECT * FROM ads WHERE placement = 'homepage';`
2. Check is_active: `SELECT is_active FROM ads WHERE id = 'xxx';`
3. Verify table exists: `SELECT * FROM ads LIMIT 1;`
4. Check backend logs for error message

### Issue: Impression not logging

**Checklist:**
- [ ] Ad fetches successfully ("Ad loaded" message in console)
- [ ] logImpression function is called
- [ ] Backend receives POST /api/ad-impression request
- [ ] ad_analytics table exists in database
- [ ] No errors in backend logs

**Debug:**
```javascript
// Add to AdBanner.jsx temporarily
console.log('About to log impression for ad:', adId);
console.log('Supabase connection:', supabaseAdmin !== null);
```

### Issue: Dashboard shows 0 metrics

**Checklist:**
- [ ] Impression was logged (check database)
- [ ] Ad analytics/all endpoint returns ads
- [ ] ad_analytics table has events
- [ ] No SQL errors in backend logs

**Debug query:**
```sql
-- Verify events are saved
SELECT * FROM ad_analytics WHERE ad_id = 'YOUR_AD_ID' ORDER BY created_at DESC LIMIT 10;

-- Verify counters updated
SELECT id, title, total_impressions, total_clicks FROM ads WHERE id = 'YOUR_AD_ID';
```

### Issue: Device type shows "unknown"

**Solution:**
- getDeviceType() function should work in desktop/mobile browsers
- If always unknown, check userAgent is being sent
- Try on actual mobile device

### Issue: View duration always 0

**Solution:**
- startTimeRef is set when impression logged
- Duration calculated on click/dismiss
- If always 0, check time between impression and interaction > 1 second

---

## 📊 Expected Data Flow

```
1. Ad Displays
   ↓
   Frontend: logs impression → POST /api/ad-impression
   ↓
   Backend: inserts to ad_analytics, updates ads.total_impressions += 1
   ↓
   Database: 1 row in ad_analytics (event_type='impression'), ads.total_impressions=1

2. User Clicks
   ↓
   Frontend: logs click → POST /api/ad-click
   ↓
   Backend: inserts to ad_analytics, updates ads.total_clicks += 1
   ↓
   Database: 2 rows in ad_analytics (1 impression, 1 click), ads.total_clicks=1

3. Admin Views Dashboard
   ↓
   Frontend: fetches /api/admin/analytics/all
   ↓
   Backend: SELECT from ads table, calculates CTR = 1/1 * 100 = 100%
   ↓
   Dashboard: Shows Impressions: 1, Clicks: 1, CTR: 100%
```

---

## 🎯 Complete Test Sequence

```bash
# 1. Backend running?
✅ See "Backend running on http://localhost:5000"

# 2. Database has ads table?
SELECT COUNT(*) FROM ads;  # Should return > 0

# 3. Frontend fetches ad?
Navigate to page, see "Ad loaded" in console

# 4. Impression logged?
See "✅ [IMPRESSION] Updated count to: 1" in backend

# 5. Analytics dashboard works?
Go to Admin → Ad Analytics, see metrics

# 6. All metrics correct?
impressions=1, clicks=1, CTR=100%
```

---

## 📋 Console Log Reference

**Frontend Logs (Browser Console):**
```
🔍 [AdBanner] Fetching ads for placement: XXX
✅ [AdBanner] Ads fetched: [...]
📺 [AdBanner] Ad loaded - Title: XXX Duration: 10
📊 [Impression] Sending: {...}
✅ [Impression] Response: {success: true}
🖱️ [Click] Sending: {...}
✅ [Click] Response: {success: true}
❌ [Dismiss] Sending: {...}
✅ [Dismiss] Response: {success: true}
📊 [Analytics] Fetching all ads...
✅ [Analytics] Ads fetched: [...]
📈 [Analytics] Fetching detailed metrics for ad: XXX
✅ [Analytics] Metrics received: {...}
```

**Backend Logs (Terminal):**
```
🔍 [GET /api/ads/XXX] Fetching ads - limit: 1
✅ [GET /api/ads/XXX] Found 1 ads
📊 [IMPRESSION] Ad ID: xxx Device: desktop
✅ [IMPRESSION] Updated count to: 1
🖱️ [CLICK] Ad ID: xxx Device: desktop Duration: 3s
✅ [CLICK] Updated count to: 1
❌ [DISMISS] Ad ID: xxx Device: desktop Duration: 2s
✅ [DISMISS] Updated count to: 1
📊 [GET /admin/analytics/all] Fetching all ads...
✅ [GET /admin/analytics/all] Found 1 ads
📈 [GET /admin/analytics/XXX] Fetching metrics...
✅ [GET /admin/analytics/XXX] Found 3 events
```

---

## 🚀 Next Steps After Verification

1. **Monitor Logs While Testing**
   - Keep backend terminal visible
   - Keep browser DevTools console open
   - Cross-reference frontend and backend logs

2. **Test Multiple Ads**
   - Create ads with different placements
   - Test on different pages
   - Verify device type detection

3. **Performance Check**
   - Each API call should respond < 200ms
   - Analytics fetch < 500ms
   - Dashboard load < 1s

4. **Production Ready Checklist**
   - [ ] All metrics logging correctly
   - [ ] No console errors
   - [ ] Analytics dashboard working
   - [ ] Database contains all event data
   - [ ] CTR/dismissal rate calculations correct

---

**Status:** ✅ All logging enhanced, ready for testing  
**Last Updated:** December 6, 2025
