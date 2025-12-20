# 🎬 Advanced Ad System with Video Support - Complete Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [What's New](#whats-new)
3. [Installation & Setup](#installation--setup)
4. [Features](#features)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Component Documentation](#component-documentation)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Enhanced Ad System is a comprehensive, enterprise-grade advertising platform with full support for:

- **Image Ads** - Traditional static image advertisements
- **Video Ads** - Full-featured video ad playback with controls
- **Carousel Ads** - Multi-slide advertisements
- **Advanced Targeting** - Demographic and device-based targeting
- **Campaign Management** - Create and manage ad campaigns
- **A/B Testing** - Test ad variants and find winners
- **Advanced Analytics** - Detailed performance metrics and ROI tracking
- **Conversion Tracking** - Track user actions and ROI
- **Budget Management** - Daily and total budget controls

---

## ✨ What's New

### 🎬 Video Ad Support
- **VideoAdBanner Component** - Plays video ads with full controls
- **Video Playback Tracking** - Tracks watch duration and completion percentage
- **Thumbnail Support** - Display preview images before playback
- **Controls** - Play/Pause, Volume, Progress, Mute, CTA button

### 📊 Enhanced Analytics
- **Video Metrics** - Watch time, completion rate, pause count
- **ROI Calculation** - Calculate return on ad spend
- **Device Breakdown** - See performance by device type
- **Conversion Tracking** - Track and measure conversions
- **Revenue Analytics** - Track money made from ads

### 🎯 Advanced Targeting
- **Demographic Targeting** - Age range and gender targeting
- **Device Targeting** - Target specific device types
- **Frequency Cap** - Limit impressions per user per day
- **Audience Segments** - Create custom audience groups
- **Location-based** - Target specific regions (with API expansion)

### 🚀 Campaign Management
- **Campaign Dashboard** - Manage multiple ad campaigns
- **Campaign Budgets** - Set total and daily budgets
- **Campaign Goals** - Define objectives (awareness, reach, traffic, conversions)
- **Campaign Status** - Track campaign lifecycle

### 🧪 A/B Testing
- **Multiple Variants** - Test up to 4 ad variations
- **Statistical Analysis** - Determine winning variants
- **Sample Size Control** - Control test audience percentage
- **Confidence Level** - Set statistical confidence level

---

## 🔧 Installation & Setup

### Step 1: Run Database Migration

Run the new migration to add video ad support:

```sql
-- Execute in Supabase SQL Editor:
-- Copy entire contents of: backend/migrations/036_enhanced_ad_system_video_support.sql
-- Paste in Supabase SQL Editor and run
```

**Key tables created:**
- `ads` (enhanced with video columns)
- `ad_video_playback` - Video watch tracking
- `ad_carousel_slides` - Carousel ad slides
- `ad_conversions` - Conversion tracking
- `ad_campaigns` - Campaign management
- `ad_ab_tests` - A/B testing data
- `ad_audience_segments` - Audience definitions

### Step 2: Update Backend Routes

Replace the old ad routes with the new enhanced version:

```bash
# Backup old file
cp backend/routes/adsApi.js backend/routes/adsApi.js.backup

# Use new enhanced version
cp backend/routes/adsApiV2.js backend/routes/adsApi.js
```

Or update `backend/index.js` to use the new route file:

```javascript
import adsApi from './routes/adsApiV2.js';
app.use('/api', adsApi);
```

### Step 3: Update Frontend Components

#### Import VideoAdBanner Component

```javascript
// In your page/component
import { VideoAdBanner } from '../Ads/VideoAdBanner';
import { AdBanner } from '../Ads/AdBanner';
import AdvancedAdsManagement from '../Books/Admin/pages/AdvancedAdsManagement';

// Use in JSX
<VideoAdBanner placement="homepage" limit={1} />
```

#### Add to Admin Routes

Update your admin routing to include the new management page:

```javascript
import AdvancedAdsManagement from './pages/AdvancedAdsManagement';

// In your router
<Route path="/books/admin/ads" element={<AdvancedAdsManagement />} />
```

### Step 4: Test the System

1. **Create an Image Ad**
   - Go to `/books/admin/ads`
   - Click "New Ad"
   - Select "Image Ad"
   - Upload image and configure

2. **Create a Video Ad**
   - Click "New Ad"
   - Select "Video Ad"
   - Upload MP4 video file
   - Upload thumbnail image

3. **Test on Page**
   - Add to your page: `<VideoAdBanner placement="homepage" />`
   - Open page and verify ad displays
   - Test controls and tracking

---

## 🎨 Features

### 1. Image Ads
```jsx
<AdBanner 
  placement="homepage"
  limit={1}
  className="my-ad"
  autoPlay={true}
/>
```

**Features:**
- Click-through tracking
- Impression tracking
- Dismiss tracking
- Countdown timer
- Skippable/non-skippable

### 2. Video Ads
```jsx
<VideoAdBanner 
  placement="homepage"
  limit={1}
  autoPlay={true}
/>
```

**Features:**
- Play/Pause controls
- Volume control
- Progress bar
- Watch percentage tracking
- Completion detection
- Pause count tracking
- Custom CTA button

### 3. Advanced Targeting

Create ads with demographic targeting:

```javascript
{
  title: "Premium Course",
  adType: "video",
  placement: "homepage",
  
  // Targeting
  minAge: 18,
  maxAge: 65,
  targetGender: "all",
  targetDevices: ["mobile", "tablet", "desktop"],
  frequencyCap: 3, // Max 3 impressions per user per day
  
  // Budget
  budget: 1000,
  dailyBudget: 50,
  costPerClick: 0.75,
  
  // Conversion
  conversionTracking: true,
  conversionUrl: "https://analytics.com/pixel"
}
```

### 4. Campaign Management

Create and manage campaigns:

```javascript
{
  name: "Spring Sale 2024",
  description: "Promote spring products",
  objective: "conversions", // awareness, reach, traffic, conversions
  budget: 5000,
  dailyBudget: 100,
  startDate: "2024-03-01",
  endDate: "2024-03-31",
  status: "active"
}
```

### 5. A/B Testing

Run experiments to find best ad:

```javascript
{
  name: "Homepage Ad Test",
  campaign_id: "...",
  control_ad_id: "...",
  variant_a_ad_id: "...",
  variant_b_ad_id: "...",
  testDurationDays: 7,
  sampleSizePercent: 50,
  confidenceLevel: 0.95,
  status: "active"
}
```

---

## 📖 Usage Guide

### Creating an Image Ad

1. Go to **Admin > Ad Management** (`/books/admin/ads`)
2. Click **"New Ad"** button
3. Select **"Image Ad"** type
4. Fill in details:
   - Title: "Summer Sale"
   - Upload image file
   - Click URL: "https://yoursite.com/summer-sale"
   - CTA Text: "Shop Now"
   - Placement: "Homepage"
5. Configure advanced options:
   - Budget: $500
   - Daily Budget: $50
   - Status: "Active"
   - Priority: 10
6. Click **"Create Ad"**

### Creating a Video Ad

1. Go to **Admin > Ad Management**
2. Click **"New Ad"**
3. Select **"Video Ad"** type
4. Fill in details:
   - Title: "Product Demo"
   - Upload video file (MP4)
   - Upload thumbnail image
   - Click URL: "https://yoursite.com/product"
5. Configure video settings:
   - Countdown Duration: 10 seconds
   - Allow Skip: Yes
   - CTA Text: "Learn More"
6. Set targeting:
   - Target Devices: All
   - Target Age: 18-65
   - Gender: All
7. Set budget:
   - Total Budget: $1000
   - Daily Budget: $75
   - Cost Per Click: $0.50
8. Click **"Create Ad"**

### Adding Ad to Page

```jsx
import { VideoAdBanner } from '@/SomaLux/Ads/VideoAdBanner';

function HomePage() {
  return (
    <div>
      <h1>Welcome</h1>
      
      {/* Video ads with 10 second countdown */}
      <VideoAdBanner placement="homepage" limit={1} />
      
      <p>Your content here...</p>
    </div>
  );
}
```

### Tracking Conversions

Log conversions from external sources:

```javascript
// Call this when user completes an action (purchase, signup, etc.)
async function logConversion(adId, value) {
  const response = await fetch('http://localhost:5000/api/ad-conversion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adId: adId,
      conversionType: 'purchase',
      conversionValue: value,
      referralSource: 'ad'
    })
  });
  return response.json();
}

// Use it
logConversion('ad-uuid-here', 99.99);
```

### Viewing Analytics

1. Go to **Admin > Ad Analytics** (`/books/admin/ad-analytics`)
2. Select ad from dropdown
3. View metrics:
   - Impressions
   - Clicks
   - Click-Through Rate (CTR)
   - Device breakdown
   - Daily engagement
   - Conversion data

### Monitoring Video Performance

1. Go to **Admin > Video Ads** tab
2. Click on a video ad to see:
   - Total plays
   - Completion rate
   - Average watch percentage
   - Average play duration
   - Total pauses
   - Device breakdown

---

## 🔌 API Reference

### Get Ads by Placement

```
GET /api/ads/:placement?limit=5&type=video
```

**Parameters:**
- `placement` (required): "homepage", "sidebar", "modal", "feed", "books", "authors", "papers"
- `limit` (optional): Max ads to return, default 5
- `type` (optional): Filter by ad type "image", "video", "carousel"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Ad Title",
      "ad_type": "video",
      "image_url": "/ads/image.jpg",
      "video_url": "/ads/video.mp4",
      "video_duration": 30,
      "click_url": "https://example.com",
      "cta_text": "Learn More",
      "cta_button_color": "#007bff",
      "placement": "homepage",
      "countdown_seconds": 10,
      "is_skippable": true,
      "status": "active",
      "total_impressions": 1500,
      "total_clicks": 75,
      "total_dismisses": 200
    }
  ]
}
```

### Log Impression

```
POST /api/ad-impression
```

**Request:**
```json
{
  "adId": "uuid",
  "placement": "homepage",
  "userId": "user-uuid",
  "viewDuration": 0,
  "deviceType": "mobile",
  "videoAd": true
}
```

### Log Click

```
POST /api/ad-click
```

**Request:**
```json
{
  "adId": "uuid",
  "placement": "homepage",
  "userId": "user-uuid",
  "viewDuration": 5,
  "deviceType": "mobile",
  "videoAd": true,
  "watchedPercentage": 45
}
```

### Log Video Completion

```
POST /api/ad-video-completion
```

**Request:**
```json
{
  "adId": "uuid",
  "placement": "homepage",
  "userId": "user-uuid",
  "videoDuration": 30,
  "playDuration": 28,
  "percentageWatched": 93,
  "completed": true,
  "pausedCount": 2,
  "deviceType": "mobile"
}
```

### Log Conversion

```
POST /api/ad-conversion
```

**Request:**
```json
{
  "adId": "uuid",
  "userId": "user-uuid",
  "conversionType": "purchase",
  "conversionValue": 99.99,
  "pixelId": "pixel-id",
  "referralSource": "ad"
}
```

### Create Ad (Admin)

```
POST /api/admin/ads
```

**Request:**
```json
{
  "title": "Summer Sale",
  "adType": "video",
  "imageUrl": "/ads/image.jpg",
  "videoUrl": "/ads/video.mp4",
  "videoDuration": 30,
  "videoThumbnailUrl": "/ads/thumb.jpg",
  "clickUrl": "https://example.com/sale",
  "ctaText": "Shop Now",
  "ctaButtonColor": "#FF6B6B",
  "placement": "homepage",
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "countdownSeconds": 10,
  "isSkippable": true,
  "status": "active",
  "priority": 10,
  "budget": 1000,
  "dailyBudget": 50,
  "costPerClick": 0.75,
  "minAge": 18,
  "maxAge": 65,
  "targetGender": "all",
  "targetDevices": "[\"mobile\", \"tablet\", \"desktop\"]",
  "frequencyCap": 3,
  "conversionTracking": true,
  "conversionUrl": "https://analytics.com/pixel",
  "abTestGroup": "control"
}
```

### Get Analytics

```
GET /api/admin/analytics/:adId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ad": { ... },
    "totalEvents": 2500,
    "impressions": 1500,
    "clicks": 75,
    "dismisses": 200,
    "videoPlays": 800,
    "conversions": 12,
    "avgViewDuration": 5.3,
    "ctr": 5.00,
    "conversionRate": 16.00,
    "deviceBreakdown": {
      "mobile": 1200,
      "tablet": 200,
      "desktop": 100
    }
  }
}
```

### Get Video Analytics

```
GET /api/admin/analytics/video/:adId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPlays": 800,
    "completedPlays": 720,
    "avgWatchPercentage": 87.5,
    "avgPlayDuration": 26.4,
    "totalPauses": 145,
    "completionRate": 90.00,
    "detailedData": [ ... ]
  }
}
```

---

## 💾 Database Schema

### ads Table
```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  ad_type VARCHAR(50) DEFAULT 'image',
  description TEXT,
  
  -- Media
  image_url VARCHAR(2048),
  video_url VARCHAR(2048),
  video_duration INTEGER DEFAULT 0,
  video_thumbnail_url VARCHAR(2048),
  
  -- Click & CTA
  click_url VARCHAR(2048),
  cta_text VARCHAR(100) DEFAULT 'Learn More',
  cta_button_color VARCHAR(20) DEFAULT '#007bff',
  
  -- Placement & Timing
  placement VARCHAR(50) NOT NULL,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  countdown_seconds INTEGER DEFAULT 10,
  is_skippable BOOLEAN DEFAULT true,
  
  -- Campaign & Status
  campaign_id UUID,
  campaign_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Budget
  budget DECIMAL(10, 2),
  daily_budget DECIMAL(10, 2),
  budget_spent DECIMAL(10, 2) DEFAULT 0,
  cost_per_click DECIMAL(10, 2) DEFAULT 0.5,
  
  -- Targeting
  min_age INTEGER DEFAULT 0,
  max_age INTEGER DEFAULT 100,
  target_gender VARCHAR(50),
  target_devices TEXT, -- JSON
  target_locations TEXT, -- JSON
  target_interests TEXT, -- JSON
  frequency_cap INTEGER DEFAULT 0,
  
  -- Conversion
  conversion_tracking BOOLEAN DEFAULT false,
  conversion_url VARCHAR(2048),
  pixel_id VARCHAR(255),
  
  -- Testing
  ab_test_group VARCHAR(50) DEFAULT 'control',
  ab_test_id UUID,
  
  -- Stats
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_dismisses INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ad_video_playback Table
```sql
CREATE TABLE ad_video_playback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id),
  user_id VARCHAR(255),
  placement VARCHAR(50),
  device_type VARCHAR(50),
  video_duration INTEGER,
  play_duration INTEGER,
  percentage_watched INTEGER,
  completed BOOLEAN DEFAULT false,
  paused_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### ad_conversions Table
```sql
CREATE TABLE ad_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id),
  user_id VARCHAR(255),
  conversion_type VARCHAR(100),
  conversion_value DECIMAL(10, 2) DEFAULT 0,
  pixel_id VARCHAR(255),
  referral_source VARCHAR(255),
  converted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧩 Component Documentation

