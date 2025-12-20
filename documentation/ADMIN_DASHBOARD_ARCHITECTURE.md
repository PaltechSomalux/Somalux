# 🏗️ Admin Dashboard - Complete Architecture

## System Overview

All advanced ad features are now **fully integrated and controlled through a single admin dashboard**.

---

## 🎯 Six Complete Control Panels

```
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD (Frontend)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 ALL ADS    🎯 CAMPAIGNS    🎬 VIDEOS    📈 ANALYTICS        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Create image ads    • Create campaigns                 │  │
│  │ • Create video ads    • Set budgets                      │  │
│  │ • Edit & delete       • Schedule campaigns               │  │
│  │ • Upload media        • Track performance                │  │
│  │ • Set targeting       • View campaign stats              │  │
│  │ • Set budgets         • Organize ads                     │  │
│  │ • Set scheduling      • View all campaigns               │  │
│  │ • A/B test groups     • See ads per campaign             │  │
│  │ • View stats          • Budget tracking                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🧪 A/B TESTING     ⚙️ SETTINGS                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Control group         • System statistics              │  │
│  │ • Variant A group       • Feature status                 │  │
│  │ • Variant B group       • Ad counts                      │  │
│  │ • Variant C group       • Budget totals                  │  │
│  │ • Performance view      • Active ads/campaigns           │  │
│  │ • Test tips             • Health check                   │  │
│  │ • Group breakdown       • Everything enabled            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                         │
         ├─────────────────────────┤
         │                         │
         ▼                         ▼
    adsApiV2.js (Backend)   Database (Supabase)
```

---

## 📊 Feature Control Hierarchy

```
ADMIN DASHBOARD
│
├── 📊 All Ads Tab
│   ├── Create Image Ads
│   │   ├── Upload image
│   │   ├── Set title, placement
│   │   ├── Set click URL
│   │   └── Set A/B group & campaign
│   │
│   ├── Create Video Ads
│   │   ├── Upload MP4 video
│   │   ├── Upload thumbnail
│   │   ├── Set video duration
│   │   ├── Set title, placement
│   │   └── Set A/B group & campaign
│   │
│   ├── Edit Ads
│   │   ├── Change media
│   │   ├── Update targeting
│   │   ├── Modify budget
│   │   └── Change A/B group
│   │
│   ├── Delete Ads
│   │   └── Remove ad from system
│   │
│   └── View Stats
│       ├── Impressions
│       ├── Clicks
│       └── CTR calculation
│
├── 🎯 Campaigns Tab
│   ├── Create Campaigns
│   │   ├── Campaign name
│   │   ├── Objective (awareness/consideration/conversion)
│   │   ├── Total budget
│   │   ├── Daily budget
│   │   └── Schedule (start/end dates)
│   │
│   ├── View Campaigns
│   │   ├── Campaign details
│   │   ├── Budget info
│   │   ├── Status tracking
│   │   └── Ads per campaign count
│   │
│   └── Assign Ads to Campaigns
│       └── Link from All Ads form
│
├── 🎬 Videos Tab
│   ├── Quick View Video Ads
│   │   ├── Thumbnail preview
│   │   ├── Duration display
│   │   ├── Impressions
│   │   └── Clicks
│   │
│   └── Edit Videos
│       └── Quick access to edit form
│
├── 📈 Analytics Tab
│   ├── Select Ad
│   │   └── Choose from dropdown
│   │
│   ├── View Metrics
│   │   ├── Total impressions
│   │   ├── Total clicks
│   │   ├── CTR (%)
│   │   ├── Total conversions
│   │   ├── Conversion rate (%)
│   │   └── Average view duration
│   │
│   ├── Device Breakdown
│   │   ├── Mobile impressions
│   │   ├── Tablet impressions
│   │   └── Desktop impressions
│   │
│   └── Dismissal Tracking
│       └── Dismissal rate (%)
│
├── 🧪 A/B Testing Tab
│   ├── Control Group
│   │   ├── View ads assigned
│   │   └── Monitor performance
│   │
│   ├── Variant A Group
│   │   ├── View ads assigned
│   │   └── Monitor performance
│   │
│   ├── Variant B Group
│   │   ├── View ads assigned
│   │   └── Monitor performance
│   │
│   ├── Variant C Group
│   │   ├── View ads assigned
│   │   └── Monitor performance
│   │
│   └── A/B Testing Tips
│       └── Best practices guide
│
└── ⚙️ Settings Tab
    ├── System Statistics
    │   ├── Total ads created
    │   ├── Active ads
    │   ├── Video ads count
    │   ├── Image ads count
    │   ├── Total campaigns
    │   ├── Active campaigns
    │   └── Total budget
    │
    └── Features Status
        ├── ✅ Video Support
        ├── ✅ Image Support
        ├── ✅ Analytics
        ├── ✅ Campaigns
        ├── ✅ A/B Testing
        ├── ✅ Targeting
        └── ✅ Conversions
```

