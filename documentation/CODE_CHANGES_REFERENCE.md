# Daily Active Metrics Fix - Code Changes Reference

## Summary of Changes

Three files were modified to implement automatic user activity tracking for accurate daily active/online metrics.

---

## 1. Backend Activity Endpoint

**File**: `backend/index.js`
**Location**: After line 220 (after logout endpoint)
**Lines**: 227-254

### Code Added:
```javascript
// Track user activity - updates last_active_at when user interacts with app
app.post('/api/user/activity', async (req, res) => {
  try {
    const { userId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update profiles table with current timestamp
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating activity:', error?.message);
      return res.status(500).json({ error: error?.message || 'Failed to update activity' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Error in activity tracking:', e);
    res.status(500).json({ error: e.message || 'Failed to track activity' });
  }
});
```

### What It Does:
- Accepts POST requests with `userId` in request body
- Updates that user's `last_active_at` column to current timestamp
- Returns `{ ok: true }` on success
- Handles errors gracefully without crashing

---

## 2. Frontend Activity Tracking - BookPanel

**File**: `src/SomaLux/Books/BookPanel.jsx`
**Location**: After auth listener setup (around line 1115)
**Lines**: 1118-1145

### Code Added:
```javascript
  // Track user activity - updates last_active_at for metrics
  useEffect(() => {
    if (!user?.id) return;

    const trackActivity = async () => {
      try {
        await fetch(`${API_URL}/api/user/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (e) {
        console.warn('Failed to track activity:', e);
      }
    };

    // Track immediately on mount
    trackActivity();

    // Then track every 5 minutes during active session
    const interval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);
```

### What It Does:
- Runs whenever `user?.id` changes
- Calls activity endpoint immediately when user logs in
- Sets up 5-minute interval to call endpoint every 5 minutes
- Cleans up interval when component unmounts or user logs out
- Fails silently without affecting user experience

### Dependencies:
- ✅ `API_URL` - Already imported in BookPanel (line 47)
- ✅ `useEffect` - Already imported from React
- ✅ `user?.id` - Available from component state

---

## 3. Frontend Activity Tracking - PastPapers

**File**: `src/SomaLux/PastPapers/Pastpapers.jsx`
**Location**: After auth listener setup (around line 475)
**Lines**: 493-519

### Code Added:
```javascript
  // Track user activity - updates last_active_at for metrics
  useEffect(() => {
    if (!user?.id) return;

    const trackActivity = async () => {
      try {
        await fetch(`${API_URL}/api/user/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (e) {
        console.warn('Failed to track activity:', e);
      }
    };

    // Track immediately on user login
    trackActivity();

    // Then track every 5 minutes during active session
    const interval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);
```

### What It Does:
- Identical to BookPanel implementation
- Ensures PastPapers section users also tracked
- Follows same 5-minute update pattern

### Dependencies:
- ✅ `API_URL` - Already imported in Pastpapers (line 43)
- ✅ `useEffect` - Already imported from React
- ✅ `user?.id` - Available from component state

---

## Related Files (Not Modified)

### `src/SomaLux/Books/Admin/pages/UsersAnalytics.jsx`
- **Status**: ✅ No changes needed
- **Why**: Already correctly uses `last_active_at` to calculate metrics
- **Calculation logic** (lines 40-50):
  - Online: `now - last_active_at <= 5 minutes`
  - Daily active: `last_active_at >= 24 hours ago`
  - Signed out: `deactivated_at exists and is recent`

### `src/SomaLux/Books/Admin/api.js`
- **Status**: ✅ Already updated in previous fix
- **Function**: `fetchProfiles()` explicitly selects `last_active_at` column
- **Select clause** (line ~895):
  ```javascript
  'id, email, display_name, avatar_url, bio, created_at, updated_at, last_active_at, subscription_tier, subscription_started_at, subscription_expires_at, role'
  ```

### `backend/index.js`
- **Status**: ✅ `/api/user/session/logout` already updates `last_active_at` (non-blocking)
- **Location**: Lines 192-210
- **Note**: Works with new activity endpoint, doesn't conflict

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│ User Opens BookPanel/Pastpapers     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Auth listener detects user login    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Activity tracking useEffect runs    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ POST /api/user/activity              │
│ { userId: "550e8400-..." }           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Backend updates last_active_at      │
│ profiles.last_active_at = NOW()     │
└────────────┬────────────────────────┘
             │
             ├─ Response: { ok: true }
             │
             ▼
┌─────────────────────────────────────┐
│ Every 5 minutes: repeat POST request │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ User logs out or leaves site        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ useEffect cleanup stops interval    │
└─────────────────────────────────────┘
```

---

## Testing the Changes

### Quick Test
1. Open DevTools → Network tab
2. Log in to app
3. Filter network for `/api/user/activity`
4. Should see POST request immediately
5. After 5 minutes, should see another one

### Verification Query
```sql
-- Check if last_active_at is being updated
SELECT 
  email,
  last_active_at,
  created_at,
  NOW() - last_active_at::timestamp as time_since_last_active
FROM profiles
WHERE email LIKE '%@your-domain.com'
ORDER BY last_active_at DESC
LIMIT 10;
```

---

## Potential Issues & Solutions

### Issue: Activity requests failing
**Check**:
- Backend is running and accessible
- `/api/user/activity` endpoint exists
- Network request has correct format
- `userId` is valid UUID

### Issue: `last_active_at` not updating
**Check**:
- Backend endpoint is being called (check Network tab)
- Supabase connection is working
- Profile exists for user ID
- User has permission to update own profile

### Issue: Performance impact
**Adjust**:
- Increase interval from `5 * 60 * 1000` to `10 * 60 * 1000` (10 minutes)
- Or decrease to `2 * 60 * 1000` (2 minutes) for more frequent updates

### Issue: Too many database writes
**Solution**:
- Current interval of 5 minutes is optimized
- Balances accuracy with database load
- Only one UPDATE statement per interval per user
- Very minimal impact on database

---

## Rollback Instructions

If needed to rollback, remove:

### 1. From `backend/index.js`
Remove lines 227-254 (the entire activity endpoint)

### 2. From `src/SomaLux/Books/BookPanel.jsx`
Remove lines 1118-1145 (the activity useEffect)

### 3. From `src/SomaLux/PastPapers/Pastpapers.jsx`
Remove lines 493-519 (the activity useEffect)

Then redeploy both backend and frontend.

---

## Code Quality Checks

✅ No syntax errors (verified with `get_errors`)
✅ Proper error handling with try-catch
✅ Graceful failure (activity errors don't break app)
✅ Proper cleanup (useEffect returns cleanup function)
✅ Proper dependencies (user?.id in dependency array)
✅ No global state mutations
✅ No memory leaks (intervals cleared on unmount)
✅ Follows existing code patterns
✅ Uses existing imports (API_URL already available)
✅ Minimal performance impact

---

## Related Documentation

1. **DAILY_ACTIVE_METRICS_FIX.md** - Detailed technical explanation
2. **METRICS_DEPLOYMENT_GUIDE.md** - Complete deployment & testing guide
3. **METRICS_FIX_SUMMARY.md** - Quick summary of the fix
4. **This document** - Exact code changes reference
