# SomaLux Ad System Documentation

## Overview
The ad system allows you to display targeted advertisements throughout your SomaLux platform while tracking impressions and clicks.

## Architecture

### Backend Components
1. **`backend/routes/adsApi.js`** - API endpoints for serving ads and logging analytics
2. **`backend/migrations/011_ad_system.sql`** - Database schema for ads, impressions, and clicks

### Frontend Components
1. **`src/SomaLux/Ads/AdBanner.jsx`** - Reusable ad component
2. **`src/SomaLux/Ads/AdBanner.css`** - Ad styling

## API Endpoints

### User Endpoints
```
GET /ads/:placement
  - Fetches active ads for a specific placement
  - Query: limit (default: 5)
  - Returns: { success: true, data: [ads] }

POST /ad-impression
  - Logs when an ad is viewed
  - Body: { adId, userId?, placement, viewDuration? }

POST /ad-click
  - Logs when an ad is clicked
  - Body: { adId, userId?, placement }
```

### Admin Endpoints
```
POST /admin/ads
  - Creates a new ad
  - Body: { title, imageUrl, clickUrl?, placement, startDate?, endDate? }
  - Returns: { success: true, data: ad }
```

## Ad Placements
You can define custom placements for different sections:
- `homepage` - Homepage banner
- `sidebar` - Sidebar ad
- `modal` - Modal popup
- `feed` - Feed-based ads
- `custom` - Any custom placement

## Usage Examples

### 1. Add an Ad Banner to BookManagement
```jsx
import { AdBanner } from '../Ads/AdBanner';

export const BookManagement = () => {
  return (
    <div className="book-management">
      {/* Existing content */}
      <AdBanner placement="homepage" limit={1} className="main-ad" />
      
      {/* More content */}
      <div className="content">
        {/* Your content here */}
      </div>
      
      {/* Sidebar ad */}
      <AdBanner placement="sidebar" limit={3} className="sidebar-ad" />
    </div>
  );
};
```

### 2. Add Ad to Any Component
```jsx
import { AdBanner } from '../Ads/AdBanner';

function YourComponent() {
  return (
    <div>
      <h1>Your Content</h1>
      <AdBanner placement="custom-placement" />
    </div>
  );
}
```

### 3. Create an Ad via Admin API (Node.js)
```javascript
const newAd = await axios.post('http://localhost:5001/admin/ads', {
  title: "Featured Book Deal",
  imageUrl: "https://example.com/ad-image.jpg",
  clickUrl: "https://example.com/offer",
  placement: "homepage",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days
});
```

## Database Setup

### 1. Run the Migration
```bash
cd backend
# Connect to your Supabase database and run:
# migrations/011_ad_system.sql
```

Or use the Supabase SQL editor to run the SQL file.

### 2. Environment Variables
Add to your `.env` file:
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Analytics & Tracking

The system automatically tracks:
- **Impressions**: When an ad is loaded and displayed
- **Clicks**: When a user clicks on an ad
- **View Duration**: How long an ad was visible (optional)
- **User ID**: Which user viewed/clicked (optional)

### Query Analytics
```sql
-- Total impressions for an ad
SELECT COUNT(*) as total_impressions 
FROM ad_impressions 
WHERE ad_id = 'your-ad-id';

-- Click-through rate
SELECT 
  COUNT(DISTINCT ac.id) as clicks,
  COUNT(DISTINCT ai.id) as impressions,
  ROUND(COUNT(DISTINCT ac.id) * 100.0 / COUNT(DISTINCT ai.id), 2) as ctr_percentage
FROM ad_impressions ai
LEFT JOIN ad_clicks ac ON ai.ad_id = ac.ad_id
WHERE ai.ad_id = 'your-ad-id';
```

## Configuration

### Customize Ad Sizes
Edit `src/SomaLux/Ads/AdBanner.css`:
```css
/* For homepage banners */
.ad-image {
  max-height: 300px;
}

/* For sidebar ads */
.ad-image.sidebar-ad {
  max-height: 250px;
}
```

### Add User Tracking
Update `src/SomaLux/Ads/AdBanner.jsx` to capture user ID:
```jsx
import { useAuth } from './your-auth-hook'; // Add your auth hook

export function AdBanner({ placement, limit = 1 }) {
  const { user } = useAuth();
  
  const logImpression = async (adId) => {
    await axios.post('/ad-impression', {
      adId,
      placement,
      userId: user?.id, // Add user ID here
      viewDuration: 0
    });
  };
  
  // ... rest of component
}
```

## Best Practices

1. **Use Meaningful Placements**: Keep placement names consistent across your app
2. **Schedule Ads**: Always set end dates for promotional ads
3. **Monitor CTR**: Regularly check click-through rates to optimize ad performance
4. **Test Responsiveness**: Ads should look good on mobile and desktop
5. **Respect User Privacy**: Only collect necessary data (anonymous impression tracking is fine)

## Troubleshooting

### Ads not loading?
1. Check if Supabase connection is working
2. Verify ad placement name matches database
3. Check if ads are marked as `is_active = true`
4. Check browser console for CORS errors

### Analytics not tracking?
1. Ensure backend endpoints are accessible
2. Check network tab in browser dev tools
3. Verify Supabase has write permissions

## Next Steps

1. Run the migration to create database tables
2. Create some test ads through the admin endpoint
3. Add AdBanner components to key pages
4. Monitor analytics through Supabase dashboard
5. Create an admin panel for managing ads (optional)
