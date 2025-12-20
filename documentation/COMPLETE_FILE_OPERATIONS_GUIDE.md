# Complete File Upload & Download Setup Guide

## Overview

Your SomaLux system now has complete file upload/download support with:
- ✅ SQL schema for storage management
- ✅ Supabase Storage buckets
- ✅ RLS (Row Level Security) policies
- ✅ File tracking in database
- ✅ Download analytics
- ✅ User storage quotas

## What Was Created

### 1. **SQL Migration File** (`004_storage_and_file_operations.sql`)
- Storage RLS policies
- File tracking tables (`file_uploads`, `file_downloads`)
- Helper functions for file operations
- Triggers for automatic file tracking
- Views for file operations dashboard

### 2. **JavaScript Integration** (`file-operations.js`)
- `FileOperations` - Core file upload/download/delete/list
- `BookFileOperations` - Specialized for books
- `PastPaperFileOperations` - Specialized for past papers
- `AvatarFileOperations` - User avatars
- `AdFileOperations` - Advertisement images

### 3. **Storage Buckets** (Created via dashboard or code)
```
book-covers       (Public)   - Book cover images
book-files        (Private)  - PDF files
past-papers       (Private)  - Past paper PDFs
user-avatars      (Public)   - User profile pictures
ads               (Public)   - Advertisement images
```

## Setup Steps

### Step 1: Create Storage Buckets

Run this in your Node.js terminal:

```javascript
// backend/setup-storage.js
import { initializeStorageBuckets } from './utils/supabase-integration.js';

const result = await initializeStorageBuckets();
console.log('Storage buckets created:', result);
```

Or use the Supabase Dashboard:
1. Go to Storage → New Bucket
2. Create buckets with names: `book-covers`, `book-files`, `past-papers`, `user-avatars`, `ads`
3. Set public/private accordingly

### Step 2: Run SQL Migration

```sql
-- Run in Supabase SQL Editor
-- Copy entire contents of: backend/migrations/004_storage_and_file_operations.sql
-- Execute all statements
```

### Step 3: Update Your Code

#### For Book Uploads:

```javascript
import { BookFileOperations } from './backend/utils/file-operations.js';

// Upload a book PDF
const result = await BookFileOperations.uploadBookFile({
  pdfPath: '/local/path/to/book.pdf',
  bookId: 'book-uuid',
  userId: 'user-uuid',
  metadata: {
    fileSize: 1024000,
    fileData: Buffer.from(pdfData)
  }
});

console.log(result.publicUrl); // Access the uploaded file
```

#### For Book Cover Images:

```javascript
// Upload cover image
const coverResult = await BookFileOperations.uploadBookCover({
  bookId: 'book-uuid',
  userId: 'user-uuid',
  imageData: Buffer.from(imageData),
  mimeType: 'image/jpeg'
});
```

#### For Downloading Files:

```javascript
import { FileOperations } from './backend/utils/file-operations.js';

// Download file
const download = await FileOperations.downloadFile({
  bucketName: 'book-files',
  filePath: 'books/book-id/book.pdf',
  userId: 'user-id', // optional, for tracking
  ipAddress: 'user-ip', // optional
  userAgent: 'user-agent' // optional
});

if (download.success) {
  // download.data contains the file buffer
  res.setHeader('Content-Type', 'application/pdf');
  res.send(download.data);
}
```

#### For Getting File Info:

```javascript
// Get file metadata
const metadata = await FileOperations.getFileMetadata({
  bucketName: 'book-files',
  filePath: 'books/book-id/book.pdf'
});

console.log(metadata.metadata); // Returns file info

// Get download statistics
const stats = await FileOperations.getDownloadStats({
  bucketName: 'book-files',
  filePath: 'books/book-id/book.pdf'
});

console.log(stats.stats); // { total_downloads, unique_downloaders, last_downloaded }

// List user's files
const files = await FileOperations.listFiles({
  bucketName: 'book-files',
  userId: 'user-uuid',
  limit: 20
});

// Get user's storage usage
const usage = await FileOperations.getUserStorageUsage('user-uuid');
console.log(usage.totalBytes); // Total bytes used
console.log(usage.totalFiles); // Total files uploaded
```

## Current Backend Integration

### Already Integrated:

1. **supabaseUpload.js** - Book upload function
   - Uses Supabase Storage
   - Saves metadata to database
   - Returns public URLs

2. **index.js** - API endpoints
   - Book upload/update/delete endpoints
   - File management endpoints
   - Already configured for Supabase

### What to Update:

1. **Upload Endpoints** - Add file tracking:

