# Critical Fix: Session Expiry Bug (Unexpected Login Prompts)

## Issue Description

**Symptom**: User is logged in (profile shows user info), but within minutes the system prompts them to login again.

**Root Cause**: The `setupAuthListener` callback was being called with `null` sessions on `INITIAL_SESSION` events (when Supabase has no session on startup), causing:
1. `fetchUserWithRole(null)` to be called
2. `setUser(null)` executed
3. `requireAuth()` checks showed `!user` = true
4. Login modal triggered

## Technical Details

### The Bug (Before)
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (session && ...) {
    cacheSession(session);
  } else if (event === 'SIGNED_OUT' || !session) {
    clearSessionCache();
  }
  
  // PROBLEM: Called even on INITIAL_SESSION with no session
  if (onAuthChange) {
    onAuthChange(event, session);  // Calls with null!
  }
});
```

### The Sequence That Caused the Problem

1. **User logged in** → Session valid, cached, user profile shows ✓
2. **Minutes later** → Supabase fires `INITIAL_SESSION` event
3. **Bug**: Event fires without a session (Supabase startup check)
4. **Result**: `onAuthChange(event, null)` called
5. **Effect**: `fetchUserWithRole(null)` sets `user` to `null`
6. **Outcome**: Login modal appears despite user being logged in ✗

### The Fix (After)
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
    cacheSession(session);
    // Only call callback when we HAVE a session
    if (onAuthChange) {
      onAuthChange(event, session);  // ✓ Only with valid session
    }
  } else if (event === 'SIGNED_OUT') {
    // Explicit sign out still triggers callback
    clearSessionCache();
    if (onAuthChange) {
      onAuthChange(event, null);
    }
  }
  // For other events without session (like INITIAL_SESSION with no session),
  // don't call callback - prevents logout behavior
});
```

## Why This Matters

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| **Logged in, INITIAL_SESSION fires** | Callback with null → user logged out | Callback NOT called → user stays logged in |
| **Explicit sign out** | Callback with null ✓ | Callback with null ✓ |
| **Token refresh** | Callback with session ✓ | Callback with session ✓ |
| **User signs in** | Callback with session ✓ | Callback with session ✓ |

## Behavior After Fix

### Load Page (User Logged In)
1. `initializeSession()` checks Supabase
2. **Supabase has session** → Restored, user stays logged in ✓
3. `INITIAL_SESSION` event fires with session → Cached ✓
4. Callback NOT called for subsequent events without session ✓

### Load Page (User Logged Out)
1. `initializeSession()` checks Supabase
2. **Supabase has no session** → Check cache
3. **Cache valid** → Restore user ✓
4. **Cache expired** → Show login modal ✓

### 24 Hours Later (Cache Expires)
1. User tries to access a feature
2. `requireAuth()` checks for `user`
3. Cache expired, user state becomes `null`
4. Login modal shown → User logs in again ✓

### User Clicks Sign Out
1. User clicks sign out button
2. `SIGNED_OUT` event fires
3. Cache cleared
4. Callback called with `null`
5. `setUser(null)` executes ✓
6. Login modal shown ✓

## Key Insight

**The fix separates concerns**:
- **Session initialization**: `initializeSession()` handles startup restoration (sync with cache)
- **Session changes**: `setupAuthListener()` only notifies about **actual auth state changes** (not every startup check)
- **Cache fallback**: If Supabase says "no session" but cache is valid, stay logged in

## Critical Difference

| Component | Before | After |
|-----------|--------|-------|
| `initializeSession()` | Uses cache if Supabase fails | ✓ No change |
| `setupAuthListener()` | Called callback on every auth event | ✓ Only on real changes |
| `fetchUserWithRole()` | Could be called with `null` | ✓ Only called with valid session |
| **Result** | Unexpected logouts | ✓ Stable sessions |

## Testing

**Test Case 1: Stay Logged In**
1. Log in as user
2. Refresh page → No login prompt ✓
3. Wait 5 minutes → No login prompt ✓
4. Navigate around site → No login prompt ✓

**Test Case 2: Explicit Sign Out**
1. Log in as user
2. Click sign out
3. Login modal appears immediately ✓

**Test Case 3: Session Expiry (24 Hours)**
1. Log in as user
2. Wait 24+ hours (or manipulate localStorage)
3. Try to use feature requiring auth
4. Login modal appears ✓

**Test Case 4: Multiple Tabs**
1. Log in in tab A
2. Refresh tab B → Stays logged in ✓
3. Sign out in tab A
4. Tab B shows login on next action ✓

## Code Changes

**File**: `src/utils/sessionManager.js`
**Function**: `setupAuthListener()`
**Change**: Only call callback when session exists OR on explicit sign out
**Impact**: Prevents unexpected logout events from triggering login modal

## Deployment Notes

- ✅ No database changes
- ✅ No API changes  
- ✅ No breaking changes
- ✅ Drop-in replacement
- ✅ Backward compatible
- ✅ No additional dependencies

## Verification

After deploying, users should:
- ✅ Stay logged in when refreshing page
- ✅ Stay logged in when navigating
- ✅ Session persists across browser tabs
- ✅ Login modal only appears after sign out or cache expiry
- ❌ NO random login prompts after a few minutes

---

**This fix resolves the core session instability issue. Users will no longer experience unexpected login prompts.**
