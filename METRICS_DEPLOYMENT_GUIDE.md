# Daily Active Metrics Fix - Test Plan & Deployment Guide

## Deployment Steps

### Step 1: Deploy Backend Changes
1. Pull latest changes to backend
2. Ensure `backend/index.js` has the new `/api/user/activity` endpoint (lines 227-254)
3. Restart backend server
4. Verify endpoint is accessible: `curl -X POST http://localhost:5000/api/user/activity -H "Content-Type: application/json" -d '{"userId":"test-id"}'`

### Step 2: Deploy Frontend Changes
1. Pull latest changes to frontend
2. Ensure both files are updated:
   - `src/SomaLux/Books/BookPanel.jsx` (activity tracking useEffect after line 1115)
   - `src/SomaLux/PastPapers/Pastpapers.jsx` (activity tracking useEffect after line 475)
3. Run build: `npm run build`
4. Deploy to production

### Step 3: Verify Deployment
1. Open browser developer tools (F12)
2. Go to Network tab
3. Filter for `/api/user/activity`
4. Log in to the app
5. You should see a POST request to `/api/user/activity` immediately
6. Wait 5 minutes
7. Another request should appear automatically

---

## Testing Checklist

### Test 1: Activity Tracking on Login
**Objective**: Verify that `last_active_at` is updated when user logs in

**Steps**:
1. Open browser DevTools → Network tab
2. Clear all users' `last_active_at` in database (optional, for clean test)
3. Log in as a test user
4. Check Network tab for POST `/api/user/activity`
5. In Supabase, query: `SELECT id, email, last_active_at FROM profiles WHERE email = 'test-user@example.com'`

**Expected Result**:
- ✅ POST request appears in Network tab within 1 second
- ✅ Response is `{ ok: true }`
- ✅ `last_active_at` in database shows current timestamp (within last minute)

---

### Test 2: Periodic Activity Updates
**Objective**: Verify that `last_active_at` updates every 5 minutes

