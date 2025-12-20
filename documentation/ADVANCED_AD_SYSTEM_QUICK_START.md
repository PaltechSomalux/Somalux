# 🚀 Advanced Ad System - Quick Setup (5 Minutes)

## Step 1: Database Migration (2 minutes)

1. Open Supabase SQL Editor
2. Copy entire contents of: `backend/migrations/036_enhanced_ad_system_video_support.sql`
3. Paste into SQL Editor
4. Click "RUN" button
5. Wait for "Success" message ✅

## Step 2: Update Backend (1 minute)

**Option A: Replace file**
```bash
cp backend/routes/adsApiV2.js backend/routes/adsApi.js
```

**Option B: Update routes in index.js**
```javascript
// In backend/index.js
import adsApi from './routes/adsApiV2.js';
app.use('/api', adsApi);
```

Restart backend:
```bash
cd backend
npm start
```

## Step 3: Add Components to Frontend (1 minute)

Copy these files to your frontend:
```
✅ src/SomaLux/Ads/VideoAdBanner.jsx
✅ src/SomaLux/Ads/VideoAdBanner.css
✅ src/SomaLux/Books/Admin/pages/AdvancedAdsManagement.jsx
✅ src/SomaLux/Books/Admin/pages/AdvancedAdsManagement.css
```

## Step 4: Update Admin Routes (1 minute)

Add this to your admin routing:

```javascript
import AdvancedAdsManagement from './pages/AdvancedAdsManagement';

// In your router
<Route path="/books/admin/ads" element={<AdvancedAdsManagement />} />
```

## Step 5: Use in Your Pages

### Add Video Ad
```jsx
import { VideoAdBanner } from '@/Ads/VideoAdBanner';

<VideoAdBanner placement="homepage" limit={1} />
```

### Add Image Ad
```jsx
import { AdBanner } from '@/Ads/AdBanner';

<AdBanner placement="homepage" limit={1} />
```

## Test It! 🧪

1. Go to `/books/admin/ads`
2. Click "New Ad"
3. Create a video ad:
   - Title: "Test Video"
   - Select "Video Ad"
   - Upload MP4 video
   - Upload thumbnail image
   - Click "Create Ad"
4. View on page where you added `<VideoAdBanner />`
5. Test controls: Play, Pause, Volume, Progress bar
6. Click "CTA" button
7. Check Analytics at `/books/admin/ad-analytics`

## ✅ Verification Checklist

- [ ] Database migration ran successfully
- [ ] Backend updated and running on port 5000
- [ ] Components copied to frontend
- [ ] Admin route added
- [ ] Can access `/books/admin/ads`
- [ ] Can create image ad
- [ ] Can create video ad
- [ ] Video ad displays on page
- [ ] Video controls work
- [ ] Analytics show impressions/clicks

## 🎯 Next Steps

1. **Create more ads** - Try different formats and targeting
2. **Monitor analytics** - Go to ad analytics dashboard
3. **Set budgets** - Configure daily/total budget
4. **Run A/B tests** - Test different ad variants
5. **Track conversions** - Log user actions as conversions
6. **Optimize** - Pause underperforming ads, scale winners

## 📞 Troubleshooting

**Video doesn't play?**
- Make sure it's MP4 format
- Check file size (under 50MB recommended)
- Check browser console for errors

**Ad doesn't show?**
- Create ad first in admin panel
- Make sure status is "active"
- Check placement matches

**Analytics empty?**
- Wait a moment for data to sync
- Check browser console (F12) for errors
- Verify ad was viewed

## 📚 Full Documentation

For complete documentation, see: `ADVANCED_AD_SYSTEM_GUIDE.md`

---

**You're all set! Happy advertising! 🎬**