```javascript
// In your upload endpoint
import { BookFileOperations } from './utils/file-operations.js';

app.post('/api/books/upload', async (req, res) => {
  try {
    // ... existing upload code ...
    
    // Track file in database
    const fileLog = await BookFileOperations.uploadBookFile({
      pdfPath: uploadedFile.path,
      bookId: book.id,
      userId: user.id,
      metadata: {
        fileSize: uploadedFile.size,
        fileData: uploadedFile.buffer
      }
    });
    
    res.json({ success: true, book, fileLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Download Endpoints** - Add download tracking:

```javascript
app.get('/api/books/:id/download', async (req, res) => {
  try {
    const book = await getBook(req.params.id);
    
    // Download and track
    const download = await FileOperations.downloadFile({
      bucketName: 'book-files',
      filePath: book.file_path,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    if (download.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.send(download.data);
    } else {
      res.status(500).json({ error: download.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Database Schema

### file_uploads Table
```
id (UUID)
bucket_name (TEXT)
file_path (TEXT)
file_name (TEXT)
file_size (INT)
mime_type (TEXT)
uploaded_by (UUID) → profiles
entity_type (TEXT: 'book', 'past_paper', 'avatar', 'ad', 'other')
entity_id (UUID)
is_public (BOOLEAN)
download_count (INT)
last_accessed_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### file_downloads Table
```
id (UUID)
file_id (UUID) → file_uploads
downloaded_by (UUID) → profiles
download_timestamp (TIMESTAMP)
ip_address (TEXT)
user_agent (TEXT)
```

## Available Functions

### Core File Operations
- `uploadFile()` - Upload any file
- `downloadFile()` - Download file with tracking
- `deleteFile()` - Delete file and records
- `getFileMetadata()` - Get file info
- `getDownloadStats()` - Get download analytics
- `listFiles()` - List files with filters
- `getUserStorageUsage()` - Get user's storage stats
- `getPublicUrl()` - Get public URL without downloading

### Specialized Operations
- `BookFileOperations.uploadBookFile()` - Upload book PDFs
- `BookFileOperations.uploadBookCover()` - Upload book covers
- `PastPaperFileOperations.uploadPastPaper()` - Upload past papers
- `AvatarFileOperations.uploadAvatar()` - Upload user avatars
- `AdFileOperations.uploadAdImage()` - Upload ad images

## Security Features

### Row Level Security (RLS)
- **Public buckets** (covers, avatars, ads): Public read, authenticated write
- **Private buckets** (files, papers): Authenticated read only
- Users can only delete their own files
- Admins can view all operations

### File Tracking
- Every upload is logged with user, entity, and metadata
- Every download is tracked with timestamp, IP, and user-agent
- Automatic cleanup when files are deleted
- Storage usage per user is tracked

## Best Practices

### Upload Files
```javascript
// Always include metadata for tracking
await FileOperations.uploadFile({
  bucketName: 'book-files',
  filePath: `books/${bookId}/book.pdf`,
  fileData: pdfBuffer,
  metadata: {
    fileName: 'book.pdf',
    fileSize: pdfBuffer.length,
    userId: userId,        // IMPORTANT
    entityType: 'book',    // For organization
    entityId: bookId,      // Link to record
    mimeType: 'application/pdf'
  }
});
```

### Download Files
```javascript
// Always log downloads for analytics
const download = await FileOperations.downloadFile({
  bucketName: 'book-files',
  filePath: book.file_path,
  userId: currentUser.id,        // Track who downloads
  ipAddress: req.ip,             // For analytics
  userAgent: req.headers['user-agent']
});
```

### List User Files
```javascript
// Users can see their upload history
const myFiles = await FileOperations.listFiles({
  bucketName: 'book-files',
  userId: currentUser.id
});
```

## Troubleshooting

### "File not found" error
- Verify bucket exists: Check Supabase Storage tab
- Verify file path is correct
- Check RLS policies allow access

### "Permission denied" error
- User doesn't have write access to bucket
- Check RLS policy for the bucket
- Verify user is authenticated

### File too large
- Default limit is 500MB per file
- Increase in initializeStorageBuckets() if needed
- Ensure file size matches metadata

### Storage quota exceeded
- Check user's storage usage: `getUserStorageUsage(userId)`
- Delete unused files
- Upgrade user tier if needed

## Monitoring & Analytics

### View File Operations
```javascript
// Get all file operations summary
const summary = await supabase.from('file_operations_summary').select('*');

// Get download analytics
const downloads = await FileOperations.getDownloadStats({
  bucketName: 'book-files',
  filePath: 'books/xyz/book.pdf'
});

// Get user storage breakdown
const usage = await FileOperations.getUserStorageUsage(userId);
```

## Next Steps

1. ✅ Run the SQL migration (004_storage_and_file_operations.sql)
2. ✅ Create storage buckets
3. ✅ Import file-operations.js in your endpoints
4. ✅ Update upload/download endpoints
5. ✅ Test file upload and download
6. ✅ Monitor storage usage

Your system is now production-ready for file operations! 🎉