---

## 🔌 API Integration

```
DASHBOARD CALLS
     │
     ├─→ GET /api/admin/ads/all ─→ Fetch all ads
     │
     ├─→ POST /api/admin/ads ─→ Create new ad
     │
     ├─→ PUT /api/admin/ads/:id ─→ Update ad
     │
     ├─→ DELETE /api/admin/ads/:id ─→ Delete ad
     │
     ├─→ GET /api/admin/campaigns/all ─→ Fetch campaigns
     │
     ├─→ POST /api/admin/campaigns ─→ Create campaign
     │
     ├─→ GET /api/admin/analytics/:adId ─→ Get ad metrics
     │
     ├─→ GET /api/admin/analytics/video/:adId ─→ Get video metrics
     │
     ├─→ POST /api/upload/image ─→ Upload image
     │
     ├─→ POST /api/upload/video ─→ Upload video
     │
     └─→ POST /api/upload/thumbnail ─→ Upload thumbnail
```

---

## 💾 Database Schema Control

```
DASHBOARD CONTROLS → DATABASE UPDATES
                   
        Forms Fill        │         Database Gets Updated
        ─────────────────────────────────────────────────
                          │
   Title/Placement   ─────→ ads table
   Status/Priority   ─────→ ads table (status, priority columns)
   Budget Info       ─────→ ads table (budget, daily_budget, cost_per_click)
   Targeting         ─────→ ads table (min_age, max_age, target_gender, target_devices)
   A/B Group         ─────→ ads table (ab_test_group)
   Campaign ID       ─────→ ads table (campaign_id, campaign_name)
   Conversion URL    ─────→ ads table (conversion_tracking, conversion_url)
   Dates             ─────→ ads table (start_date, end_date)
                          │
   Campaign Form     ─────→ ad_campaigns table
   Campaign Budget   ─────→ ad_campaigns table (budget, daily_budget)
   Campaign Status   ─────→ ad_campaigns table (status)
                          │
   Analytics View   ←────── ad_analytics table (tracking data)
   Video Metrics    ←────── ad_video_playback table
                          │
   A/B Grouping     ─────→ ads table (ab_test_group)
   Conversion Track ─────→ ad_conversions table
```

---

## 🎮 Control Flow

### Creating an Ad

```
1. Click "New Ad" in All Ads Tab
   │
2. Select Image or Video
   │
3. Fill Form
   ├─ Title, Placement
   ├─ Upload Media
   ├─ Set Click URL
   ├─ Targeting (Age, Gender, Device)
   ├─ Budget (Total, Daily, CPC)
   ├─ Scheduling (Dates)
   ├─ Campaign Assignment
   └─ A/B Test Group
   │
4. Submit Form
   │
5. POST to /api/admin/ads
   │
6. Backend Validation & Processing
   │
7. Insert into ads table
   │
8. Return to Dashboard
   │
9. Ad appears in All Ads list
```

### Monitoring Performance

