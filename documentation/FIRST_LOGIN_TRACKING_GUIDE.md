# First Login Tracking Implementation Guide

## Overview
This system captures the exact time and date when a user first logs into the SomaLux application.

## Database Table: `first_login_tracking`

### Schema

```sql
Column                | Type                  | Description
---------------------|------------------------|------------------------------------------
id                   | UUID (PRIMARY KEY)    | Unique identifier
user_id              | UUID (UNIQUE, FK)    | References profiles(id)
first_login_at       | TIMESTAMP WITH TZ    | Complete timestamp (ISO 8601)
first_login_date     | DATE                 | Date only (YYYY-MM-DD)
first_login_time     | TIME WITH TIME ZONE  | Time only (HH:mm:ss+TZ)
ip_address           | TEXT                 | Client's IP address
device_type          | VARCHAR(50)          | 'mobile', 'tablet', 'desktop'
user_agent           | TEXT                 | Full user agent string
browser              | TEXT                 | Parsed browser name
operating_system     | TEXT                 | Parsed OS name
location             | TEXT                 | Geographic location (optional)
created_at           | TIMESTAMP WITH TZ    | Record creation time
```

### Unique Constraint
- Only ONE record per user (enforced by UNIQUE constraint on `user_id`)
- Prevents duplicate entries

## Features

### 1. Data Captured
- **Exact Timestamp**: Full ISO 8601 format with timezone
- **Date**: Separate field for easy date-based queries
- **Time**: Separate field for time-based analysis
- **Device Info**: 
  - Device type (mobile/tablet/desktop)
  - Browser name
  - Operating System
  - Full user agent string
- **Network**: IP address for location/security analysis
- **Audit**: Created at timestamp

### 2. Security
- **Row Level Security (RLS) Enabled**: Policies restrict access
- **User Privacy**:
  - Users can only see their own first login record
  - Admins can see all first login records
  - Users cannot modify or delete their record
- **Insert-Only**: No updates allowed after first record (prevents tampering)

### 3. Performance
- **Indexed Columns**:
  - `user_id`: Fast user lookup
  - `first_login_date`: Fast date range queries
  - `created_at`: Fast chronological queries
- **UNIQUE constraint**: Prevents multiple inserts per user

## Backend Integration

### Files

1. **Migration File**: `migrations/002_first_login_tracking.sql`
   - Creates table with RLS policies
   - Sets up indexes

2. **Utility File**: `backend/utils/firstLoginTracking.js`
   - `recordFirstLogin(userId, req)`: Records first login
   - `getFirstLoginInfo(userId)`: Retrieves user's first login info
   - `getFirstLoginStatistics()`: Gets aggregate statistics

3. **Modified Login Endpoint**: `backend/index.js`
   - `/api/user/session/login` endpoint now calls `recordFirstLogin()`

### Usage Examples

#### Recording First Login (Automatic)
```javascript
import { recordFirstLogin } from './utils/firstLoginTracking.js';

// In your login endpoint
app.post('/api/user/session/login', async (req, res) => {
  const { userId } = req.body;
  
  // Automatically record first login (non-blocking)
  recordFirstLogin(userId, req).catch(err => {
    console.error('First login tracking error:', err);
    // Don't fail the login if tracking fails
  });
  
  res.json({ ok: true });
});
```

#### Retrieving First Login Info
```javascript
import { getFirstLoginInfo } from './utils/firstLoginTracking.js';

// Get a user's first login info
const firstLogin = await getFirstLoginInfo(userId);
console.log(firstLogin);
// {
//   id: 'uuid-xxx',
//   user_id: 'user-id-xxx',
//   first_login_at: '2026-01-24T10:30:45.123+03:00',
//   first_login_date: '2026-01-24',
//   first_login_time: '10:30:45+03:00',
//   device_type: 'mobile',
//   browser: 'Chrome',
//   operating_system: 'Android',
//   ip_address: '192.168.1.1'
// }
```