### VideoAdBanner Component

**Location:** `src/SomaLux/Ads/VideoAdBanner.jsx`

**Props:**
```typescript
interface VideoAdBannerProps {
  placement: string;        // Required: Ad placement
  limit?: number;           // Optional: Number of ads to display (default: 1)
  className?: string;       // Optional: CSS class
  autoPlay?: boolean;       // Optional: Auto-play video (default: true)
}
```

**Features:**
- Auto-loads video ads from backend
- Play/Pause controls
- Volume control
- Progress bar
- Watch percentage tracking
- Pause counting
- CTA button with custom color
- Responsive design
- Mobile-friendly controls

**Usage:**
```jsx
import { VideoAdBanner } from '@/Ads/VideoAdBanner';

export default function HomePage() {
  return (
    <div>
      <VideoAdBanner 
        placement="homepage"
        limit={1}
        autoPlay={true}
      />
    </div>
  );
}
```

### AdvancedAdsManagement Component

**Location:** `src/SomaLux/Books/Admin/pages/AdvancedAdsManagement.jsx`

**Features:**
- Create image and video ads
- Edit ads
- Delete ads
- Manage campaigns
- View video ad performance
- File upload (images, videos, thumbnails)
- Advanced targeting options
- Budget configuration
- A/B testing setup