**Steps**:
1. Log in as a test user
2. Note the time: `T0`
3. Minimize/switch away from app (but don't log out)
4. Wait exactly 5 minutes: `T0 + 5:00`
5. Return to app and check Network tab
6. After 5 minutes, another `/api/user/activity` POST should appear

**Expected Result**:
- ✅ Second POST request appears after ~5 minutes
- ✅ Timestamp in Network tab shows it's been exactly 5 minutes
- ✅ Database shows `last_active_at` updated to new timestamp

---

### Test 3: Multiple Concurrent Users
**Objective**: Verify metrics work correctly with multiple logged-in users

**Steps**:
1. Open 3 different browser windows/tabs with different users logged in:
   - Window A: User1
   - Window B: User2
   - Window C: User3
2. All three should be actively tracking
3. Go to Admin → Users page
4. Check "Total active now" count

**Expected Result**:
- ✅ All 3 users show with `last_seen: Online`
- ✅ "Total active now" counter shows at least 3
- ✅ All three users' rows show status = "online"

---

### Test 4: "Last Seen" Time Updates
**Objective**: Verify the "last seen" display reflects actual activity

**Steps**:
1. Log in User A at time `T0`
2. Go to Admin → Users page
3. Find User A, note "last seen: now"
4. Log out User A
5. Refresh Users page
6. User A should show "signed_out"

**Expected Result**:
- ✅ Before logout: "last seen: now" or "Online"
- ✅ After logout: Status changes to "signed_out"
- ✅ "last seen" shows deactivation time

---

### Test 5: Online Window Accuracy (5-minute window)
**Objective**: Verify that only users active in last 5 minutes show as "Online"

**Steps**:
1. Log in User A at time `T0`
2. Check Users page → User A shows "Online"
3. Log out User A at time `T0 + 2:00`
4. Wait 4 minutes (until `T0 + 6:00`)
5. Check Users page
6. User A should now show "offline" (since they were inactive for >5 minutes before logout)

**Expected Result**:
- ✅ At `T0 + 2:00`: User A is still "online" (logged out recently)
- ✅ At `T0 + 6:00`: User A becomes "offline" (last activity >5 minutes ago)

---

### Test 6: Daily Active Metrics
**Objective**: Verify daily active count is accurate

**Steps**:
1. Open UsersAnalytics component in Admin → Users
2. Click "daily" to show last 24 hours metrics
3. Note: Active users (last 24 hours) count
4. Manually count users who logged in today
5. Compare with displayed count

**Expected Result**:
- ✅ Count matches or closely approximates manual count
- ✅ All users with `last_active_at` in last 24 hours are included
- ✅ Signed-out users are not double-counted

---

### Test 7: Error Handling
**Objective**: Verify app continues working even if activity tracking fails

**Steps**:
1. Open DevTools → Network tab
2. Enable offline mode
3. Use the app normally (this will fail activity tracking)
4. Check DevTools console for errors
5. Re-enable network

**Expected Result**:
- ✅ Warning appears: "Failed to track activity" (in console)
- ✅ App continues functioning normally
- ✅ User experience is not impacted
- ✅ When network returns, activity tracking resumes

---

### Test 8: Database Verification
**Objective**: Directly verify database state

**Steps**:
1. Log in a test user
2. Open Supabase dashboard
3. Go to SQL Editor
4. Run query:
```sql
SELECT 
  id,
  email,
  display_name,
  last_active_at,
  created_at,
  deactivated_at
FROM profiles
WHERE email LIKE '%@example.com'
ORDER BY last_active_at DESC
NULLS LAST;
```

**Expected Result**:
- ✅ Recently logged-in users show recent `last_active_at` timestamps
- ✅ Logged-out users show `deactivated_at` timestamp
- ✅ Old/inactive users show older `last_active_at` (or NULL if never tracked)

---

### Test 9: Realtime Metrics Update
**Objective**: Verify metrics update in real-time as users change status

**Steps**:
1. Open Admin → Users in one tab
2. Open app in another tab
3. In app tab, log in User A
4. Immediately switch to Admin tab
5. Refresh or wait for realtime (should update within 5-10 seconds)
6. User A should appear as "Online"
7. Go back to app tab and log out
8. Return to Admin tab
9. User A should change to "signed_out"

**Expected Result**:
- ✅ User appears "online" immediately after login (within 10 seconds)
- ✅ User changes to "signed_out" immediately after logout
- ✅ Realtime subscriptions working correctly

---

### Test 10: Performance Check
**Objective**: Verify activity tracking doesn't cause performance issues

**Steps**:
1. Open DevTools → Performance tab
2. Record page load and 30 seconds of normal usage
3. Log in and use app normally
4. Check for:
   - Frame rate drops
   - Long-running scripts
   - Network bottlenecks

**Expected Result**:
- ✅ No visible performance degradation
- ✅ Frame rate stays above 50 FPS
- ✅ Activity POST requests complete in <100ms
- ✅ No memory leaks or slow scripts

---

## Metrics to Monitor Post-Deployment

### 1. Activity Endpoint Metrics
- **Endpoint**: POST `/api/user/activity`
- **Expected frequency**: Once per logged-in user, every 5 minutes
- **Monitor for**:
  - Error rate (should be <1%)
  - Response time (should be <100ms)
  - Daily request volume

### 2. Database Metrics
- **Table**: `profiles`
- **Column**: `last_active_at`
- **Monitor for**:
  - Update frequency (should match requests from activity endpoint)
  - NULL values (should decrease over time)
  - Data accuracy (timestamps should be recent)

### 3. Admin Dashboard Metrics
- **Page**: Admin → Users → Metrics
- **Monitor for**:
  - Online count accuracy
  - Daily active count accuracy
  - "Last seen" time accuracy
  - Realtime updates working properly

---

## Troubleshooting Guide

### Issue: Metrics still show 0 users online
**Cause**: Activity tracking not running or backend endpoint not responding

**Fix**:
1. Check browser DevTools → Network tab
2. Verify `/api/user/activity` POST requests appear
3. Check response status (should be 200)
4. If missing, check:
   - Browser console for errors
   - Network is working
   - User is logged in
   - Backend is running

### Issue: "last_active_at" stays NULL in database
**Cause**: Activity endpoint not updating correctly

**Fix**:
1. Test endpoint manually:
```bash
curl -X POST http://localhost:5000/api/user/activity \
  -H "Content-Type: application/json" \
  -d '{"userId":"550e8400-e29b-41d4-a716-446655440000"}'
```
2. Check response: should be `{ ok: true }`
3. Verify in Supabase that timestamp updated
4. If not, check backend logs for errors

### Issue: Activity tracking requests failing frequently
**Cause**: Network issues, backend overload, or database issues

**Fix**:
1. Check backend logs for errors
2. Check database connection status
3. Monitor backend CPU/memory
4. Check network latency
5. Increase error handling verbosity in code

### Issue: Metrics updating too slowly
**Cause**: Realtime subscriptions not active or polling interval too long

**Fix**:
1. Verify realtime is enabled in Supabase
2. Check Realtime subscriptions in admin panel
3. Current interval is 5 minutes - adjust if needed by changing `5 * 60 * 1000` to different value
4. Don't go below 1 minute to avoid excessive load

### Issue: Performance degradation after deployment
**Cause**: Activity tracking causing excessive network requests

**Fix**:
1. Increase interval from 5 minutes to 10 minutes
2. Add request debouncing
3. Check if backend is bottlenecking
4. Monitor network usage with DevTools

---

## Rollback Plan

If issues occur after deployment:

1. **Disable activity tracking** (keep infrastructure):
   - Comment out useEffect in BookPanel.jsx (lines 1118-1145)
   - Comment out useEffect in Pastpapers.jsx (lines 491-519)
   - Deploy frontend

2. **Keep backend endpoint** (for future use):
   - Leave `/api/user/activity` endpoint in place
   - No immediate issues from it existing

3. **Metrics will revert to**:
   - Showing 0 online users (due to NULL last_active_at)
   - But will stop making unnecessary API calls

4. **Full rollback** (if needed):
   - Revert commits to all three files
   - Deploy backend without activity endpoint
   - Deploy frontend without activity tracking
   - All metrics will show old data (or 0)

---

## Success Criteria

✅ **Deployment is successful when**:
1. Activity tracking endpoint is live and responding
2. Browser makes POST requests to `/api/user/activity` every 5 minutes
3. `last_active_at` column in database shows recent timestamps
4. Admin → Users page shows accurate online/daily active counts
5. Metrics update in real-time as users log in/out
6. No errors in browser console related to activity tracking
7. No performance degradation observed
8. All users' "last seen" times are accurate

---

## Next Steps

1. Deploy backend changes
2. Deploy frontend changes
3. Run through Testing Checklist (all 10 tests)
4. Monitor metrics for 24 hours
5. Verify daily active users update correctly next day
6. Document any issues found
7. Consider adding activity tracking to other components as needed
