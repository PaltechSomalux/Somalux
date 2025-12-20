# Grid Ads - Quick Reference Guide

## What Are Grid Ads?
Grid ads are advertisements displayed as individual cards within product grids (Books, Authors, Categories, etc.). They match the dimensions and styling of regular grid items for seamless integration.

## How to Create a Grid Ad

### Step 1: Go to Admin Dashboard
- Navigate to **Advanced Ads Management**

### Step 2: Fill in Ad Details
- **Title**: Name of your ad (e.g., "My Product Ad")
- **Ad Type**: Select "Image" or "Video"
- **Upload Content**: Upload image (JPG/PNG) or video (MP4)
- **Click URL**: Where users go when they click the ad (e.g., https://example.com)
- **Countdown Duration**: How long ad displays (seconds, default 10)

### Step 3: Select Grid Placement
In the **Placement** dropdown, choose one of the Grid options:
- **Grid - Books**: Ad appears in Books grid
- **Grid - Authors**: Ad appears in Authors grid
- **Grid - Categories**: Ad appears in Categories grid
- **Grid - Past Papers**: Ad appears in Past Papers grid
- **Grid - Papers**: Ad appears in Papers grid

### Step 4: Save
Click **Create Ad** button (green, left-aligned)

## How Grid Ads Display

### Location
Grid ads always appear as the **first item** in the selected grid (before all regular items).

### Sizing
The ad automatically adjusts to match the grid's card dimensions:
- **Mobile**: 180px height
- **Tablet**: 200px height  
- **Desktop**: 180-220px height

### Controls
Users see three controls overlaid on the ad:
1. **"Ad" Label** (top-left): Identifies it as an advertisement
2. **Countdown Timer** (top-middle): Shows how many seconds remain
3. **Close Button** (top-right): Lets users dismiss the ad

### What Happens
- When countdown reaches 0, ad automatically disappears
- User can click anywhere on the ad to visit the Click URL
- User can click close button to dismiss the ad immediately
- All interactions are logged for analytics

## Analytics Tracking

Grid ads automatically track:
- **Impressions**: When ad loads and is visible
- **Clicks**: When user clicks on the ad
- **Dismisses**: When user closes the ad
- **View Duration**: How long user saw the ad
- **Device Type**: Mobile/Tablet/Desktop

These metrics are stored in the database and can be viewed in the analytics dashboard.

## Tips for Best Results

### Image Ads
- Use images with aspect ratio ~16:9 or square
- Recommended sizes: 320×240px (mobile), 480×360px (tablet), 640×480px (desktop)
- Use high-quality images (JPEG or PNG)
- Keep file size under 2MB for fast loading

### Video Ads
- Use MP4 format for best compatibility
- Keep duration 15-30 seconds for better engagement
- Add a thumbnail or poster image
- Keep file size under 5MB for fast loading

### Click URLs
- Always include full URL (http:// or https://)
- Test the link works before saving
- Use tracking URLs to measure conversion
- Example: https://example.com?utm_source=grid_ad&utm_medium=books

### Countdown Duration
- Shorter (5-10s): Good for impulse clicks
- Medium (10-15s): Standard for reading content
- Longer (20-30s): Good for detailed product ads

## Troubleshooting

### Ad Not Showing?
1. Check placement is set to "Grid - ..." (not "Homepage", "Books", etc.)
2. Verify ad content (image/video) uploaded successfully
3. Try refreshing the page
4. Check browser console for errors (F12 key)

### Ad Size Wrong?
- Grid ads automatically size to fit grid cells
- If size looks wrong, clear browser cache and refresh
- Size should match other items in grid exactly

### Click URL Not Working?
- Verify full URL is entered (with http:// or https://)
- Test URL works when opened directly
- Check for typos in domain name

### Impression Not Logged?
- Ensure ad countdown reaches 1 second
- Check that API endpoint is accessible (localhost:5000)
- Verify database connection

## Grid Placement Values

For developers integrating grid ads to new locations:

```javascript
// Grid placement values for API calls
const gridPlacements = [
  'grid-books',       // Books page grid
  'grid-authors',     // Authors page grid
  'grid-categories',  // Categories page grid
  'grid-pastpapers',  // Past Papers page grid
  'grid-papers',      // Papers page grid
];

// All grid ads use API endpoint:
// GET /api/ads/{placement}?limit=1
```

## API Integration

### Fetch Grid Ads
```javascript
// Get grid ad for Books
fetch('http://localhost:5000/api/ads/grid-books?limit=1')
  .then(res => res.json())
  .then(data => {
    // data.data[0] contains ad object
    console.log(data.data[0].image_url); // or video_url
  });
```

### Log Impression
```javascript
axios.post('http://localhost:5000/api/ad-impression', {
  adId: 'ad-123',
  placement: 'grid-books',
  userId: null,
  viewDuration: 0,
  deviceType: 'mobile'
});
```

### Log Click
```javascript
axios.post('http://localhost:5000/api/ad-click', {
  adId: 'ad-123',
  placement: 'grid-books',
  userId: null,
  viewDuration: 5,
  deviceType: 'mobile'
});
```

## Performance

Grid ads are optimized for performance:
- Only fetch when grid is visible
- No layout shifts (images use object-fit: cover)
- Lightweight CSS (no heavy animations)
- Async analytics (doesn't block UI)
- Lazy loading support

## Current Status

✅ Books grid: Active and live
✅ Category placement: Grid options available in dropdown
⏳ Other grids: Ready for implementation

---

**For more technical details, see [GRID_AD_IMPLEMENTATION_COMPLETE.md](GRID_AD_IMPLEMENTATION_COMPLETE.md)**
