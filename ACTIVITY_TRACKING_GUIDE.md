# User Activity Tracking Implementation

## Problem
The metrics show "1007" active users in the last 24 hours, which equals the total authenticated users. This indicates that `last_active_at` is not being properly updated when users perform actions.

## Solution
Implement activity tracking that updates `last_active_at` timestamp whenever users perform actions.

## Activity Tracking Points

### 1. **Authentication Events**
Update `last_active_at` when:
- User logs in
- User authenticates via OAuth (Google, etc.)

```javascript
// After successful login
await supabase
  .from('profiles')
  .update({ last_active_at: new Date().toISOString() })
  .eq('id', userId);
```

### 2. **Key User Actions**
Update `last_active_at` when:
- User views a book/paper
- User downloads content
- User writes a comment
- User performs a search
- User uploads content
- User navigates between pages

### 3. **Implementation Location**
Add activity tracking in these files:

#### **Frontend - API Wrapper** (src/SomaLux/Books/Admin/api.js)
```javascript
// Add this helper function
export async function updateUserActivity(userId) {
  if (!userId) return;
  try {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)
      .select()  // Returns updated row
      .single();
  } catch (e) {
    console.warn('[updateUserActivity] Failed to update activity:', e);
    // Don't throw - activity tracking is non-critical
  }
}
```

#### **Backend - Express Middleware** (backend/index.js)
```javascript
// Add activity tracking middleware
app.use('/api/*', async (req, res, next) => {
  const userId = req.user?.id || req.headers['x-user-id'];
  
  if (userId) {
    // Queue activity update (async, non-blocking)
    updateUserActivityAsync(userId).catch(e => 
      console.error('Activity tracking failed:', e)
    );
  }
  
  next();
});

async function updateUserActivityAsync(userId) {
  try {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (e) {
    console.error('[updateUserActivityAsync]', e);
  }
}
```

### 4. **Critical Actions to Track**

| Action | Location | Priority |
|--------|----------|----------|
| Login | Authentication module | HIGH |
| Page view | Router/Page load | HIGH |
| Search | BookPanel.jsx | MEDIUM |
| Download | Download.jsx | MEDIUM |
| Comment | CommentsSection.jsx | MEDIUM |
| Like | BookPanel.jsx | LOW |
| View book | SecureReader.jsx | HIGH |
| Upload | Upload pages | HIGH |

### 5. **Testing Activity Tracking**

After implementation, verify with:

```sql
-- Check if last_active_at is being updated
SELECT id, email, last_active_at, updated_at 
FROM profiles 
WHERE last_active_at > now() - interval '24 hours'
ORDER BY last_active_at DESC
LIMIT 10;

-- Should see recent timestamps, not just created_at dates
```

### 6. **Current Metric Behavior**

**Before Activity Tracking:**
- Active users (last 24h) = 0 or very low
- Users shown as active only if they have `last_active_at` set
- This is correct behavior - shows accurate data

**After Activity Tracking:**
- Active users (last 24h) = realistic number based on actual usage
- Users shown as active if they had any action in the period
- Metrics become meaningful and actionable

## Files to Modify

1. **src/SomaLux/Books/Admin/api.js**
   - Add `updateUserActivity()` function
   - Export for use throughout app

2. **src/SomaLux/Books/BookPanel.jsx**
   - Call activity tracking on book view/download

3. **src/SomaLux/PastPapers/Pastpapers.jsx**
   - Call activity tracking on paper view

4. **backend/index.js**
   - Add middleware for all API routes

5. **src/App.jsx** or routing component
   - Track page navigation

## Database Considerations

- `last_active_at` updates are frequent but lightweight
- Add index: `CREATE INDEX idx_profiles_last_active_at ON profiles(last_active_at)`
- Consider batching updates to reduce load
- Set appropriate retention policy for historical data

## Performance Notes

- Updates should be **async, non-blocking**
- Use fire-and-forget pattern (don't wait for response)
- Consider rate limiting per user (max once per minute)
- Don't update on every single interaction, sample or debounce

## Current Status

✅ Metrics logic corrected to only count users with `last_active_at`
⚠️ Activity tracking not yet implemented
❌ Current active user counts will be low (0 or few)

## Next Steps

1. Implement activity tracking in backend middleware
2. Add tracking to key user actions in frontend
3. Validate that `last_active_at` is updating
4. Observe metrics for realistic numbers
5. Adjust tracking points based on actual usage patterns
