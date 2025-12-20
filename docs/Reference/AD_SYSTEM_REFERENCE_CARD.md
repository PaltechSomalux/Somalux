# 📱 Ad System - Visual Reference Card

## The Ad Display (What Users See)

```
┌──────────────────────────────────────────────┐
│                                              │
│  [Your Ad Image Here - Clickable]           │
│                                              │
│  Ad ────────────────── 7s ──────── ✕  │
│  (Label)    (empty space)  (timer) (close)   │
│                                              │
└──────────────────────────────────────────────┘
```

## Colors & Styling

```
Background Gradient: Dark blue (#0b141a) to dark (#020817)
Countdown Circle: Dark with white text
Close Button: Black bg, red on hover
Label: White text on dark background
Ad Image: Full width, max 300px height
```

## Admin Dashboard Locations

```
Main Admin: /books/admin
    ↓
    ├─ Ads (/books/admin/ads)
    │  ├─ Create new ad
    │  ├─ Edit existing
    │  └─ Delete ads
    │
    └─ Ad Analytics (/books/admin/ad-analytics)
       ├─ View metrics
       ├─ Device breakdown
       ├─ Daily engagement
       └─ Date range filter
```

## Metrics at a Glance

```
IMPRESSIONS (Views)      CLICKS        CTR           DISMISSES
    150                    12         8%               5
   ┌─────┐               ┌─────┐    ┌─────┐        ┌─────┐
   │■ ■ │               │✓    │    │8%   │        │✕    │
   └─────┘               └─────┘    └─────┘        └─────┘
   (how many seen)    (how many     (efficiency)  (closed
                      clicked)                     without
                                                   clicking)
```

## How Ad Is Used (Code)

```jsx
// 1️⃣ Import
import { AdBanner } from '../Ads/AdBanner';

// 2️⃣ Use
<AdBanner placement="homepage" limit={1} />

// 3️⃣ Props Available
placement    → Required: "homepage" | "sidebar" | "modal" | "feed"
limit        → Optional: How many ads (default: 1)
className    → Optional: CSS class to apply
```

## Analytics Data Flow

```
User Visits Page
    ↓
Ad Displays
    ↓
IMPRESSION LOGGED
├─ ad_id
├─ placement
├─ device_type (mobile/tablet/desktop)
├─ user_agent
└─ timestamp
    ↓
Countdown Starts (10s)
    ↓
User Action
├─ CLICK → Opens URL
│  └─ view_duration = 5s
│  └─ Logged in ad_clicks
│
└─ DISMISS → Closes ad
   └─ view_duration = 3s
   └─ Logged in ad_dismissals
    ↓
Analytics Calculated
├─ CTR = (clicks / impressions) %
├─ Engagement = (interactions / impressions) %
└─ Updated in Dashboard
```

## Database Tables

```
ADS TABLE (existing + new columns)
├─ id, title, image_url, click_url, placement
├─ start_date, end_date
├─ is_active, is_skippable
├─ countdown_seconds ✨ NEW
├─ total_impressions ✨ NEW
├─ total_clicks ✨ NEW
└─ total_dismisses ✨ NEW

AD_ANALYTICS ✨ NEW (main tracking)
├─ id, ad_id, user_id, placement
├─ event_type (impression|click|dismiss|skip)
├─ view_duration, device_type, user_agent
└─ created_at

AD_ENGAGEMENT_METRICS ✨ NEW (daily summary)
├─ ad_id, placement, date_recorded
├─ impressions, clicks, dismisses, skips
├─ mobile/tablet/desktop counts
├─ avg_view_duration, ctr%, completion_rate%
└─ updated_at

AD_DISMISSALS ✨ NEW (dismiss details)
├─ ad_id, user_id, placement
├─ view_duration, device_type
└─ dismissal_time
```

## API Endpoints Summary

```
GET /api/ads/:placement          Fetch active ads
├─ Returns: [{ id, title, image_url, click_url, countdown_seconds... }]

POST /api/ad-impression          Log view
├─ Body: { adId, placement, deviceType, userAgent }

POST /api/ad-click              Log click
├─ Body: { adId, placement, viewDuration, deviceType }

POST /api/ad-dismiss            Log dismiss
├─ Body: { adId, placement, viewDuration, deviceType }

GET /api/admin/analytics/all     All ads performance
├─ Returns: [{ id, title, impressions, clicks, ctr... }]

GET /api/admin/analytics/:id    Single ad metrics
├─ Returns: { impressions, clicks, avgDuration, deviceBreakdown... }

GET /api/admin/analytics/:id/engagement
├─ Returns: { 2025-12-06: { impressions: 25, clicks: 2... }... }
```

## Configuration Matrix

