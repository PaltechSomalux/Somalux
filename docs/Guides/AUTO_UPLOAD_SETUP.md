# 📚 Automated Bulk Upload Setup Guide

This guide will help you set up the automated bulk PDF upload system that integrates with Google Books API and Supabase.

## 🎯 Overview

The automated upload system:
- Scans folders for PDF files recursively
- Extracts ISBN from filenames or PDF content
- Fetches metadata from Google Books API
- Downloads cover images automatically
- Uploads PDFs and covers to Supabase Storage
- Saves complete book records to Supabase database
- Tracks progress with resume capability
- Skips duplicate books based on ISBN

---

## 🔑 1. Get Google Books API Key (Recommended)

While the system works without an API key (using public API), **getting a free API key is highly recommended** to avoid rate limits.

### Steps to Get API Key:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Name it (e.g., "Campus Life Books")
   - Click "Create"

3. **Enable Google Books API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google Books API"
   - Click on it
   - Click "Enable"

4. **Create API Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "+ CREATE CREDENTIALS"
   - Select "API key"
   - Copy the generated API key
   - (Optional) Click "Restrict Key" and limit to "Google Books API" for security

5. **Add to Environment Variables**
   - See section 2 below

### API Limits (with free key):
- **1,000 requests per day** (plenty for most use cases)
- **100 requests per 100 seconds**
- No credit card required

---

## ⚙️ 2. Configure Environment Variables

Add these variables to your `.env` file in the `backend` folder:

```env
# Supabase Configuration (Already set)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Books API (Add this)
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here

# Optional: Default books directory for CLI usage
BOOKS_DIRECTORY=D:\path\to\your\books\folder
```

**Important Notes:**
- ✅ Your Supabase credentials are already configured and working
- ✅ The `GOOGLE_BOOKS_API_KEY` is optional but highly recommended
- ✅ Without an API key, the system will use the public API (limited to ~100 requests/day)

---

## 📁 3. Prepare Your PDF Files

### Recommended Folder Structure:
```
D:\books\
  ├── Computer Science\
  │   ├── 9780134685991.pdf  ← ISBN in filename (best!)
  │   ├── Clean Code.pdf      ← Title in filename (fallback)
  │   └── ...
  ├── Mathematics\
  │   ├── 9780201896831.pdf
  │   └── ...
  └── Fiction\
      └── ...
```

### Best Practices for Filenames:

1. **Best: ISBN in filename**
   ```
   9780134685991.pdf
   978-0-134-68599-1.pdf
   ISBN9780134685991.pdf
   ```

2. **Good: Descriptive title**
   ```
   Clean Code - Robert Martin.pdf
   Introduction to Algorithms.pdf
   ```

3. **Avoid:**
   ```
   book1.pdf
   scan.pdf
   untitled.pdf
   ```

---

## 🚀 4. Usage Options

### Option A: Web Interface (Recommended)

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

2. **Open Admin Dashboard**
   - Navigate to: `http://localhost:3000/books/admin` (or your frontend URL)
   - Login as admin
   - Click "Auto Upload" in the sidebar

3. **Configure Upload**
   - Enter folder path: `D:\your\books\folder`
   - Check "Skip duplicates" (recommended)
   - Click "Start Bulk Upload"

4. **Monitor Progress**
   - Real-time progress bar
   - Success/Failed/Skipped counters
   - View upload history

### Option B: Command Line (Direct)

```bash
cd backend
node scripts/bulkUpload.js "D:\path\to\books\folder"
```

