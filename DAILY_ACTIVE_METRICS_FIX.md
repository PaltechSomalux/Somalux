# Daily Active Metrics Fix - Activity Tracking Implementation

## Problem
Daily active, online, and other user metrics were showing 0 users because:
1. The `last_active_at` column was NULL for all users (newly added in migration)
2. Only the `/api/user/session/logout` endpoint updated `last_active_at` (asynchronously, non-blocking)
3. No logic existed to update `last_active_at` when users were actively using the app
4. The `UsersAnalytics` component depends on `last_active_at` for all metrics calculations

## Root Cause
- `last_active_at` column was added in the database migration but had no code updating it during regular app usage
- Metrics calculations in `UsersAnalytics.jsx` depend on comparing current time with `last_active_at` to determine:
  - **Online now**: Users active in last 5 minutes
  - **Daily active**: Users active in last 24 hours
  - **Total active**: Count of online users

## Solution Implemented

### 1. Backend Activity Tracking Endpoint
**File**: `backend/index.js` (after line 220)

Created new endpoint: `POST /api/user/activity`
```javascript
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

**Purpose**: Records when a user is actively using the app by updating their `last_active_at` timestamp

### 2. Frontend Activity Tracking in BookPanel.jsx
**File**: `src/SomaLux/Books/BookPanel.jsx` (after auth listener setup, ~line 1120)

Added new useEffect hook:
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

**Behavior**:
- Tracks activity immediately when user logs in
- Updates `last_active_at` every 5 minutes while user is on the site
- Cleans up interval when component unmounts or user logs out

### 3. Frontend Activity Tracking in Pastpapers.jsx
**File**: `src/SomaLux/PastPapers/Pastpapers.jsx` (after auth listener setup, ~line 500)

Same activity tracking hook added for consistency across the app

## How It Works Now

### Activity Flow
1. User opens BookPanel or PastPapers component
2. Component logs in user via auth listener
3. Activity tracking effect detects user ID
4. Immediately calls `/api/user/activity` to update `last_active_at`
5. Sets interval to call again every 5 minutes

### Metrics Calculation Flow
1. Admin views Users page
2. `UsersAnalytics` component receives `rows` prop with all user profiles
3. For each user, it checks:
   - `last_active_at` timestamp (now populated!)
   - `created_at` as fallback
   - `deactivated_at` for signed-out users
4. Calculates metrics:
   - **Online now**: `now - last_active_at <= 5 minutes`
   - **Daily active**: `created_at/last_active_at >= 24 hours ago`
   - **Signed out**: `deactivated_at exists and is recent`

## Data Flow Diagram

```
User Opens App
    ↓
BookPanel/Pastpapers mounts
    ↓
Auth listener fetches user profile
    ↓
Activity tracking effect triggers
    ↓
POST /api/user/activity { userId }
    ↓
Backend updates profiles.last_active_at = NOW()
    ↓
(Every 5 minutes, repeat)
    ↓
Admin visits Users page
    ↓
fetchProfiles() fetches all users with last_active_at
    ↓
UsersAnalytics calculates metrics based on last_active_at
    ↓
Metrics display correctly:
  - Online: 45 users
  - Daily active: 230 users
  - Total: 1,250 users
```

## Files Modified

1. **backend/index.js**
   - Added `/api/user/activity` POST endpoint (Lines 227-254)
   - Updates `profiles.last_active_at` when called

2. **src/SomaLux/Books/BookPanel.jsx**
   - Added activity tracking useEffect after auth listener (Lines 1120-1145)
   - Calls `/api/user/activity` every 5 minutes

3. **src/SomaLux/PastPapers/Pastpapers.jsx**
   - Added activity tracking useEffect after auth listener (Lines 500-527)
   - Calls `/api/user/activity` every 5 minutes

## Testing Checklist

- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Log in as a test user
- [ ] Wait 1-2 minutes for activity to track
- [ ] Go to Admin → Users page
- [ ] Verify "Total active now" shows correct count (should include your user)
- [ ] Verify "Daily active" shows users from last 24 hours
- [ ] Check individual user "last seen" is accurate
- [ ] Wait 5 minutes, refresh Users page
- [ ] Verify "last seen" time updates to recent
- [ ] Test with multiple logged-in users simultaneously
- [ ] Verify metrics update in real-time as users log in/out

## Expected Results After Fix

- ✅ "Total active now" will show users online in last 5 minutes
- ✅ "Daily active" will show all users who have been online in last 24 hours
- ✅ "Signed out" will show deactivated users
- ✅ All metrics will update every 5 minutes as users interact with the app
- ✅ No more showing 0 users online when there are active users

## Notes

- Activity tracking fails silently to prevent disrupting user experience
- 5-minute interval balances accuracy with API load
- Timestamps are stored as ISO 8601 format in Supabase
- `created_at` is used as fallback for users who haven't had activity tracked yet
- No activity tracking for anonymous/non-logged-in users (expected behavior)
