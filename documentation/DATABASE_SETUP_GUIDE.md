# 🚀 Database Setup - Step by Step

## The Error You Got
```
Could not find the table 'public.ads' in the schema cache
```

**Translation:** The `ads` table doesn't exist yet. You need to create it.

---

## ✅ Solution: 3 Simple Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**

---

### Step 2: Copy the Migration SQL
**Copy ALL of this code:**

```sql
-- Complete Ad System Migration
-- Run this in Supabase SQL Editor to set up everything

-- Step 1: Create base ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  click_url VARCHAR(2048),
  placement VARCHAR(50) NOT NULL,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Add enhanced columns to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS countdown_seconds INTEGER DEFAULT 10;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_skippable BOOLEAN DEFAULT true;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS local_file_path VARCHAR(2048);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_impressions INTEGER DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_dismisses INTEGER DEFAULT 0;

-- Step 3: Create ad analytics tracking table
CREATE TABLE IF NOT EXISTS ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  placement VARCHAR(50),
  event_type VARCHAR(20) NOT NULL,
  view_duration INTEGER DEFAULT 0,
  device_type VARCHAR(50),
  user_agent VARCHAR(500),
  geo_country VARCHAR(100),
  geo_region VARCHAR(100),
  referrer VARCHAR(500),
  browser VARCHAR(100),
  os VARCHAR(100),
  is_completed BOOLEAN DEFAULT false,
  interaction_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create ad engagement metrics table
CREATE TABLE IF NOT EXISTS ad_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  placement VARCHAR(50) NOT NULL,
  date_recorded DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  dismisses INTEGER DEFAULT 0,
  skips INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  mobile_impressions INTEGER DEFAULT 0,
  tablet_impressions INTEGER DEFAULT 0,
  desktop_impressions INTEGER DEFAULT 0,
  avg_view_duration DECIMAL(10, 2) DEFAULT 0,
  total_view_duration INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  click_through_rate DECIMAL(5, 2) DEFAULT 0,
  cost_per_impression DECIMAL(10, 4),
  cost_per_click DECIMAL(10, 4),
  revenue_generated DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create ad performance summary table
CREATE TABLE IF NOT EXISTS ad_performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_dismisses INTEGER DEFAULT 0,
  total_skips INTEGER DEFAULT 0,
  total_view_time INTEGER DEFAULT 0,
  overall_ctr DECIMAL(5, 2) DEFAULT 0,
  overall_completion_rate DECIMAL(5, 2) DEFAULT 0,
  avg_time_watched DECIMAL(10, 2) DEFAULT 0,
  unique_impressions INTEGER DEFAULT 0,
  reach_percentage DECIMAL(5, 2) DEFAULT 0,
  mobile_clicks INTEGER DEFAULT 0,
  tablet_clicks INTEGER DEFAULT 0,
  desktop_clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create ad dismissals table
CREATE TABLE IF NOT EXISTS ad_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  placement VARCHAR(50),
  view_duration INTEGER,
  dismissal_time TIMESTAMP DEFAULT NOW(),
  device_type VARCHAR(50)
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ads_placement_active ON ads(placement, is_active);
CREATE INDEX IF NOT EXISTS idx_ads_placement_active_countdown ON ads(placement, is_active, countdown_seconds);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad_id ON ad_analytics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event_type ON ad_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_date ON ad_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_device ON ad_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_ad_id ON ad_engagement_metrics(ad_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date ON ad_engagement_metrics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_dismissals_ad_id ON ad_dismissals(ad_id);
CREATE INDEX IF NOT EXISTS idx_performance_summary_ad_id ON ad_performance_summary(ad_id);
```

---

### Step 3: Paste & Execute
1. Paste the SQL into Supabase SQL Editor
2. Click the blue **"Run"** button (or Ctrl+Enter)
3. Wait for success message
4. Should see: ✅ Success or "Query executed successfully"

---

## ✅ Verify It Worked

### In Supabase SQL Editor, run this:
```sql
SELECT * FROM ads LIMIT 1;
```

**Expected result:**
```
1 row returned (empty, but table exists)
```

If error like "relation 'ads' does not exist" → Something went wrong, rerun the migration

---

## 🎉 You're Done!

The `ads` table and all related tables are now created.

### Next Steps:
1. **Restart backend:** 
   ```powershell
   taskkill /F /IM node.exe
   cd backend
   node index.js
   ```

2. **Create a test ad:**
   - Go to: `http://localhost:3000/books/admin/ads`
   - Click "+ Add New Ad"
   - Fill form with:
     - Title: "Test Ad"
     - Image URL: `https://via.placeholder.com/600x300?text=Test+Ad`
     - Placement: Homepage
   - Click Save

3. **Display on page:**
   ```jsx
   <AdBanner placement="homepage" />
   ```

4. **View analytics:**
   - Go to: `http://localhost:3000/books/admin/ad-analytics`

---

## 🆘 Troubleshooting

### If SQL fails with "Permission denied"
- Make sure you're in the right Supabase project
- Check you have admin permissions

### If tables created but ads still don't work
- Restart backend (kill node, restart)
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page

### If you can't find SQL Editor
- In Supabase, click your project name
- Left sidebar → "SQL Editor"
- It's there!

---

## Saved Location

This complete migration is also saved at:
```
d:\Work\SomaLux\backend\migrations\COMPLETE_AD_SYSTEM_SETUP.sql
```

If you need to run it again, just copy from that file!
