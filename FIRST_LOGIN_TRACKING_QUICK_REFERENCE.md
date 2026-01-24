# First Login Tracking - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1️⃣ Apply Database Migration
```bash
# Copy contents of: migrations/002_first_login_tracking.sql
# Paste into: Supabase Console → SQL Editor → Run
```

### 2️⃣ Restart Backend
```bash
cd backend && npm run dev
```

### 3️⃣ Done! It works automatically.
When users log in via `POST /api/user/session/login`, their first login is recorded.

---

## 📊 Table Schema

```sql
first_login_tracking
├─ id (UUID)                        -- Unique record ID
├─ user_id (UUID UNIQUE)            -- One per user
├─ first_login_at (TIMESTAMP TZ)   -- Full timestamp (2026-01-24T10:30:45Z)
├─ first_login_date (DATE)          -- Date only (2026-01-24)
├─ first_login_time (TIME TZ)       -- Time only (10:30:45+03:00)
├─ device_type (TEXT)               -- 'mobile', 'tablet', 'desktop'
├─ browser (TEXT)                   -- 'Chrome', 'Firefox', 'Safari'
├─ operating_system (TEXT)          -- 'Android', 'Windows', 'iOS'
├─ ip_address (TEXT)                -- Client IP (203.0.113.42)
├─ user_agent (TEXT)                -- Raw user agent string
├─ location (TEXT)                  -- Reserved for future use
└─ created_at (TIMESTAMP TZ)        -- Record creation time
```

---

## 🔌 API Endpoints

### Record First Login (Automatic)
```
POST /api/user/session/login
{
  "userId": "user-id-123",
  "ipAddress": "192.168.1.1",      // Optional
  "userAgent": "Mozilla/5.0...",   // Optional
  "deviceType": "mobile"             // Optional
}
```
✅ Automatically records first login (only once per user)

### Get User's First Login
```
GET /api/user/first-login-info?userId=user-id-123
```
**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-id-123",
    "first_login_at": "2026-01-24T10:30:45.123+03:00",
    "first_login_date": "2026-01-24",
    "first_login_time": "10:30:45+03:00",
    "device_type": "mobile",
    "browser": "Chrome",
    "operating_system": "Android",
    "ip_address": "203.0.113.42"
  }
}
```

### Get Statistics (Admin)
```
GET /api/admin/first-login-statistics
```
**Response:**
```json
{
  "total_first_logins": 1523,
  "device_breakdown": {
    "mobile": 892,
    "desktop": 521,
    "tablet": 110
  },
  "browser_breakdown": {
    "Chrome": 1200,
    "Safari": 200,
    "Firefox": 100
  },
  "os_breakdown": {
    "Android": 600,
    "Windows": 500,
    "iOS": 250
  },
  "recent_logins_30_days": 142,
  "logins_by_date": {
    "2026-01-24": 45,
    "2026-01-23": 32
  }
}
```

---

## 📋 SQL Query Examples

### Find user's first login
```sql
SELECT * FROM first_login_tracking 
WHERE user_id = 'user-id-123';
```

### All first logins today
```sql
SELECT * FROM first_login_tracking 
WHERE first_login_date = CURRENT_DATE
ORDER BY first_login_time DESC;
```

### Device breakdown
```sql
SELECT device_type, COUNT(*) as count
FROM first_login_tracking
GROUP BY device_type
ORDER BY count DESC;
```

### Browser breakdown
```sql
SELECT browser, COUNT(*) as count
FROM first_login_tracking
WHERE browser IS NOT NULL
GROUP BY browser
ORDER BY count DESC
LIMIT 10;
```

### First logins by date range
```sql
SELECT first_login_date, COUNT(*) as daily_signups
FROM first_login_tracking
WHERE first_login_date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY first_login_date
ORDER BY first_login_date DESC;
```

### Users with first login info
```sql
SELECT 
  p.email,
  p.full_name,
  f.first_login_date,
  f.browser,
  f.device_type
