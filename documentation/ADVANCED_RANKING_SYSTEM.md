# Advanced Ranking System Implementation Guide

## Overview

A comprehensive, advanced ranking system has been added to the admin dashboard that ranks everything in the system in a perfectly organized, clean, and professional layout. The system includes real-time rankings for:

- **Users**: 30-day activity-based reputation with tier system
- **Books**: Ranked by downloads, views, and composite score
- **Authors**: Ranked by publication count, total downloads, and engagement
- **Categories**: Ranked by book count, downloads, and performance metrics
- **Universities**: Ranked by past paper count, downloads, and engagement

## Features

### 1. **User Rankings Tab** 👥
- Real-time ranking of all active users
- Displays user tier (Superuser, Power User, New Reader, etc.)
- Shows multiple scoring dimensions:
  - **Reading Score**: Based on books read and time spent
  - **Engagement Score**: Based on interactions and activity
  - **Contribution Score**: Based on uploads and submissions
  - **Goals Score**: Based on reading goals achieved
  - **Achievements Score**: Based on badges and milestones
- Medal indicators (🥇🥈🥉) for top 3 users
- Search functionality to find specific users
- Total user count and average score statistics

### 2. **Books Rankings Tab** 📖
- Top books displayed in two visualization formats:
  - **Bar Charts**: Most Downloaded and Most Viewed books
  - **Detailed Table**: Top 20 books ranked by composite score
- Score calculation: `(downloads × 2) + (views × 0.5)`
- Medal indicators for top 3 books
- Time range filtering (Daily, Weekly, Monthly, Annually)
- Shows author information for each book

### 3. **Authors Rankings Tab** ✍️
- Most popular authors by book count (Pie Chart visualization)
- Authors by total downloads (Bar Chart visualization)
- Comprehensive table showing:
  - Book count per author
  - Total downloads across all works
  - Total views across all works
- Time range filtering for trend analysis

### 4. **Categories Rankings Tab** 📚
- Category distribution visualization (Pie Chart)
- Categories by downloads performance (Bar Chart)
- Performance metrics table including:
  - Number of books in category
  - Total downloads
  - Total views
  - Average rating
- Time range filtering for analysis

### 5. **Universities Rankings Tab** 🏫
- Universities ranked by past paper count (Bar Chart)
- Universities by total downloads (Bar Chart)
- Comprehensive university performance table showing:
  - Number of papers uploaded
  - Total downloads
  - Total views
- School icon indicators for easy identification
- Time range filtering

## Technical Architecture

### Frontend Components

**File**: `src/SomaLux/Books/Admin/pages/Rankings.jsx`

The Rankings component features:
- Tabbed interface for easy navigation between ranking types
- Material-UI components for consistent, professional design
- Recharts for beautiful data visualizations
- Real-time data fetching from backend APIs
- Loading states and error handling
- Responsive design (mobile, tablet, desktop)

Key Sub-Components:
- `RankingCard`: Statistics overview cards
- `RankingTableRow`: Reusable table row with medals and styling
- `TimeRangeSelector`: Quick time period selection buttons

### Backend Endpoints

**File**: `backend/routes/rankings.js`

All endpoints are prefixed with `/api/admin/rankings/`:

#### 1. **GET /books**
```
Query Parameters:
- timeRange: 'daily' | 'weekly' | 'monthly' | 'annually' (default: monthly)

Response:
{
  ok: true,
  rankings: [
    {
      id: string,
      title: string,
      author: string,
      downloads: number,
      views: number,
      score: number,
      rank: number
    },
    ...
  ]
}
```

#### 2. **GET /authors**
```
Query Parameters:
- timeRange: 'daily' | 'weekly' | 'monthly' | 'annually' (default: monthly)

Response:
{
  ok: true,
  rankings: [
    {
      author: string,
      books_count: number,
      total_downloads: number,
      total_views: number,
      rank: number
    },
    ...
  ]
}
```

#### 3. **GET /categories**
```
Query Parameters:
- timeRange: 'daily' | 'weekly' | 'monthly' | 'annually' (default: monthly)

Response:
{
  ok: true,
  rankings: [
    {
      category_id: string,
      category_name: string,
      book_count: number,
      total_downloads: number,
      total_views: number,
      avg_rating: number,
      rank: number
    },
    ...
  ]
}
```

#### 4. **GET /universities**
```
Query Parameters:
- timeRange: 'daily' | 'weekly' | 'monthly' | 'annually' (default: monthly)

Response:
{
  ok: true,
  rankings: [
    {
      university_id: string,
      university_name: string,
      paper_count: number,
      total_downloads: number,
      total_views: number,
      rank: number
    },
    ...
  ]
}
```

### API Integration

**File**: `src/SomaLux/Books/Admin/api.js`

Added API wrapper functions:
- `fetchBooksRankings(timeRange)`
- `fetchAuthorsRankings(timeRange)`
- `fetchCategoriesRankings(timeRange)`
- `fetchUniversitiesRankings(timeRange)`

These functions handle:
- Backend origin detection (localhost vs production)
- Error handling and logging
- Data transformation for component consumption

## Navigation

### Access Location
**Admin Dashboard → System Menu → Rankings**

Or direct URL: `/books/admin/rankings`

### Navigation Icon
Added `FiBarChart2` icon to the Rankings menu item for visual consistency.

## Styling & Design

### Color Scheme
```
Primary Green: #00a884 (user rankings, downloads)
Primary Blue: #34B7F1 (engagement, views)
Primary Gold: #FFCC00 (highlights)
Primary Red: #f15e6c (alerts, medals)
Primary Purple: #8b5cf6 (authors, tiers)
Cyan: #22d3ee (achievements)
```

