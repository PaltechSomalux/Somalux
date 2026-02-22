# User Ads System - Implementation Guide

## Overview
This guides users to create and submit ads for admin approval, with a complete admin panel for managing submissions (Creators tab).

## Step 1: Run SQL Migration

⚠️ **IMPORTANT**: Run this SQL in your Supabase SQL Editor FIRST before testing the feature.

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Create a new query and copy the contents of `USER_ADS_MIGRATION.sql`
4. Execute the query
5. Verify the table was created by checking the verification queries at the bottom

### What Gets Created:
- **user_ads table**: Stores all user-submitted advertisements
- **Indexes**: For better query performance on common searches
- **RLS policies**: Security rules so users can only see/edit their own ads
- **Fallback columns**: Optional columns added to requests table as backup

---

## Step 2: Frontend Features

### User Side (UserProfile)
**Location**: `User Profile` > `My Advertisements` tab > `Ads` tab

**Features**:
- **Ad Creation Form** with 5 sections:
  1. 📝 Basic Information - Title, description, ad type
  2. 🎨 Creative & Media - Image/video upload with drag-and-drop
  3. 🎯 Audience Targeting - Age, gender, device selection
  4. 💰 Budget & Pricing - Budget and cost settings
  5. ⚙️ Advanced Settings - Scheduling, priorities, A/B testing

- **Direct Database Integration**: Form saves directly to Supabase `user_ads` table
- **Fallback Support**: If `user_ads` table doesn't exist, falls back to `requests` table
- **Analytics Tab**: View submitted ads with impressions, clicks, CTR, status

### Admin Side (Admin Panel)
**Location**: Admin > Ads > **Creators tab** (new!)

**Features**:
- **User Submissions Table** showing:
  - User name and email
  - Ad title, type (Image/Video)
  - Placement location
  - Status (Pending/Approved/Rejected)
  - Submission date
  - **Action Buttons**:
    - ✅ **Approve** - Approve the ad (only shows if not approved)
    - ❌ **Reject** - Reject the ad (only shows if not rejected)

- **Smart Filtering**: Automatically detects ad submissions from both tables
- **Live Updates**: Table refreshes after approval/rejection
- **Status Badges**: Color-coded status indicators

---

## Step 3: Data Flow

### User Creates Ad:
```
User fills form → Submits → Saved to user_ads table → Status: "pending"
```

### Admin Reviews:
```
clicks Creators tab → Sees all pending submissions → 
Clicks "Approve" or "Reject" → Status updated → User sees update in Analytics
```

### User Sees Results:
```
Views Analytics tab → Sees their ads with status → Can track impressions/clicks
```

---

## Step 4: Database Schema

### user_ads Table Columns:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| user_email | TEXT | Email of submitter |
| user_name | TEXT | Display name |
| title | TEXT | Ad title (required) |
| description | TEXT | Ad description |
| ad_type | TEXT | 'image' or 'video' |
| image_url | TEXT | URL to uploaded image |
| video_url | TEXT | URL to uploaded video |
| video_duration | INTEGER | Video length in seconds |
| click_url | TEXT | Destination URL |
| cta_text | TEXT | Button text (default: "Learn More") |
| cta_button_color | TEXT | Color hex code |
| placement | TEXT | Ad placement location |
| start_date | DATE | Campaign start |
| end_date | DATE | Campaign end |
| budget | DECIMAL | Total budget |
| daily_budget | DECIMAL | Daily budget limit |
| cost_per_click | DECIMAL | CPC rate |
| total_impressions | INTEGER | View count |
| total_clicks | INTEGER | Click count |
| min_age | INTEGER | Minimum audience age |
| max_age | INTEGER | Maximum audience age |
| target_gender | TEXT | 'all', 'male', or 'female' |
| target_devices | TEXT | JSON array: ["mobile","tablet","desktop"] |
| priority | TEXT | 'low', 'medium', 'high' |
| frequency_cap | INTEGER | Max impressions per user |
| conversion_tracking | BOOLEAN | Enable conversion tracking |
| conversion_url | TEXT | Conversion tracking URL |
| ab_test_group | TEXT | A/B test group identifier |
| status | TEXT | 'pending', 'approved', 'rejected', 'draft' |
| admin_notes | TEXT | Admin review notes |
| reviewed_by | UUID | Admin who reviewed |
| reviewed_at | TIMESTAMP | When admin reviewed |
| created_at | TIMESTAMP | Submission timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

## Step 5: Testing Checklist

- [ ] SQL migration ran successfully
- [ ] No errors in browser console
- [ ] User can fill out ad creation form
- [ ] Image/video upload works
- [ ] Form validates required fields
- [ ] Ad submits to database
- [ ] Admin can see submission in Creators tab
- [ ] Admin can approve ad
- [ ] Admin can reject ad
- [ ] User sees updated status in Analytics tab
- [ ] Status badges show correct colors

---

## Step 6: Troubleshooting

### Problem: "No user submissions yet" in Creators tab
**Solution**:
1. Verify SQL migration ran successfully
2. Check user is logged in when creating ad
3. Look in browser DevTools > Console for errors
4. Check if submission went to requests table instead

### Problem: Form won't submit
**Solution**:
1. Ensure all required fields are filled
2. Verify image/video uploaded successfully
3. Check network tab in DevTools for 402/500 errors
4. Ensure userProfile is fetched

### Problem: Approve/Reject buttons don't work
**Solution**:
1. Check if logged in as admin
2. Verify user_ads table exists (check SQL)
3. Look for errors in console
4. Try refreshing Creators tab

---

## Files Modified

1. **c:\SomaLux\USER_ADS_MIGRATION.sql** - NEW
   - Database schema migration

2. **c:\SomaLux\src\SomaLux\User\UserProfile\UserAds.jsx**
   - Updated to save to user_ads table
   - Added Supabase integration

3. **c:\SomaLux\src\SomaLux\Books\Admin\pages\AdvancedAdsManagement.jsx**
   - Added Creators tab
   - Fetches from user_ads table with fallback
   - Approve/reject functionality

---

## Next Steps (Optional)

- [ ] Add email notifications when ad is approved/rejected
- [ ] Implement ad scheduling to go live on start_date
- [ ] Add ad performance metrics integration
- [ ] Create user dashboard to track ad performance
- [ ] Implement automatic ad rejection rules
- [ ] Add admin bulk action tools (approve/reject multiple at once)