```
1. Open Analytics Tab
   │
2. Select Ad from Dropdown
   │
3. GET /api/admin/analytics/:adId
   │
4. Backend Queries ad_analytics
   │
5. Calculate Metrics
   ├─ CTR = (clicks / impressions) × 100
   ├─ Conversion Rate = (conversions / clicks) × 100
   ├─ Avg Duration = sum(duration) / count
   └─ Device Breakdown = GROUP BY device_type
   │
6. Return Metrics to Dashboard
   │
7. Display in Metric Cards
   │
8. Admin Reviews Performance
```

### Running A/B Test

```
1. Create Campaign (optional)
   │
2. Create 4 Ads (Control + 3 Variants)
   ├─ Change ONE variable per variant
   └─ Assign each to different ab_test_group
   │
3. Let Run 7-14 Days
   │
4. Check Analytics Tab
   ├─ View Control metrics
   ├─ View Variant A metrics
   ├─ View Variant B metrics
   └─ View Variant C metrics
   │
5. Compare Results
   │
6. Scale Winner
   ├─ Increase winner's budget
   └─ Set status to Active
   │
7. Pause Losers
   └─ Set status to Paused
```

---

## 📋 Control Inputs Summary

| Control | Input Type | Database Field | Purpose |
|---------|-----------|-----------------|---------|
| Ad Title | Text | title | Ad identification |
| Placement | Dropdown | placement | Where ad displays |
| Status | Dropdown | status | Control visibility |
| Priority | Number | priority | Control frequency |
| Image Upload | File | image_url | Image ad content |
| Video Upload | File | video_url | Video ad content |
| Click URL | URL | click_url | Landing page |
| Targeting Gender | Dropdown | target_gender | Audience filter |
| Min Age | Number | min_age | Age range start |
| Max Age | Number | max_age | Age range end |
| Target Devices | Checkboxes | target_devices | Device filter |
| Frequency Cap | Number | frequency_cap | Impression limit |
| Budget | Number | budget | Total spend |
| Daily Budget | Number | daily_budget | Daily spend |
| Cost Per Click | Number | cost_per_click | Max CPC |
| Start Date | Date | start_date | Campaign start |
| End Date | Date | end_date | Campaign end |
| A/B Group | Dropdown | ab_test_group | Test variant |
| Campaign | Dropdown | campaign_id | Campaign link |
| Conversion URL | URL | conversion_url | Pixel URL |

---

## 🔄 Data Flow

```
ADMIN INPUT → VALIDATION → DATABASE → TRACKING → ANALYTICS → DISPLAY

Example: Image Ad Creation

User fills form ──→ JavaScript validates ──→ POST /api/admin/ads
   │                        │
   │                    Checks:
   │                    - Title exists
   │                    - Image uploaded
   │                    - Valid dates
   │                    - Budget > 0
   │
   └──→ Backend receives ──→ Insert into ads table ──→ Return ID
                                        │
                                        └──→ Upload image to storage
                                                        │
                                                Ad created!
                                                        │
User sees success ←─ Dashboard updates ←─ Ad appears in list


Example: Analytics View

User selects ad ──→ GET /api/admin/analytics/:adId
                                │
                        Query ad_analytics table
                                │
                        Calculate metrics
                                │
                        Format response
                                │
Display metrics ←─ Dashboard receives ←─ Backend returns
```

---

## 🎛️ Master Control Panel

