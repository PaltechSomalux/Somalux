# Bulk Upload Feature Guide

## Overview
The **Automatic Bulk Upload** feature allows admins to scan server directories and automatically upload all PDFs with metadata extraction. This is useful for migrating large collections of books.

---

## Important: 400 Bad Request Error

If you receive a **400 Bad Request** error when starting a bulk upload, the most common cause is:

### ❌ Invalid Path

The path you provided either:
1. **Doesn't exist** on the server
2. **Isn't accessible** due to permissions
3. **Is a local computer path** (won't work with Render or cloud deployments)

### Example Error Messages

```
Directory not found: "D:\Books"
Directory not accessible. Please check permissions and path.
```

---

## Deployment-Specific Instructions

### 🖥️ Local Development (Your Computer)

✅ **Supported Paths:**
- Windows: `C:\Users\YourName\Documents\Books`
- Windows: `D:\PDF Collection\Books`
- Linux/Mac: `/home/username/books`
- Linux/Mac: `/Users/username/Documents/books`

**Steps:**
1. Create a folder on your computer with PDF files
2. Note the **full path** to that folder
3. Open AutoUpload in admin panel
4. Paste the path (e.g., `C:\Books\PDFs`)
5. Click **Start Upload**

### ☁️ Render Deployment (Cloud)

❌ **Local Paths Don't Work**

Render is a cloud platform without access to your local computer files. You have two options:

#### Option 1: Use Regular Upload (Recommended)
Instead of bulk upload, use the **Upload** button to select files via browser:
- More reliable for cloud deployments
- No path configuration needed
- Supports same metadata extraction

#### Option 2: Access Server Storage (Advanced)
Contact Render support to learn:
- What storage paths are available on your instance
- Whether persistent storage is enabled
- How to mount network storage if needed

Common Render paths (if storage is configured):
- `/storage` - Persistent volume
- `/tmp` - Temporary volume (deleted on restart)
- `/home/app` - Application directory (may not have storage)

### 🐳 Docker Deployments

If the app runs in Docker, paths depend on your volume mounts.

**Common paths:**
- `/app/uploads` - If uploads volume is mounted
- `/data` - If data volume is mounted
- `/var/lib/app/books` - Application-specific

Check your `docker-compose.yml` or `Dockerfile` for volume configurations:
```yaml
volumes:
  - ./books:/app/books  # Host path : Container path
```

Then use the **container path** in AutoUpload (e.g., `/app/books`)

---

## How the Feature Works

### 1. Directory Scan
The server scans the folder you provide and finds all PDF files (including subfolders).

### 2. Metadata Extraction
For each PDF, the system:
- Extracts the first page as a cover image
- Reads metadata from the PDF (title, author, etc.) if available
- Extracts ISBN if present
- Detects language

### 3. Duplicate Detection (Optional)
If enabled, checks if the book already exists by ISBN:
- ✅ Skip duplicates - Won't re-upload the same book
- ❌ Upload all - Uploads even if ISBN matches (may create duplicates)

### 4. Upload Process
- **For Admins:** Books are published immediately
- **For Users:** Books are submitted for admin approval

### 5. Background Processing
After you click Start, the upload runs in the background:
- You can close the page or browser
- Process continues on the server
- Check status anytime by returning to AutoUpload

---

## Troubleshooting

### Error: "Directory not found"
**Solution:**
1. Double-check the path spelling
2. Verify the folder exists on the server
3. Ensure you have read permissions
4. If using Render, ask support for valid paths

### Error: "Directory not accessible"
**Solution:**
1. Check folder permissions (needs read access)
2. Ensure the server process user can access the path
3. On Windows, use full path including drive letter
4. On Linux/Mac, use absolute path (starting with `/`)

### Process starts but shows 0% progress
**Solution:**
1. The folder may be empty or contain no PDFs
2. Check if PDFs are in subfolders (feature supports nested folders)
3. Verify file extensions are `.pdf` (case-sensitive on Linux/Mac)
4. Check server logs for detailed error messages

### Upload completes but books don't appear
**Solution:**
1. If submitted as user uploads, check admin approval queue
2. Check Submissions > Pending for books awaiting approval
3. Refresh the Books page to see published books
4. Check backend logs for any upload errors

---

## Best Practices

✅ **DO:**
- Test with a small folder first (5-10 books)
- Keep ISBN information in PDFs for duplicate detection
- Use consistent folder structure
- Monitor progress periodically
- Keep the server path accessible (don't delete the folder)

❌ **DON'T:**
- Try to use your local computer path on Render
- Move/delete files while upload is in progress
- Upload corrupted PDF files
- Use very long file paths (>260 characters on Windows)
- Expect cloud deployments to scan your local computer

---

## Performance Notes

| Metric | Time |
|--------|------|
| Scan folder | Depends on file count (fast) |
| Extract metadata per PDF | 1-3 seconds |
| Upload to Supabase per PDF | 2-5 seconds |
| Total for 10 PDFs | ~30-80 seconds |
| Total for 100 PDFs | ~5-15 minutes |

Process runs in background - you don't need to wait.

---

## Alternative: Regular File Upload

If bulk upload isn't working, use the **Upload** button instead:
- Browse your computer for files
- Upload one or multiple files at a time
- Same metadata extraction
- Works everywhere (local, cloud, Docker)

The only difference: regular upload is one file at a time instead of scanning a folder.

---

## Getting Help

If bulk upload still doesn't work:
1. Check this guide for your deployment type
2. Verify the path exists and is accessible
3. Check server logs for error details
4. Use regular Upload feature as a workaround
5. Contact support with:
   - The exact path you're trying
   - Your deployment type (local, Render, Docker, etc.)
   - The full error message
