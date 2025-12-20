# Ad Management Admin Dashboard - User Guide

## 🎯 Access the Ad Management Dashboard

1. **Go to Admin Panel**: `/books/admin`
2. **Click "Ads"** in the left sidebar under the SYSTEM section
3. You'll see the Ad Management page

## 📋 What You Can Do

### ✅ View All Ads
- Displays all ads in a grid/card layout
- Shows ad title, image, placement, and dates
- See if ads are Active or Inactive

### ➕ Create New Ad
1. Click **"+ New Ad"** button
2. Fill in the form:
   - **Title** (required): Name of the ad (e.g., "Python Course Sale")
   - **Image URL** (required): Link to ad image (e.g., `https://example.com/banner.jpg`)
   - **Click URL** (optional): Where users go when they click (e.g., `https://course.com`)
   - **Placement** (required): Where ad appears
     - `homepage` - Main page
     - `sidebar` - Side panel
     - `modal` - Popup
     - `feed` - Feed-based ads
     - `books` - Books page
   - **Start Date**: When ad goes live
   - **End Date**: When ad stops (optional)
3. Click **"Create Ad"** or **"Update Ad"** if editing

### ✏️ Edit Existing Ad
1. Find the ad card
2. Click **"Edit"** button
3. Update fields as needed
4. Click **"Update Ad"**

### 🗑️ Delete Ad
1. Find the ad card
2. Click **"Delete"** button
3. Confirm deletion

## 📊 Ad Card Information

Each ad card shows:
- **Image Preview**: Visual of the ad
- **Status Badge**: Shows if "Active" or "Inactive"
- **Title**: Ad name
- **Details**:
  - Placement type
  - Click URL (if set)
  - Start & End dates
- **Actions**: Edit & Delete buttons

## 🔄 How Ads Display on Pages

Once you create an ad:

1. **Component adds ad to page**:
   ```jsx
   <AdBanner placement="homepage" />
   ```

2. **AdBanner fetches your ad** from database automatically

3. **Ad displays** on the page with your image

4. **Analytics tracked**:
   - ✅ Impression logged when shown
   - ✅ Click logged when user clicks
   - ✅ Users can open link in new window

## 🧪 Test It Out

### Step 1: Create a Test Ad
- Title: "Test Ad"
- Image URL: `https://via.placeholder.com/600x300?text=Test+Ad`
- Placement: `homepage`
- Click URL: `https://google.com`

### Step 2: Add to HomePage
In `BookManagement.jsx`:
```jsx
import { AdBanner } from '../Ads/AdBanner';

export const BookManagement = () => {
  return (
    <div className="book-management">
      {/* Header */}
      
      {/* ADD THIS LINE */}
      <AdBanner placement="homepage" limit={1} />
      
      {/* Rest of content */}
    </div>
  );
};
```

### Step 3: Save & Refresh
Your test ad should appear on the page!

## 📍 Placement Options Explained

| Placement | Best For | Example |
|-----------|----------|---------|
| `homepage` | Banner at top of main page | Large promotional banner |
| `sidebar` | Side panel or column | Smaller vertical ads |
| `modal` | Popup dialog | Important announcements |
| `feed` | Between content items | Native feed ads |
| `books` | Books page | Book-related promotions |

## ⚙️ Configuration Tips

### Image Best Practices
- **Homepage**: 600x300px (16:9 ratio)
- **Sidebar**: 300x250px (4:3 ratio)
- **Modal**: 400x200px (2:1 ratio)
- Format: JPEG, PNG, WebP

### URL Tips
- **Image URL**: Must be publicly accessible
- **Click URL**: Can be internal or external
- Use full URLs: `https://example.com` not `/page`

### Scheduling
- Ads start when **Start Date** arrives
- Ads stop when **End Date** passes
- Leave End Date empty for perpetual ads

## 🐛 Troubleshooting

### Ad not showing?
- ✅ Check placement name matches in code
- ✅ Verify Image URL is valid
- ✅ Confirm ad is marked "Active"
- ✅ Check browser console for errors

### Image not loading?
- ✅ Verify full HTTPS URL
- ✅ Check image exists at URL
- ✅ Try different image format

### Can't access admin?
- ✅ Must be admin user
- ✅ Check email in `BooksAdmin.jsx`
- ✅ Email must be `campuslives254@gmail.com` or have admin role

## 📊 Next: Analytics

Track ad performance in Supabase:

```sql
-- Impressions for an ad
SELECT COUNT(*) FROM ad_impressions WHERE ad_id = 'YOUR_AD_ID';

-- Clicks for an ad
SELECT COUNT(*) FROM ad_clicks WHERE ad_id = 'YOUR_AD_ID';

-- Click-Through Rate
SELECT 
  COUNT(DISTINCT ac.id) as clicks,
  COUNT(DISTINCT ai.id) as impressions,
  ROUND(COUNT(DISTINCT ac.id) * 100.0 / COUNT(DISTINCT ai.id), 2) as ctr
FROM ad_impressions ai
LEFT JOIN ad_clicks ac ON ai.ad_id = ac.ad_id
WHERE ai.ad_id = 'YOUR_AD_ID';
```

## 🎉 You're All Set!

Your ad management system is ready. Go create some ads! 🚀