```
┌─────────────────────────────────────────────────────────────┐
│                      ALL CONTROLS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎬 CONTENT CONTROL                                        │
│  ├─ Image upload/selection                               │
│  ├─ Video upload/selection                               │
│  ├─ Thumbnail selection                                  │
│  ├─ CTA text editing                                     │
│  └─ CTA color selection                                  │
│                                                             │
│  🎯 AUDIENCE CONTROL                                       │
│  ├─ Age range selection                                  │
│  ├─ Gender selection                                     │
│  ├─ Device selection (mobile/tablet/desktop)             │
│  ├─ Frequency capping                                    │
│  └─ Custom targeting (future)                            │
│                                                             │
│  💰 BUDGET CONTROL                                         │
│  ├─ Total campaign budget                                │
│  ├─ Daily spending limit                                 │
│  ├─ Cost per click                                       │
│  └─ Budget status monitoring                             │
│                                                             │
│  📊 PERFORMANCE CONTROL                                    │
│  ├─ View impressions                                     │
│  ├─ View clicks                                          │
│  ├─ View CTR                                             │
│  ├─ View conversions                                     │
│  ├─ View conversion rate                                 │
│  ├─ View device breakdown                                │
│  └─ View dismissal rate                                  │
│                                                             │
│  📅 SCHEDULING CONTROL                                     │
│  ├─ Start date selection                                 │
│  ├─ End date selection                                   │
│  ├─ Countdown duration                                   │
│  └─ Auto-pause scheduling                                │
│                                                             │
│  🧪 TESTING CONTROL                                        │
│  ├─ A/B test group selection                             │
│  ├─ Test variant assignment                              │
│  ├─ Performance comparison                               │
│  └─ Winner scaling                                       │
│                                                             │
│  🎯 CAMPAIGN CONTROL                                       │
│  ├─ Campaign creation                                    │
│  ├─ Ad-to-campaign assignment                            │
│  ├─ Campaign budget setting                              │
│  ├─ Campaign status control                              │
│  └─ Campaign performance tracking                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ All Features Controlled

```
✅ Video Ad Support        → Controlled via Video Upload in All Ads
✅ Image Ad Support        → Controlled via Image Upload in All Ads
✅ Video Player            → Auto-enabled when video ad displays
✅ Advanced Targeting      → Age, Gender, Device dropdowns
✅ Budget Management       → Total, Daily, CPC fields
✅ Analytics Dashboard     → Analytics tab with metrics
✅ Campaign Management     → Campaigns tab with creation
✅ A/B Testing Framework   → A/B test group assignment
✅ Status Control          → Draft/Active/Paused/Completed
✅ Priority Control        → Priority number field
✅ Scheduling              → Start/End date fields
✅ Frequency Capping       → Frequency cap field
✅ Conversion Tracking     → Conversion tracking checkbox
✅ Performance Monitoring  → Analytics metrics display
✅ Device Breakdown        → Device breakdown view in analytics
✅ Dismissal Tracking      → Dismissal rate in analytics
```

---

## 🚀 What Happens When You Use Controls

```
Setting: Change Ad Status to "Active"

Action:
1. User selects "Active" from Status dropdown
2. User clicks "Update Ad"
3. Frontend sends PUT /api/admin/ads/:id with status: "active"
4. Backend validates and updates ads table
5. Ad becomes visible to users in production

Setting: Set A/B Test Group to "Variant A"

Action:
1. User selects "Variant A" from dropdown
2. User creates ad
3. Frontend includes ab_test_group: "variant_a" in POST
4. Backend stores in ads table
5. Ad analytics tagged with variant_a
6. Dashboard's A/B Testing tab groups this ad

Setting: Change Targeting to "Females 18-35"

Action:
1. User sets target_gender: "female"
2. User sets min_age: 18
3. User sets max_age: 35
4. Frontend sends data in PUT/POST
5. Backend stores targeting in ads table
6. Ad system filters impressions by targeting
7. Only matching users see ad

Setting: Set Daily Budget to $50

Action:
1. User enters 50 in Daily Budget field
2. User saves ad/campaign
3. Backend stores daily_budget: 50
4. Ad system tracks daily spending
5. When daily budget reached, ad pauses
6. Resets next day
```

---

## 📞 Summary

**Your admin dashboard provides:**
- ✅ Complete control of all ad features
- ✅ Centralized management interface
- ✅ Real-time analytics monitoring
- ✅ A/B testing framework
- ✅ Campaign organization
- ✅ Budget management
- ✅ Targeting controls
- ✅ Performance tracking
- ✅ Status management
- ✅ Scheduling options

**All accessible from 6 tabs with intuitive controls.**

**Production-ready and fully functional!**

---

**Version 1.0 - Complete Architecture**  
**Status: ✅ Production Ready**
