# 🧪 Ad Metrics Testing Guide

## Quick Start Test (5 minutes)

### 1. Create a Test Ad
```
Go to: Books Admin → Ads Management
- Title: "Test Ad"
- Image: Upload any image (auto-fills as /ads/image.jpg)
- Click URL: https://google.com
- Placement: homepage
- Countdown: 10 seconds
- Skippable: Yes
Submit ✓
```

### 2. View the Ad
```
Go to: Books main page (should see full-screen ad)
Look for:
- ✅ Full-screen overlay
- ✅ Image loaded
- ✅ Countdown timer (10s)
- ✅ Close (X) button
- ✅ Ad label
```

### 3. Check Backend Logs
Open terminal where backend is running:
```
Look for logs like:
📊 [IMPRESSION] Ad ID: xxx Placement: homepage Device: desktop
✅ [IMPRESSION] Updated count to: 1
```

### 4. Test Interactions

**Test A - Just View (Don't interact):**
- Ad appears → Let countdown expire → Should disappear after 10 seconds
- Check logs: Should see 1 IMPRESSION

**Test B - Click Ad:**
- Ad appears → Click on image
- Check logs: Should see IMPRESSION + CLICK
- New tab opens to Google

**Test C - Dismiss Ad:**
- Ad appears → Click X button → Ad disappears
- Check logs: Should see IMPRESSION + DISMISS

### 5. Check Admin Dashboard
```
Go to: Books Admin → Ad Analytics
- Select your "Test Ad" from dropdown
- Should show:
  - Impressions: 3 (from tests A+B+C)
  - Clicks: 1 (from test B)
  - Dismisses: 1 (from test C)
  - CTR: 33.33% (1 click / 3 impressions)
  - Device Breakdown: Should show desktop (3)
```

---

## Expected Metrics Output

### Scenario: 10 ad impressions, 3 clicks, 2 dismisses

**Dashboard should show:**
```
Impressions: 10
Clicks: 3
Dismisses: 2
CTR: 30% (3/10)
Dismiss Rate: 20% (2/10)
Avg View Duration: ~5s (average time before interaction)
Device Breakdown:
  - Desktop: 7 (70%)
  - Mobile: 2 (20%)
  - Tablet: 1 (10%)
```

---

## Backend Logs Example

```
📊 [IMPRESSION] Ad ID: 550e8400-e29b-41d4-a716-446655440000 Placement: homepage Device: desktop
✅ [IMPRESSION] Updated count to: 1

(user waits 3 seconds, then clicks)

🖱️ [CLICK] Ad ID: 550e8400-e29b-41d4-a716-446655440000 Placement: homepage Device: desktop Duration: 3s
✅ [CLICK] Updated count to: 1

(next user views and dismisses)

📊 [IMPRESSION] Ad ID: 550e8400-e29b-41d4-a716-446655440000 Placement: homepage Device: mobile
✅ [IMPRESSION] Updated count to: 2

❌ [DISMISS] Ad ID: 550e8400-e29b-41d4-a716-446655440000 Placement: homepage Device: mobile Duration: 2s
✅ [DISMISS] Updated count to: 1
```

---

## Database Verification

### Check if data is being saved:

**1. View ad_analytics table:**
```sql
SELECT * FROM ad_analytics 
WHERE ad_id = 'YOUR_AD_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```
Should show multiple rows with event_type: 'impression', 'click', 'dismiss'

**2. Check ad totals:**
```sql
SELECT id, title, total_impressions, total_clicks, total_dismisses 
FROM ads 
WHERE id = 'YOUR_AD_ID';
```
Should show: impressions > 0, clicks updated, dismisses updated

**3. Check device breakdown:**
```sql
SELECT device_type, COUNT(*) as count 
FROM ad_analytics 
WHERE ad_id = 'YOUR_AD_ID' 
GROUP BY device_type;
```
Should show mobile/tablet/desktop breakdown

---

## Common Issues & Fixes

### Issue: Backend logs show no impression logged
**Solution:**
1. Check browser console for errors
2. Verify ad exists in database: `SELECT * FROM ads LIMIT 1;`
3. Check placement matches: `SELECT placement FROM ads;`
4. Verify backend is running on localhost:5000

### Issue: Metrics show 0 everywhere
**Solution:**
1. Did you create the ad? Check: `SELECT COUNT(*) FROM ads;`
2. Is the ad active? Check: `SELECT is_active FROM ads WHERE id = 'xxx';`
3. Check if ad_analytics table exists: `SELECT * FROM ad_analytics LIMIT 1;`

### Issue: Dashboard shows impressions but clicks are 0
**Solution:**
1. Make sure you're actually clicking the ad image
2. Check click URL is set correctly
3. Look for console errors in admin dashboard

### Issue: Device shows 'unknown'
**Solution:**
1. Check userAgent is being sent: Look at backend logs
2. Verify getDeviceType() function in AdBanner.jsx
3. Test on actual mobile device (not just browser emulation)

---

## Performance Metrics

**Expected response times:**
- Impression log: < 200ms
- Click log: < 200ms  
- Dismiss log: < 200ms
- Analytics fetch: < 500ms
- Dashboard load: < 1s

**If slower:**
- Check database query performance
- Verify Supabase connection is stable
- Check browser network tab for bottlenecks

---

## Test Checklist

- [ ] Ad displays as full-screen overlay
- [ ] Impression is logged when ad loads
- [ ] Click is logged when image is clicked
- [ ] Dismiss is logged when X button is clicked
- [ ] Countdown timer counts down correctly
- [ ] Ad auto-closes after countdown expires
- [ ] Click opens new tab to URL
- [ ] Backend logs show all events
- [ ] Admin dashboard displays correct metrics
- [ ] CTR calculation is correct
- [ ] Device breakdown is shown
- [ ] Multiple ads show in dropdown
- [ ] Can filter by different ads
- [ ] Date range filters work

---

**Status:** ✅ All metrics functionality complete and tested  
**Last Updated:** December 6, 2025