#### Getting Statistics
```javascript
import { getFirstLoginStatistics } from './utils/firstLoginTracking.js';

const stats = await getFirstLoginStatistics();
console.log(stats);
// {
//   total_first_logins: 1523,
//   device_breakdown: {
//     mobile: 892,
//     desktop: 521,
//     tablet: 110
//   },
//   recent_logins_30_days: 142
// }
```

## SQL Queries

### Find users with their first login info
```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  f.first_login_at,
  f.first_login_date,
  f.device_type,
  f.browser,
  f.operating_system
FROM profiles p
LEFT JOIN first_login_tracking f ON p.id = f.user_id
ORDER BY f.first_login_date DESC;
```

### Get first logins by date
```sql
SELECT 
  first_login_date,
  COUNT(*) as login_count,
  COUNT(DISTINCT CASE WHEN device_type = 'mobile' THEN user_id END) as mobile_logins,
  COUNT(DISTINCT CASE WHEN device_type = 'desktop' THEN user_id END) as desktop_logins,
  COUNT(DISTINCT CASE WHEN device_type = 'tablet' THEN user_id END) as tablet_logins
FROM first_login_tracking
GROUP BY first_login_date
ORDER BY first_login_date DESC;
```

### Get most common browsers for first logins
```sql
SELECT 
  browser,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM first_login_tracking
WHERE browser IS NOT NULL
GROUP BY browser
ORDER BY count DESC;
```

### Get first logins from specific date range
```sql
SELECT *
FROM first_login_tracking
WHERE first_login_date BETWEEN '2026-01-01' AND '2026-01-31'
ORDER BY first_login_at DESC;
```

## Frontend Integration (Optional)

You can optionally display first login info on user profile page:

```jsx
import { useEffect, useState } from 'react';

export function FirstLoginInfo({ userId }) {
  const [firstLogin, setFirstLogin] = useState(null);

  useEffect(() => {
    fetch(`/api/user/first-login-info?userId=${userId}`)
      .then(res => res.json())
      .then(data => setFirstLogin(data))
      .catch(err => console.error(err));
  }, [userId]);

  if (!firstLogin) return <p>Loading...</p>;

  return (
    <div className="first-login-info">
      <h3>First Login Information</h3>
      <p><strong>Date:</strong> {firstLogin.first_login_date}</p>
      <p><strong>Time:</strong> {firstLogin.first_login_time}</p>
      <p><strong>Device:</strong> {firstLogin.device_type}</p>
      <p><strong>Browser:</strong> {firstLogin.browser}</p>
      <p><strong>OS:</strong> {firstLogin.operating_system}</p>
    </div>
  );
}
```

## Testing

### 1. Apply the migration
```bash
# Run the SQL migration in your Supabase console or via CLI
psql -h your-db-host -U postgres -d your-db -f migrations/002_first_login_tracking.sql
```

### 2. Verify table creation
```sql
-- Check table exists
SELECT * FROM first_login_tracking LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'first_login_tracking';
```

### 3. Test recording first login
```bash
# Call login endpoint
curl -X POST http://localhost:3000/api/user/session/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Verify record was created
SELECT * FROM first_login_tracking 
WHERE user_id = 'test-user-id';
```

### 4. Test subsequent logins (should not create new record)
```bash
# Call login endpoint again with same user
curl -X POST http://localhost:3000/api/user/session/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Verify only one record exists
SELECT COUNT(*) FROM first_login_tracking 
WHERE user_id = 'test-user-id';
-- Should return: 1
```

## Notes

- **Non-blocking**: First login tracking is fire-and-forget to avoid delaying login response
- **Fallback**: If tracking fails, the login still succeeds (graceful degradation)
- **Privacy**: IP addresses and user agents are stored only for analytics (be mindful of GDPR)
- **Immutable**: Once recorded, first login data cannot be modified (prevents tampering)
- **Efficient**: Uses UNIQUE constraint to prevent duplicate attempts
