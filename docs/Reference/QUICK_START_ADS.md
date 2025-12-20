# 🚀 Quick Start - Enhanced Ad System

## In 5 Minutes ⏱️

### 1. Database Migration (1 min)
```bash
# Run in Supabase SQL editor:
→ backend/migrations/012_enhanced_ad_analytics.sql
```

### 2. Create Ad (1 min)
1. Go to `/books/admin` → Click **"Ads"**
2. Click **"+ New Ad"**
3. Fill form:
   - Title: `Summer Promo`
   - Image: `https://via.placeholder.com/600x300`
   - Placement: `homepage`
   - Countdown: `10` seconds
4. Click **"Create Ad"**

### 3. Display Ad (1 min)
```jsx
// In your page component:
import { AdBanner } from '../Ads/AdBanner';

export function HomePage() {
  return (
    <div>
      {/* Your content */}
      <AdBanner placement="homepage" limit={1} />
    </div>
  );
}
```

### 4. View Analytics (1 min)
1. Go to `/books/admin` → Click **"Ad Analytics"**
2. Select your ad
3. See: Impressions, Clicks, CTR, Device breakdown
4. Filter by date range

### 5. Optimize (1 min)
- Check which devices convert best
- Monitor CTR and completion rate
- Adjust countdown if needed
- Track engagement trends

---

## 🎯 Key Features

### Ad Display
```
[Your Ad Image]
Ad ────────────── 8s ─────── ✕
(Click to open URL)  (countdown) (close)
```

### Analytics Tracked
- **Impressions**: Views
- **Clicks**: Interactions  
- **Dismisses**: Closed without clicking
- **View Duration**: Time watched
- **Device Type**: Mobile/Tablet/Desktop
- **CTR**: Click-Through Rate

---

## 📍 Ad Placements

```
homepage  → Main page banner
sidebar   → Side panel ad
modal     → Popup dialog
feed      → Feed item ad
books     → Books page specific
```

---

## 🔗 Key Endpoints

```
GET  /api/ads/:placement          → Fetch ads
POST /api/ad-impression           → Log view
POST /api/ad-click                → Log click
POST /api/ad-dismiss              → Log dismiss
GET  /api/admin/analytics/all     → All ads performance
GET  /api/admin/analytics/:adId   → Specific ad metrics
```

---

## 💾 Local Files

Store ads in: `/public/ads/image.jpg`

Reference as: `/ads/image.jpg`

Or use full URLs: `https://example.com/image.jpg`

---

## 📊 Admin Dashboard

### Ads Management (`/books/admin/ads`)
- Create, Edit, Delete ads
- Set countdown duration
- Control skippability

### Ad Analytics (`/books/admin/ad-analytics`)
- View real-time metrics
- Device breakdown
- Daily engagement
- Performance trends

---

## 🧪 Quick Test

1. Create ad with 5s countdown
2. Add to page
3. Watch countdown
4. Click or dismiss
5. Check analytics update

---

## ⚡ Common Tasks

### Make Ad Non-Skippable
In AdsManagement form: Set **Skippable** → "No"

### Change Countdown
In AdsManagement form: Set **Countdown Duration** → (3-60 seconds)

### View Device Stats
Go to Analytics → See "Device Breakdown" section

### Export Daily Data
Query Supabase `ad_analytics` table filtered by date

### Find Best Performers
Go to Analytics → Sort by CTR percentage

---

## 🎬 AdBanner Props

```jsx
<AdBanner 
  placement="homepage"    // Required: where ad shows
  limit={1}              // Optional: how many ads (default: 1)
  className="main-ad"    // Optional: CSS class
/>
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Ad not showing | Check `is_active=true`, valid placement |
| Countdown missing | Verify CSS loaded, check `countdown_seconds` |
| Analytics not recording | Check backend running, Supabase connected |
| Image not loading | Verify URL valid, use full HTTPS path |

---

## 📈 Success Metrics

Monitor these KPIs:
- **CTR** > 5% = Good
- **Completion Rate** > 70% = Excellent
- **Engagement Rate** > 15% = Strong
- **Mobile CTR** similar to desktop = Well optimized

---

## 🔄 Next Steps

1. ✅ Run migration
2. ✅ Create ad
3. ✅ Display on page
4. ✅ Monitor analytics
5. ✅ Optimize based on data
6. ✅ A/B test variations
7. ✅ Scale what works

---

## 📚 Full Documentation

See: `ENHANCED_AD_SYSTEM_GUIDE.md`

---

## 💬 Support

Issues? Check:
1. Supabase tables created (012_enhanced_ad_analytics.sql)
2. Ad marked `is_active = true`
3. Backend running on :5000
4. Browser console for errors
5. Network tab for failed requests
