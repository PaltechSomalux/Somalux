# Ranking System - Quick Reference Guide

## 🎯 What Was Built
A complete, production-ready ranking system for the SomaLux admin dashboard that automatically ranks ALL 12 entity types using real-time database data.

## 📊 Ranking Categories (12 Total)

| # | Entity | Icon | Rank By | Data Source |
|---|--------|------|---------|------------|
| 1 | Users | 👥 | Score (activity + engagement) | user_rankings |
| 2 | Books | 📖 | Downloads + Views + Rating | books table |
| 3 | Authors | ✍️ | Books + Downloads + Followers | author_stats + books |
| 4 | Categories | 📚 | Books + Downloads | categories + books |
| 5 | Universities | 🏫 | Papers + Downloads | universities + past_papers |
| 6 | Past Papers | 📄 | Downloads + Views | past_papers |
| 7 | Reading Activity | 📖 | Sessions + Pages Read | reading_sessions |
| 8 | Achievements | 🏆 | Badges Earned | user_achievements |
| 9 | Ads | 📊 | Impressions + CTR | ads + ad_analytics |
| 10 | Goals | 🎯 | Completion Rate | reading_goals |
| 11 | Subscribers | ⭐ | Total Spent (KES) | subscriptions |
| 12 | Engagement | 💬 | Comments + Ratings + Likes | book_comments, book_ratings, book_likes |

## 🔗 How to Access
```
Path: /books/admin/rankings
Navigation: Admin Sidebar → Rankings (📊 icon)
Requires: Admin privileges
```

## 🏗️ Architecture

### Backend Stack
```
Express Router (11 endpoints)
     ↓
Supabase Admin SDK
     ↓
PostgreSQL (35 tables)
```

**Base Route**: `/api/admin/rankings`
**Port**: 5000

### Frontend Stack
```
React Component (Rankings.jsx)
     ↓
API Wrapper Functions (api.js)
     ↓
Material-UI + Recharts
```

## 📡 API Endpoints

| Endpoint | Method | Time Range | Returns |
|----------|--------|-----------|---------|
| `/books` | GET | daily/weekly/monthly/annually | Top 100 books |
| `/authors` | GET | daily/weekly/monthly/annually | All authors sorted |
| `/categories` | GET | daily/weekly/monthly/annually | All categories |
| `/universities` | GET | daily/weekly/monthly/annually | All universities |
| `/past-papers` | GET | daily/weekly/monthly/annually | Top 100 papers |
| `/reading-activity` | GET | daily/weekly/monthly/annually | Top users |
| `/achievements` | GET | daily/weekly/monthly/annually | Top users |
| `/ads-performance` | GET | daily/weekly/monthly/annually | Top ads |
| `/reading-goals` | GET | daily/weekly/monthly/annually | Top users |
| `/subscribers` | GET | None | Top subscribers |
| `/engagement` | GET | daily/weekly/monthly/annually | Top users |

### Example Request
```javascript
fetch('/api/admin/rankings/books?timeRange=monthly')
  .then(res => res.json())
  .then(data => console.log(data.rankings))
```

### Response Format
```json
{
  "ok": true,
  "rankings": [
    {
      "id": "book-123",
      "title": "Book Title",
      "author": "Author Name",
      "downloads": 1234,
      "views": 5678,
      "score": 15234,
      "rank": 1
    }
  ]
}
```

## 🎨 UI Features

### Time Range Filtering
- **Daily**: Last 24 hours
- **Weekly**: Last 7 days
- **Monthly**: Last 30 days
- **Annually**: Last 365 days

### Visual Elements
- 🥇 Gold medal for #1
- 🥈 Silver medal for #2
- 🥉 Bronze medal for #3
- Color-coded cards with gradients
- User avatars with initials fallback
- Tier badges (superuser, power_user, etc.)
- Loading spinners during fetch
- Error alerts with messages

### Search & Filter
- Real-time user search (name/email)
- Pagination (show top 20-50)
- Sortable columns
- Responsive tables

## 📁 Files Modified/Created

### New Files
- `backend/routes/rankings.js` (649 lines)
- `RANKINGS_SYSTEM_COMPLETE.md`

### Modified Files
- `src/SomaLux/Books/Admin/pages/Rankings.jsx` (660 lines)
- `src/SomaLux/Books/Admin/api.js` (+126 lines for 7 new functions)
- `backend/index.js` (2 line additions)
- `src/SomaLux/Books/Admin/BooksAdmin.jsx` (3 line additions)

## 🚀 Deployment Checklist

- [x] Backend routes created and mounted
- [x] Frontend component implemented with all tabs
- [x] API wrapper functions added
- [x] Navigation integrated
- [x] Error handling implemented
- [x] Loading states added
- [x] Responsive design tested
- [x] No TypeScript/ESLint errors
- [x] All imports resolved
- [x] Supabase integration verified

## ⚙️ Configuration

### Environment Requirements
- Backend server running on port 5000
- Supabase project configured
- Admin service role key in environment
- Database migrations applied (all 35 tables exist)

### Admin Privileges
Only accessible to users with admin tier:
- superuser
- power_user (with admin flag)

## 📊 Scoring Formulas

```javascript
// Books
score = (downloads × 3) + (views × 1) + (rating × 10)

// Authors
score = (total_downloads × 2) + (total_views × 0.5) + 
        (avg_rating × 100) + (followers × 5)

// Engagement
score = (comments × 10) + (ratings × 5) + (likes × 2)

// Ads
ctr = (clicks / impressions) × 100
```

## 🔍 Testing

### Quick Test
1. Open `/books/admin/rankings`
2. Check if data loads
3. Switch between tabs
4. Try changing time range
5. Search for a user (in Users tab)
6. Verify medals appear for top 3

### Debug
- Open browser DevTools Console
- Check Network tab for API responses
- Verify backend is running: `http://localhost:5000/api/admin/rankings/books`
- Check Supabase connection in backend logs

## 📝 Logging

Backend logs ranking requests:
```
GET /api/admin/rankings/books?timeRange=monthly
  → 100 results fetched
  → 100ms query time
```

Frontend logs errors to console:
```javascript
console.error('Error fetching rankings:', error)
```

## 🆘 Troubleshooting

### No data showing
- Check backend is running
- Verify Supabase admin SDK initialized
- Check database has data in tables
- Open browser console for errors

### Time range not filtering
- Verify date_created or created_at column exists
- Check data has timestamps
- Verify getDateRange() function logic

### API 404 errors
- Check `/backend/routes/rankings.js` is imported
- Verify `app.use('/api/admin/rankings', ...)` in index.js
- Restart backend server

### Styling issues
- Verify Material-UI v7.3.5+ installed
- Check Recharts imported correctly
- Clear browser cache
- Check sx prop syntax

## 📚 Related Documentation
- `ADVANCED_RANKING_SYSTEM.md` - Architecture deep dive
- `RANKINGS_QUICK_START.md` - Setup guide
- Backend route comments in `rankings.js`

## 🎓 Learning Resources
- Material-UI: https://mui.com/
- Recharts: https://recharts.org/
- React Hooks: https://react.dev/reference/react

## 📞 Support
For issues or questions:
1. Check console errors
2. Review API responses in Network tab
3. Verify database has data
4. Check documentation files
5. Review route/component source code

---

**Status**: ✅ Production Ready
**Test Coverage**: All tabs, endpoints, and features tested
**Error Handling**: Comprehensive try-catch and fallbacks
**Performance**: Optimized queries with pagination and lazy loading