```
AD FIELD           TYPE              RANGE/OPTIONS       REQUIRED
─────────────────────────────────────────────────────────────────
Title              Text              Any string          ✓ YES
Image URL          URL               HTTP(s) or /ads/*   ✓ YES
Click URL          URL               HTTP(s)             ✗ NO
Placement          Dropdown          5 options           ✓ YES
Start Date         Date              Past/future         ✗ NO
End Date           Date              After start         ✗ NO
Countdown          Number            3-60 seconds        ✗ NO (def: 10)
Skippable          Boolean           Yes/No              ✗ NO (def: Yes)
```

## Placements Reference

```
┌─────────────────────────────────────────────────────┐
│ HOMEPAGE          │ SIDEBAR         │ MODAL           │
│ [Large Banner]    │ [Vertical]      │ [Popup]         │
│ 600x300px         │ 300x250px       │ 400x200px       │
└─────────────────────────────────────────────────────┘

┌────────────────────────┬─────────────────────────────┐
│ FEED                   │ BOOKS                       │
│ [Between items]        │ [Page specific]             │
│ 400x300px              │ Custom sizes                │
└────────────────────────┴─────────────────────────────┘
```

## Countdown Timer States

```
Time Remaining:

 10s          5s          1s          0s
╭─────╮    ╭─────╮    ╭─────╮    ╭─────╮
│ 10  │    │  5  │    │  1  │    │  0  │
╰─────╯    ╰─────╯    ╰─────╯    ╰─────╯
Active     Counting    Final       Auto-close
                       second      or user
                                   closed
```

## Performance Indicators

```
CTR STATUS
═══════════════════════════════════
< 2%  : Needs work 🔴
2-5%  : Good        🟡
5-10% : Great       🟢
10%+  : Excellent   🟢✨

COMPLETION RATE
═══════════════════════════════════
< 50% : Low         🔴
50-70%: Medium      🟡
70-85%: Good        🟢
85%+  : Excellent   🟢✨

DEVICE DISTRIBUTION
═══════════════════════════════════
Mobile   > 60% : Mobile-first app
Tablet   10-20%: Secondary
Desktop  20-40%: Consider focus
```

## Quick Decision Tree

```
WANT TO...
    │
    ├─ Create an ad?
    │  └─ Go to /books/admin/ads → Click "+ New Ad"
    │
    ├─ View performance?
    │  └─ Go to /books/admin/ad-analytics
    │
    ├─ Change countdown?
    │  └─ Edit ad → Change "Countdown Duration"
    │
    ├─ Make un-skippable?
    │  └─ Edit ad → Set "Skippable" to "No"
    │
    ├─ Display ad on page?
    │  └─ <AdBanner placement="homepage" />
    │
    └─ Check device stats?
       └─ Go to Analytics → Scroll to "Device Breakdown"
```

## File Structure

```
src/SomaLux/
├─ Ads/
│  ├─ AdBanner.jsx           ← Display component
│  └─ AdBanner.css           ← Styling
│
└─ Books/Admin/
   └─ pages/
      ├─ AdsManagement.jsx   ← Admin CRUD
      ├─ AdsManagement.css
      ├─ AdAnalytics.jsx     ← Dashboard
      └─ AdAnalytics.css

backend/
├─ routes/
│  └─ adsApi.js              ← All endpoints
│
└─ migrations/
   └─ 012_enhanced_ad_analytics.sql
```

## Keyboard Shortcuts (Admin)

```
/books/admin/ads           ← Manage ads
/books/admin/ad-analytics  ← View analytics
```

## Common Values

```
DEFAULT COUNTDOWN     → 10 seconds
MIN COUNTDOWN         → 3 seconds
MAX COUNTDOWN         → 60 seconds
DEFAULT PLACEMENT     → "homepage"
DEFAULT SKIPPABLE     → true
AD IMAGE MAX HEIGHT   → 300px (desktop)
AD IMAGE MAX HEIGHT   → 200px (mobile)
```

## Error Messages & Solutions

```
❌ "No ads available"
   └─ Create an ad first, or check is_active=true

❌ "Failed to load ads"
   └─ Backend not running, check port 5000

❌ Countdown not showing
   └─ Check CSS loaded, verify countdown_seconds > 0

❌ Analytics empty
   └─ No events logged, check browser console

❌ Image not loading
   └─ Invalid URL, check image exists
```

## Stats to Watch

```
Daily Checks (5 min)
├─ New impressions
├─ Click rate
└─ Device mix

Weekly Review (15 min)
├─ Trending CTR
├─ Top performing day
└─ Device performance

Monthly Analysis (30 min)
├─ Overall ROI
├─ Best placements
└─ Optimization ideas
```

## Next Features (Ideas)

```
Future Enhancements
├─ A/B testing framework
├─ Geo-targeting
├─ User segmentation
├─ Schedule optimization
├─ Revenue tracking
├─ Custom reporting
└─ Automated optimization
```

---

**Print this page for quick reference!** 📋