**Tabs:**
1. **All Ads** - Manage all ads
2. **Campaigns** - View and manage campaigns
3. **Video Ads** - Monitor video ad performance

---

## 🚀 Advanced Features

### 1. A/B Testing

Create an A/B test:

```javascript
POST /api/admin/ab-tests

{
  "name": "Homepage Ad Test",
  "description": "Test two video ads",
  "campaign_id": "uuid",
  "control_ad_id": "uuid-1",
  "variant_a_ad_id": "uuid-2",
  "variant_b_ad_id": "uuid-3",
  "test_duration_days": 7,
  "sample_size_percent": 50,
  "confidence_level": 0.95,
  "status": "active"
}
```

The system will automatically split traffic between ad variants and track performance.

### 2. Audience Segmentation

Create custom audience segments:

```javascript
POST /api/admin/audience-segments

{
  "name": "High Value Customers",
  "description": "Users with 3+ purchases",
  "segment_criteria": {
    "min_purchases": 3,
    "min_lifetime_value": 500,
    "countries": ["US", "CA", "UK"]
  }
}
```

### 3. Budget Management

Set daily and campaign budgets:

```javascript
{
  "budget": 1000,           // Total campaign budget
  "dailyBudget": 50,        // Daily spend limit
  "costPerClick": 0.75,     // How much to pay per click
  "budget_spent": 0         // Auto-tracked
}
```

