# Quick Setup: Fix Missing Endpoints & Add Test Ads

## ✅ What Was Done

### 1. Backend Endpoints Added

Two new endpoints have been created in `backend/index.js`:

#### **POST `/api/rpc/daily_login_reward`**
- Awards daily login points to users
- Check if user already claimed reward today
- Updates user's total points
- Creates `daily_rewards` table entry

**Example Request:**
```javascript
POST http://localhost:5000/api/rpc/daily_login_reward
{
  "user_id": "user-uuid-here"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Daily reward claimed",
  "points": 10
}
```

#### **GET `/api/user_points_stats`**
- Retrieves user's point statistics
- Returns total_points, daily_logins, achievements_unlocked
- Creates empty stats if user doesn't have any yet

**Example Request:**
```
GET http://localhost:5000/api/user_points_stats?user_id=user-uuid-here
```

**Response:**
```javascript
{
  "user_id": "user-uuid-here",
  "total_points": 100,
  "daily_logins": 15,
  "achievements_unlocked": 5
}
```

---

## 📝 Add Test Ads to Database

To fix the issue where homepage/categories/pastpapers show "No ads available", add test ads:

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Copy & Paste SQL
Copy the entire contents of:
```
SUPABASE_INSERT_TEST_ADS.sql
```

Paste into the Supabase SQL Editor and click **Run**

### Step 3: Verify
After running, you should see output:
```
placement    | ad_count | titles
-------------|----------|--------
categories   | 1        | Explore All Categories
homepage     | 2        | Premium Books Collection, Reading Challenge 2025
pastpapers   | 1        | Past Papers Archive
```

---

## 🚀 Test the Fix

### Test 1: Homepage Ads
1. Open your app
2. Go to Homepage
3. You should see "Premium Books Collection" ad banner
4. You may need to refresh page (F5) to reload cached data

### Test 2: Categories Ads
1. Click on Categories page
2. You should see "Explore All Categories" ad banner

### Test 3: Past Papers Ads
1. Click on Past Papers section
2. You should see "Past Papers Archive" ad banner

### Test 4: Authors Page (Already Working ✓)
1. Authors page should continue showing the "image" ad
2. Impression and dismiss tracking already working

---

## 📊 Ad Details

The test ads were created with these specifications:

| Placement | Title | CTA | Status |
|-----------|-------|-----|--------|
| homepage | Premium Books Collection | Subscribe Now | Active |
| homepage | Reading Challenge 2025 | Join Challenge | Active |
| categories | Explore All Categories | Browse Categories | Active |
| pastpapers | Past Papers Archive | View All Papers | Active |

---

## 🔧 Database Requirements

The ads system requires these tables (created by migration 036):
- ✅ `ads` - Main ads table
- ✅ `ad_impressions` - Tracks ad views
- ✅ `ad_clicks` - Tracks ad clicks
- ✅ `ad_dismissals` - Tracks dismissed ads

The rewards system needs (optional, auto-created by endpoints):
- `daily_rewards` - Daily login records
- `user_points_stats` - User point statistics

---

## 📱 Console Logs After Fix

You should see console logs like:

**Homepage:**
```
🔍 [AdBanner] Fetching ads for placement: homepage
✅ [AdBanner] Ads fetched: {success: true, data: Array(2)}
📺 [AdBanner] Ad loaded - Title: Premium Books Collection Duration: 10
```

**Categories:**
```
🔍 [AdBanner] Fetching ads for placement: categories
✅ [AdBanner] Ads fetched: {success: true, data: Array(1)}
📺 [AdBanner] Ad loaded - Title: Explore All Categories Duration: 10
```

**Past Papers:**
```
🔍 [AdBanner] Fetching ads for placement: pastpapers
✅ [AdBanner] Ads fetched: {success: true, data: Array(1)}
📺 [AdBanner] Ad loaded - Title: Past Papers Archive Duration: 10
```

---

## ⚡ Backend is Ready

✅ The backend endpoints are deployed and ready to use  
✅ Just need to add the test ads via Supabase SQL  
✅ Then refresh your app to see ads on all placements

**Backend restart is NOT required** - the new endpoints are ready immediately on next server run.