### Layout Features
- **Card-based design** with subtle gradients and shadows
- **Medal indicators** (🥇🥈🥉) for top 3 positions
- **Color-coded chips** for user tiers
- **Responsive grid layouts** that adapt to screen size
- **Hover effects** on rows for better interactivity
- **Loading spinners** during data fetching
- **Smooth transitions** between tabs

### Typography
- Bold headers (fontWeight: 700) for hierarchy
- Clean sans-serif font stack via Material-UI
- Size hierarchy from h4 headers down to captions

## Data Visualization

### Chart Types Used

1. **Bar Charts** (Recharts BarChart)
   - Books by downloads/views
   - Authors by downloads
   - Categories by downloads
   - Universities by paper count

2. **Pie Charts** (Recharts PieChart)
   - Author distribution
   - Category distribution
   - Color-coded segments with labels

3. **Tables**
   - Ranked lists with sorting capability
   - Medal indicators for top 3
   - Detailed metrics per entity
   - Hoverable rows with background change

### Key Metrics Displayed

**For Users:**
- Overall Score (composite of all metrics)
- Reading Score
- Engagement Score
- Contribution Score
- User Tier

**For Books:**
- Downloads
- Views
- Composite Score

**For Authors:**
- Books Count
- Total Downloads
- Total Views

**For Categories:**
- Book Count
- Total Downloads
- Total Views
- Average Rating

**For Universities:**
- Paper Count
- Total Downloads
- Total Views

## Time Range Filtering

All rankings support four time ranges:
- **Daily**: Last 24 hours
- **Weekly**: Last 7 days
- **Monthly**: Last 30 days (default)
- **Annually**: Last 365 days

Time ranges are controlled by buttons at the top of each ranking section.

## Search & Filter Features

### User Rankings Search
- Real-time search by user name or email
- Case-insensitive matching
- Updates results instantly

### Time Range Selection
- Quick-select buttons for common periods
- Active state highlighting
- Automatic API refetch on selection

## Statistics Overview Cards

At the top of the page, displays:
- **Total Active Users**: Count of all ranked users
- **Top Ranked User**: Name of #1 user with tooltip showing score
- **Average User Score**: Mean score across all users
- **Total Books Ranked**: Count of all ranked books

## Database Integration

The system integrates with existing Supabase tables:
- `profiles` - User information
- `user_rankings` - Pre-computed 30-day rankings
- `books` - Book metadata
- `categories` - Category data
- `universities` - University data
- `past_papers` - Past paper metadata

No database schema changes required - fully compatible with existing schema.

## Performance Optimizations

- **Frontend Caching**: Component state management
- **API Rate Limiting**: Time-based data fetching
- **Lazy Loading**: Components load on tab selection
- **Pagination**: Tables show top N results (20-50)
- **Efficient Sorting**: Backend-side ranking calculations

## File Structure

```
src/SomaLux/Books/Admin/
├── pages/
│   └── Rankings.jsx (NEW - Main component)
├── BooksAdmin.jsx (UPDATED - Added route)
└── api.js (UPDATED - Added ranking functions)

backend/
├── index.js (UPDATED - Added routes)
└── routes/
    └── rankings.js (NEW - Ranking endpoints)
```

## Implementation Checklist

✅ **Backend**
- Created `/backend/routes/rankings.js` with all ranking endpoints
- Integrated into `/backend/index.js`
- Time range filtering implemented
- Data aggregation and sorting logic

✅ **Frontend**
- Created comprehensive Rankings component
- Added API wrapper functions
- Integrated into BooksAdmin routing
- Added navigation menu item
- Implemented responsive design

✅ **Design**
- Professional color scheme
- Medal indicators for top performers
- Clean, modern UI with Material-UI
- Responsive layouts for all screen sizes
- Interactive visualizations with Recharts

✅ **Data Integration**
- Connected to existing database tables
- No schema changes required
- Real-time data fetching
- Proper error handling

## Usage Instructions

### For Admins:
1. Login to the admin dashboard
2. Click on "System" section in sidebar
3. Select "Rankings"
4. Navigate between tabs to view different rankings
5. Use time range buttons to filter by period
6. Search users by name or email (in User Rankings tab)

### For Developers:
1. Rankings component is fully self-contained in `Rankings.jsx`
2. All API calls go through backend endpoints in `rankings.js`
3. Add new ranking types by:
   - Creating new endpoint in `rankings.js`
   - Adding new Router method
   - Creating new tab in Rankings component
   - Updating BooksAdmin routes if needed

## Future Enhancements

Possible additions:
- Export rankings to CSV/PDF
- Scheduled ranking reports
- Email notifications for top performers
- Custom ranking criteria configuration
- Real-time ranking updates (WebSocket)
- Historical ranking trends
- Ranking badges for users
- Comparison tools between entities
- Advanced filtering options
- Caching for performance

## Troubleshooting

### Rankings not showing:
1. Check backend is running on port 5000
2. Verify Supabase connection
3. Check browser console for API errors
4. Ensure tables have data

### Charts not rendering:
1. Verify data is returned from API
2. Check chart component props
3. Ensure Recharts is installed

### Time filtering not working:
1. Verify timeRange parameter is being passed
2. Check backend date range logic
3. Ensure data exists for selected period

## Support & Questions

For any issues or questions:
1. Check the backend logs in terminal
2. Check browser developer console
3. Verify API endpoints are returning data
4. Check component state in React DevTools

---

**Created**: December 9, 2025
**Version**: 1.0.0
**Status**: Production Ready