### 4. Conversion Pixel Tracking

Integrate with external analytics:

```javascript
{
  "conversionTracking": true,
  "conversionUrl": "https://analytics.facebook.com/pixel/12345",
  "pixelId": "fb-pixel-12345"
}
```

### 5. Performance Reporting

Get ROI and performance data:

```javascript
GET /api/admin/roi/:adId

// Response
{
  "ad_id": "uuid",
  "total_cost": 500.00,
  "total_revenue": 1500.00,
  "total_conversions": 15,
  "roi_percent": 200.00,
  "roas": 3.00  // Revenue per dollar spent
}
```

---

## 🛠️ Troubleshooting

### Video Ad Not Loading

**Problem:** Video ad doesn't appear on page

**Solutions:**
1. Check backend is running: `netstat -ano | findstr "5000"`
2. Verify video file is uploaded: Check admin panel
3. Check browser console for errors (F12)
4. Verify ad status is "active"
5. Check database migration was applied

### Video Won't Play

**Problem:** Video button shows but video doesn't play

**Solutions:**
1. Check video format is MP4
2. Verify video URL is correct
3. Check browser console for 404 errors
4. Ensure CORS is configured if using external video
5. Test video URL directly in browser

### Analytics Not Tracking

**Problem:** Impressions/clicks not being recorded