FROM profiles p
LEFT JOIN first_login_tracking f ON p.id = f.user_id
WHERE f.id IS NOT NULL
ORDER BY f.first_login_date DESC
LIMIT 50;
```

---

## 🔒 Security

| Feature | Status |
|---------|--------|
| RLS Enabled | ✅ |
| One record per user | ✅ (UNIQUE constraint) |
| Immutable after creation | ✅ (No UPDATE allowed) |
| User can see own record | ✅ |
| Admin can see all records | ✅ |
| Non-blocking | ✅ |
| GDPR considerations | ⚠️ (IP address stored) |

---

## 🧪 Test It

### Step 1: Create test user login
```bash
curl -X POST http://localhost:3000/api/user/session/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0)" \
  -d '{
    "userId": "test-user-xyz",
    "ipAddress": "203.0.113.42",
    "deviceType": "desktop"
  }'
```

### Step 2: Retrieve the data
```bash
curl "http://localhost:3000/api/user/first-login-info?userId=test-user-xyz"
```

### Step 3: Verify in database
```sql
SELECT * FROM first_login_tracking 
WHERE user_id = 'test-user-xyz';
```

---

## 🎯 Common Use Cases

### 1. User Onboarding
```jsx
// Show welcome message on first login
if (userProfile.firstLoginDate === TODAY) {
  showWelcomeBanner();
}
```

### 2. Analytics Dashboard
```javascript
// Get device breakdown for reporting
const stats = await fetch('/api/admin/first-login-statistics');
displayDeviceChart(stats.device_breakdown);
```

### 3. Security Alerts
```javascript
// Flag unusual first login patterns
if (firstLogin.ip_address === recentBotSignupIP) {
  flagAccountForReview();
}
```

### 4. Email Marketing
```javascript
// Send welcome email on first login
onFirstLoginTrackingInsert(() => {
  sendWelcomeEmail(user.email);
});
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No data recorded | Check migration applied: `SELECT * FROM first_login_tracking;` |
| UNIQUE constraint error | Check no duplicate record exists: `SELECT COUNT(*) FROM first_login_tracking WHERE user_id = 'xxx';` |
| Data not showing in query | Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'first_login_tracking';` |
| Backend logs show errors | Check `recordFirstLogin` import: `grep -n "recordFirstLogin" backend/index.js` |

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `migrations/002_first_login_tracking.sql` | Database setup |
| `backend/utils/firstLoginTracking.js` | Utility functions |
| `backend/index.js` | API endpoints (modified) |
| `FIRST_LOGIN_TRACKING_GUIDE.md` | Detailed documentation |
| `FIRST_LOGIN_TRACKING_SETUP_CHECKLIST.md` | Step-by-step setup |
| `FIRST_LOGIN_TRACKING_IMPLEMENTATION_SUMMARY.md` | Overview |

---

## ⚡ Key Features

✅ **One-Time Recording** - Only records first login, ignores subsequent logins
✅ **Non-Blocking** - Fire-and-forget, never slows down login
✅ **Secure** - RLS protected, immutable after creation
✅ **Informative** - Captures device, browser, OS, IP
✅ **Performant** - Indexed for fast queries
✅ **Ready-to-Use** - Automatic integration, no frontend changes needed

---

## 📞 Need Help?

1. **Setup Issues** → Read `FIRST_LOGIN_TRACKING_SETUP_CHECKLIST.md`
2. **Usage Questions** → Read `FIRST_LOGIN_TRACKING_GUIDE.md`
3. **Implementation Details** → Read `FIRST_LOGIN_TRACKING_IMPLEMENTATION_SUMMARY.md`
4. **Code Examples** → Check SQL/API sections above

---

**Status:** ✅ Production Ready
**Apply Migration:** Run SQL file from Supabase Console
**Test:** Call `/api/user/first-login-info` endpoint
