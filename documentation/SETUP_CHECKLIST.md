# ✅ Complete Setup Checklist

## Current Status
- ✅ Backend code: Ready
- ✅ Frontend code: Ready
- ❌ Database: NEEDS SETUP (this is your error)

---

## 🚀 DO THIS NOW (5 minutes)

### [ ] Step 1: Open Supabase
```
Go to: https://supabase.com/
Login → Select your project
```

### [ ] Step 2: Find SQL Editor
```
Left sidebar → "SQL Editor"
Click "+ New Query"
```

### [ ] Step 3: Copy SQL
```
From: d:\Work\SomaLux\backend\migrations\COMPLETE_AD_SYSTEM_SETUP.sql
Or copy from: DATABASE_SETUP_GUIDE.md
```

### [ ] Step 4: Paste & Run
```
1. Paste into SQL Editor
2. Click "Run" button
3. Wait for: "Query executed successfully" ✅
```

### [ ] Step 5: Verify
```
Run this query:
SELECT * FROM ads LIMIT 1;

Expected: Empty result (table exists)
Error: Table doesn't exist = something went wrong
```

---

## After Database Setup ↓

### [ ] Step 6: Restart Backend
```powershell
taskkill /F /IM node.exe
cd backend
node index.js

Expected: "Listening on http://localhost:5000"
```

### [ ] Step 7: Create Test Ad
```
Go to: http://localhost:3000/books/admin/ads
Click: "+ Add New Ad"

Fill:
  - Title: "Test Campaign"
  - Image URL: https://via.placeholder.com/600x300?text=Test+Ad
  - Placement: homepage
  - Countdown: 10
  - Skippable: Yes

Click: "Save Ad" ✅
```

### [ ] Step 8: Display on Page
```jsx
// In any component (e.g., HomePage.jsx)
import { AdBanner } from '../Ads/AdBanner';

export default function HomePage() {
  return (
    <>
      <h1>Welcome</h1>
      <AdBanner placement="homepage" />  {/* Add this */}
    </>
  );
}
```

### [ ] Step 9: Test Display
```
1. Go to page with <AdBanner />
2. Should see ad with countdown
3. Countdown counts down from 10 to 0
4. Click X button → Ad closes
5. Browser console: Should show no red errors
```

### [ ] Step 10: Check Analytics
```
Go to: http://localhost:3000/books/admin/ad-analytics
Select: Your test ad
Should see:
  - Impressions: 1+
  - Clicks: 0+ (based on actions)
  - Device: mobile/tablet/desktop
```

---

## ✨ If Everything Works

Congratulations! 🎉

Your ad system is fully functional:
- ✅ Database tables created
- ✅ Ads can be created
- ✅ Ads display with countdown
- ✅ Analytics tracking
- ✅ Admin dashboard working

### Next: Optimize & Expand
- Create multiple ads
- Test different placements
- Monitor analytics
- Adjust countdown/settings
- Add to different pages

---

## 🆘 If Something Breaks

### Error: "Table 'public.ads' not found"
- ✅ Database migration not run
- **FIX:** Run SQL migration (Step 1-5)

### Error: "Failed to fetch ads" (404)
- ✅ Backend not running
- **FIX:** Restart backend (Step 6)

### Ad not displaying on page
- ✅ Component not imported
- ✅ Placement doesn't match any ads
- **FIX:** Check `<AdBanner placement="..." />` matches ad placement

### Analytics shows 0
- ✅ Ad not viewed long enough
- ✅ Countdown too short
- **FIX:** View ad for 3+ seconds before closing

### Image not loading
- ✅ Invalid URL (local file path)
- **FIX:** Use HTTP(S) URL only, see AD_IMAGE_SETUP.md

---

## 📞 Quick Reference

| Issue | Command |
|-------|---------|
| Backend not starting | `cd backend && node index.js` |
| Kill Node processes | `taskkill /F /IM node.exe` |
| Check port 5000 | `netstat -ano \| findstr "5000"` |
| Clear browser cache | `Ctrl + Shift + Delete` |
| View SQL in Supabase | SQL Editor → New Query |
| Test database | `SELECT * FROM ads LIMIT 1;` |

---

## 📚 Documentation Files

Reference these if needed:

1. **DATABASE_SETUP_GUIDE.md** ← START HERE
   - Step-by-step migration instructions

2. **DATABASE_SCHEMA_GUIDE.md**
   - What each table does

3. **AD_IMAGE_SETUP.md**
   - How to format image URLs

4. **AD_SYSTEM_TROUBLESHOOTING.md**
   - Common errors & fixes

5. **AD_SYSTEM_QUICK_START.md**
   - Quick reference

6. **AD_SYSTEM_REFERENCE_CARD.md**
   - Visual diagrams

---

## ⏱️ Timeline

| Task | Time | When |
|------|------|------|
| Database setup | 2 min | NOW ← YOU ARE HERE |
| Backend restart | 1 min | After DB |
| Create ad | 2 min | After backend |
| Display on page | 1 min | After ad |
| Test & verify | 2 min | After display |
| **TOTAL** | **~8 min** | Next 10 minutes |

---

## 🎯 Success Criteria

You're done when:
- ✅ No "table not found" errors
- ✅ Admin dashboard loads ads
- ✅ Ad displays on page with countdown
- ✅ Close button works
- ✅ Analytics shows impressions
- ✅ No red errors in browser console

---

## 🚀 Ready?

**Next action:** Go to https://supabase.com/ and run the SQL migration!

**File to copy:** `COMPLETE_AD_SYSTEM_SETUP.sql`

You got this! 💪