**Solutions:**
1. Check backend is receiving requests (check logs)
2. Verify database tables exist: Run migration again
3. Check network tab in DevTools for failed requests
4. Verify adId is correct UUID
5. Check Supabase connection string in .env

### Ads Not Showing

**Problem:** Component renders but no ads appear

**Solutions:**
1. Create ads in admin panel first
2. Verify ads status is "active"
3. Check placement matches: "homepage" = "homepage"
4. Verify start_date is in past
5. Check inventory - ads may be dismissed or closed

### Performance Issues

**Problem:** Video playback is laggy

**Solutions:**
1. Compress video file (target < 10MB for 30 seconds)
2. Use appropriate bitrate (2-5 Mbps)
3. Reduce video resolution if needed
4. Check network speed
5. Try different browser

---

## 📊 Metrics Reference

### Key Metrics

| Metric | Formula | Meaning |
|--------|---------|---------|
| **Impressions** | Count of impressions | Number of times ad was shown |
| **Clicks** | Count of clicks | Number of clicks on ad |
| **CTR** | (Clicks / Impressions) × 100 | Click-through rate percentage |
| **Conversions** | Count of conversions | Number of user actions completed |
| **Conversion Rate** | (Conversions / Clicks) × 100 | Percentage of clicks that converted |
| **ROAS** | Total Revenue / Total Cost | Revenue per dollar spent |
| **ROI** | ((Revenue - Cost) / Cost) × 100 | Return on investment percentage |
| **CPM** | (Total Cost / Impressions) × 1000 | Cost per 1,000 impressions |
| **CPC** | Total Cost / Clicks | Cost per click |

### Video Metrics

| Metric | Meaning |
|--------|---------|
| **Plays** | Number of times video started playing |
| **Completion Rate** | % of plays that completed |
| **Avg Watch %** | Average percentage of video watched |
| **Avg Watch Time** | Average duration video was watched |
| **Pauses** | Number of times user paused |
| **Completion Count** | Total videos watched to end |

---

## 🎓 Best Practices

### 1. Video Ad Optimization
- Keep videos under 30 seconds
- Use compelling thumbnail
- Add clear call-to-action
- Test different video lengths
- Monitor completion rate

### 2. Targeting
- Start broad, then narrow down
- Use demographics relevant to product
- Test different age ranges
- Monitor device performance
- Adjust frequency cap based on performance

### 3. Budget Management
- Start with small daily budget
- Monitor daily spend
- Increase budget for performing ads
- Pause underperforming ads
- Set clear campaign end date

### 4. Testing
- Run A/B tests for 7+ days minimum
- Test one element at a time
- Achieve statistical significance
- Use 50%+ of traffic for test
- Scale winning variants

### 5. Analytics Monitoring
- Check metrics daily
- Monitor ROI and ROAS
- Track conversion value
- Adjust targeting based on performance
- Create weekly reports

---

## 📞 Support

For issues or questions:

1. Check **Troubleshooting** section
2. Review **API Reference** for integration
3. Check browser console (F12)
4. Check backend logs
5. Verify database tables exist

---

**Version:** 2.0  
**Last Updated:** December 2024  
**Status:** Production Ready ✅

