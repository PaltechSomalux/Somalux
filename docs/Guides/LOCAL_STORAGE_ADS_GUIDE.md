# 🖼️ Load Ads from Local Storage - Complete Guide

## ✅ What's Ready

Your system now supports loading ad images from **local storage** (your backend server).

**Configured:**
- ✅ `backend/public/ads/` folder created
- ✅ Static file serving enabled in Express
- ✅ Database schema ready (`local_file_path` column available)
- ✅ Backend restarted

---

## 🚀 How to Use

### Step 1: Add Your Ad Images

Place image files in the `backend/public/ads/` folder:

```
backend/
├── public/
│  └── ads/
│     ├── banner1.jpg
│     ├── campaign.png
│     ├── promo.webp
│     └── sale.png
├── index.js
└── ...
```

**Supported formats:** JPG, PNG, GIF, WebP, SVG

### Step 2: Create Ad in Admin Panel

Go to: `http://localhost:3000/books/admin/ads`

Click **"+ Add New Ad"** and fill:

**Option A: Using just filename**
```
Title: "Summer Sale"
Image URL: /ads/sale.png
Placement: homepage
Countdown: 10
Skippable: Yes
```

**Option B: Using full path**
```
Title: "Summer Sale"
Image URL: http://localhost:5000/ads/sale.png
Placement: homepage
Countdown: 10
Skippable: Yes
```

### Step 3: That's It! ✅

The ad will display with your local image.

---

## 📋 Valid Image URL Formats

### ✅ These Work (Local Storage)
```
/ads/banner.jpg
/ads/campaign.png
/ads/promo.webp
http://localhost:5000/ads/sale.png
```

### ✅ These Work (External)
```
https://example.com/image.jpg
https://via.placeholder.com/600x300?text=Ad
https://imgur.com/abc123.jpg
```

### ❌ These Don't Work
```
file:///C:/Users/image.jpg           ← Browser security blocks
file:///D:/Aerospace/ars.jpg         ← Not allowed
C:\Users\image.jpg                   ← Local file path
```

---

## 📁 File Organization

Best practice structure:

```
backend/public/ads/
├── banners/
│  ├── homepage-banner.jpg
│  └── sidebar-banner.png
├── campaigns/
│  ├── summer-sale.jpg
│  ├── black-friday.png
│  └── new-year.webp
└── sponsors/
   ├── sponsor1.jpg
   └── sponsor2.jpg
```

Then use URLs like:
```
/ads/banners/homepage-banner.jpg
/ads/campaigns/summer-sale.jpg
/ads/sponsors/sponsor1.jpg
```

---

## 🖥️ Testing Locally

**You can now:**

1. Add image to `backend/public/ads/`
2. View it at: `http://localhost:5000/ads/image-name.jpg`
3. Use in ad: Set Image URL to `/ads/image-name.jpg`
4. Ad displays immediately ✅

---

## 🔄 Workflow

```
1. Copy image to backend/public/ads/
   ↓
2. Go to Admin → Ads
   ↓
3. Create new ad
   ↓
4. Image URL: /ads/filename.jpg
   ↓
5. Click Save
   ↓
6. Ad displays with your image ✅
```

---

## 💡 Pro Tips

### Tip 1: Organize by Placement
```
backend/public/ads/
├── homepage/
├── sidebar/
├── modal/
├── feed/
└── books/
```

### Tip 2: Version Control
```
backend/public/ads/
├── banner-v1.jpg  (old)
├── banner-v2.jpg  (current)
├── banner-v3.jpg  (new)
```

### Tip 3: Compress Images
Keep images under 200KB for better performance:
- Use online compressors: TinyPNG, Squoosh
- Use formats: JPG (photos), PNG (graphics), WebP (best)

### Tip 4: Image Naming
```
✅ good naming:
   homepage-banner.jpg
   summer-sale-2025.png
   sponsored-ad.webp

❌ bad naming:
   ad.jpg (too generic)
   image123.jpg (confusing)
   Untitled.png (unclear)
```

---

## 📊 Folder Structure Template

```
backend/
├── public/
│  ├── ads/
│  │  ├── banner1.jpg
│  │  ├── promo.png
│  │  └── campaign.webp
│  └── ... other public files
├── routes/
├── utils/
├── index.js
└── package.json
```

---

## 🔍 Verification

### Check Images Load

1. Go to browser address bar
2. Type: `http://localhost:5000/ads/banner1.jpg`
3. Should display the image ✅

### Check in Ad
1. Admin → Ads
2. Create ad with Image URL: `/ads/banner1.jpg`
3. Click Save
4. Image preview should show ✅

### Check Display
1. Go to page with `<AdBanner placement="homepage" />`
2. Should see your ad image ✅

---

## 🆘 Troubleshooting

### Image Not Loading
**Problem:** Image shows broken icon

**Solutions:**
1. Check image is in `backend/public/ads/`
2. Check filename matches exactly (case-sensitive on Linux)
3. Verify URL format: `/ads/filename.jpg` or `http://localhost:5000/ads/filename.jpg`
4. Restart backend: `node index.js`
5. Clear browser cache: Ctrl+Shift+Delete

### "Cannot GET /ads/banner.jpg"
**Problem:** 404 error when visiting image URL

**Solutions:**
1. Check image file exists: `backend/public/ads/banner.jpg`
2. Check spelling (case-sensitive)
3. Check Express static middleware is added: `app.use(express.static('public'))`
4. Restart backend

### Image Shows But Ad Doesn't
**Problem:** Image loads but ad doesn't display

**Solutions:**
1. Check ad is created in database
2. Check placement matches: `<AdBanner placement="homepage" />`
3. Check ad `is_active` is true
4. Check browser console for errors: F12 → Console

---

## 📝 URL Examples

### Serving from Local Storage

**File location:**
```
d:\Work\SomaLux\backend\public\ads\banner.jpg
```

**Access via:**
```
http://localhost:5000/ads/banner.jpg
/ads/banner.jpg (in forms, relative)
```

### Complete Ad Setup Example

```
File: backend/public/ads/summer-sale.jpg
URL in ad: /ads/summer-sale.jpg
Display: <AdBanner placement="homepage" />
Result: Ad shows summer-sale.jpg image ✅
```

---

## 🎯 Next Steps

1. **Copy image to:** `backend/public/ads/`
2. **Create ad with URL:** `/ads/your-image.jpg`
3. **Display on page:** `<AdBanner placement="homepage" />`
4. **Done!** ✅

---

## 🔗 Related Files

- `backend/index.js` - Added static file serving
- `backend/public/ads/` - Your ad images folder
- `src/SomaLux/Ads/AdBanner.jsx` - Displays ads (handles local & HTTP URLs)
- Admin panel - Create/manage ads

---

**Your system is ready for local ad images!** 🚀

Just add images to `backend/public/ads/` and use `/ads/filename.jpg` in your ads.
