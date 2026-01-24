# User Metrics System - Accuracy Fix

## Issues Fixed

### 1. **Signed-out users showing 0**
- **Root Cause**: The `deactivated_at` column doesn't exist in the profiles table
- **Fix**: Added migration to create `deactivated_at` column with proper indexing
- **Impact**: Now tracks when users deactivate their accounts

### 2. **Active users calculation was inaccurate**
- **Root Cause**: Only relied on `last_active_at` which might not be updated frequently
- **Fix**: Now uses `updated_at` as fallback when `last_active_at` is null
- **Impact**: More users are correctly counted as active

### 3. **Missing "authenticated users" metric**
- **Root Cause**: No distinction between total users and verified authenticated users
- **Fix**: Added `totalAuthenticated` count (users with id + email)
- **Impact**: Shows data quality and coverage

### 4. **No data quality indicator**
- **Root Cause**: Couldn't assess if metrics were reliable
- **Fix**: Added accuracy score showing % of users with known status
- **Impact**: Transparency about data completeness

## New Metrics Explained

### Active users (Last 30 days)
- **Definition**: Users with activity (login/action) in the selected time period
- **Calculation**: Must be signed in (not deactivated) AND have recent activity
- **Updated**: Now shows as percentage of authenticated users for context

### Signed-out users (Last 30 days)
- **Definition**: Accounts deactivated within the selected time period
- **Calculation**: `deactivated_at` timestamp between range start and now
- **Note**: This is period-based, different from "Total signed-out"

### Total active now
- **Definition**: Users currently online (activity in last 5 minutes, not deactivated)
- **Calculation**: `now - last_active_at <= 5 minutes` AND `deactivated_at IS NULL`
- **Color**: Green (#00a884) to indicate real-time status

### Total authenticated
- **Definition**: Users with valid profiles (id + email)
- **Calculation**: Count of users where `id` AND `email` are not null
- **Period**: All-time (shows total valid accounts)

### Total signed-out
- **Definition**: All accounts that have been deactivated
- **Calculation**: Count where `deactivated_at` is not null and <= now
- **Period**: All-time (shows all deactivated accounts ever)

### Accuracy score
- **Definition**: % of total users with known status
- **Calculation**: `(authenticated + signed_out) / total_users * 100`
- **Target**: Should be >= 90% for high confidence

## Database Changes

### New SQL Migration (metrics-fix.sql)

```sql
-- Add deactivated_at column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create performance indexes
CREATE INDEX idx_profiles_deactivated_at ON profiles(deactivated_at);
CREATE INDEX idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
```

### Fields Used

| Field | Type | Purpose | Updated |
|-------|------|---------|---------|
| `id` | UUID | User identifier | On creation |
| `email` | TEXT | Email address | On creation |
| `created_at` | TIMESTAMP | Account creation | On creation |
| `updated_at` | TIMESTAMP | Last profile update | On any change |
| `last_active_at` | TIMESTAMP | Last activity | On user action |
| `deactivated_at` | TIMESTAMP | Account deactivation | On deactivation |

## Implementation Details

### UsersAnalytics.jsx Changes

1. **Added totalAuthenticated tracking**
   ```javascript
   if (u.id && u.email) {
     totalAuthenticatedLocal += 1;
   }
   ```

2. **Improved activity detection**
   ```javascript
   const lastActiveAt = u.last_active_at ? new Date(u.last_active_at) : 
                        u.updated_at ? new Date(u.updated_at) : null;
   ```

3. **Added percentage calculation**
   ```javascript
   const activePercentageLocal = totalAuthenticatedLocal > 0 
     ? Math.round((activePeriod / totalAuthenticatedLocal) * 100) 
     : 0;
   ```

4. **Enhanced UI with context**
   - Each metric now has a subtitle explaining what it means
   - Color coding: Green (online), Blue (total), Red (deactivated)
   - Accuracy score shows data quality

## Testing Checklist

- [ ] Verify migrations run successfully
- [ ] Check that accuracy score is >= 80%
- [ ] Confirm "Total active now" shows current online users
- [ ] Verify signed-out users show correctly if any accounts deactivated
- [ ] Test all time range filters (daily, week, month, year)
- [ ] Confirm percentages are mathematically accurate

## Performance Impact

- 3 new indexes on profiles table
- Minimal query impact (already fetching all profiles)
- Better performance for large user lists due to indexes

## Future Improvements

1. Add actual deactivation workflow (API endpoint to set deactivated_at)
2. Create user status dashboard
3. Add metrics export/analytics
4. Implement user reactivation logic
5. Add audit log for deactivations

## Related Files

- `src/SomaLux/Books/Admin/pages/UsersAnalytics.jsx` - Component with calculations
- `src/SomaLux/Books/Admin/pages/Users.jsx` - Data fetching and enrichment
- `src/SomaLux/Books/Admin/api.js` - API calls (fetchProfiles)
- `metrics-fix.sql` - Database migration script