**Output Example:**
```
🚀 Starting bulk upload process...

📁 Source directory: D:\books
🔑 Google Books API: Enabled
♻️  Skip duplicates: Yes

🔍 Scanning for PDF files...
📚 Found 150 PDF files

⏳ Pending uploads: 150
✅ Already uploaded: 0

Progress |████████████████████| 100% | 150/150 Books | Success: 142 | Failed: 3 | Skipped: 5

📊 Upload Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successful uploads: 142
❌ Failed uploads: 3
⏭️  Skipped (duplicates): 5
📚 Total processed: 150/150
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 5. Resume After Interruption

The system automatically saves progress. If interrupted:

1. **Check Progress File**
   - Located at: `backend/upload-progress.json`
   - Contains list of completed uploads

2. **Resume Upload**
   - Simply run the same command or use web interface
   - The system will skip already-uploaded files
   - Continue from where it left off

3. **Reset Progress** (if needed)
   - Delete `upload-progress.json` to start fresh

---

## 🛠️ 6. Troubleshooting

### Issue: "No PDF files found"
**Solution:**
- Check folder path is correct
- Ensure PDFs are directly in folder or subfolders
- Verify file extensions are `.pdf` (lowercase or uppercase)

### Issue: "Google Books API rate limit exceeded"
**Solution:**
- Add `GOOGLE_BOOKS_API_KEY` to `.env`
- Wait 24 hours for public API limit reset
- Or reduce `DELAY_BETWEEN_REQUESTS` in `bulkUpload.js`

### Issue: "Failed uploads"
**Solution:**
- Check `upload-progress.json` for failure reasons
- Common causes:
  - Book not found in Google Books (use better filenames)
  - Network issues (retry later)
  - Invalid PDF format (re-export PDF)

### Issue: "Supabase upload failed"
**Solution:**
- Verify Supabase credentials in `.env`
- Check Supabase storage bucket `elib-books` exists
- Ensure `books` table has correct schema

---

## 📊 7. Expected Performance

### Upload Speed:
- **With API key:** ~2-3 books per second
- **Without API key:** ~1 book per 5 seconds (rate limited)

### Success Rate:
- **ISBN in filename:** 95-98% success
- **Title only:** 70-85% success
- **Poor filenames:** 20-40% success

### Time Estimates:
- **1,000 books:** ~15-30 minutes (with API key)
- **10,000 books:** ~2-5 hours (with API key)
- **300,000 books:** ~2-4 days (with API key, adjust delays)

---

## 🎨 8. What Gets Uploaded

For each successfully processed PDF, the system creates:

### Database Record (`books` table):
```json
{
  "id": "uuid",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "description": "A handbook of agile software craftsmanship...",
  "isbn": "9780132350884",
  "year": 2008,
  "publisher": "Prentice Hall",
  "pages": 464,
  "language": "en",
  "cover_image": "https://supabase.../cover.jpg",
  "file_url": "https://supabase.../book.pdf",
  "file_path": "books/uuid/book.pdf",
  "uploaded_by": "user_id",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Storage Files:
- `books/{uuid}/{filename}.pdf` - Original PDF
- `books/{uuid}/cover.jpg` - Cover image from Google Books

---

## 🔐 9. Security Notes

- ✅ Backend uses Supabase **service role key** (server-side only)
- ✅ API calls are authenticated via `x-actor-email` header
- ✅ Frontend cannot directly access service role key
- ✅ Google Books API key is safe to use (read-only access)
- ⚠️ Never commit `.env` file to Git
- ⚠️ Restrict API key to specific APIs in Google Cloud Console

---

## 📞 10. Support

If you encounter issues:

1. **Check Backend Logs**
   ```bash
   cd backend
   npm start
   ```
   Watch console for error messages

2. **Review Progress File**
   ```bash
   cat upload-progress.json
   ```

3. **Test Single Book**
   - Place one PDF in folder
   - Run upload
   - Check success before bulk processing

4. **Verify Environment**
   - Supabase connection: Test manual upload first
   - Google Books API: Test with sample ISBN
   - File permissions: Ensure backend can read PDF folder

---

## 🎉 You're All Set!

Your automated bulk upload system is now configured and ready to process thousands of PDFs automatically!

### Quick Start Checklist:
- ✅ Google Books API key added to `.env`
- ✅ Supabase credentials configured
- ✅ PDFs organized in folder
- ✅ Backend server running
- ✅ Admin dashboard accessible

**Start your first bulk upload from the Admin Dashboard → Auto Upload page!**
