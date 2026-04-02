# Upload History API Documentation

## Overview

Three new functions added to `pastPapersApi.js` (lines 820-921) for complete upload history tracking and retrieval.

---

## API Functions

### 1. `logUploadHistory(params)`

**Purpose:** Log a single upload attempt to the database

**Parameters:**
```javascript
{
  fileName: string,              // Original filename being uploaded
  status: 'success'|'failed'|'duplicate',  // Upload result
  paperTitle: string,            // Extracted paper title (optional)
  universityId: UUID,            // Which university (optional)
  faculty: string,               // Faculty name (optional)
  unitCode: string,              // Course/Unit code (optional)
  unitName: string,              // Course/Unit name (optional)
  year: number,                  // Academic year (optional)
  uploadedBy: UUID,              // User ID (from auth)
  errorMessage: string,          // Error details (optional, for failures)
  isDuplicate: boolean           // Duplicate flag (optional, default false)
}
```

**Returns:**
```javascript
// Success:
{
  id: UUID,
  created_at: timestamp,
  // ... all fields
}

// Failure or no user:
null
```

**Called From:**
- AutoUpload.jsx line 1108 (duplicate detection)
- AutoUpload.jsx line 1145 (successful upload)
- AutoUpload.jsx line 1169 (error handler)

**Examples:**

Log a successful upload:
```javascript
await logUploadHistory({
  fileName: 'MATH101_Calculus_2024_1.pdf',
  status: 'success',
  paperTitle: 'Calculus Past Paper',
  universityId: 'uuid-of-egerton',
  faculty: 'Faculty of Science',
  unitCode: 'MATH101',
  unitName: 'Calculus I',
  year: 2024,
  uploadedBy: currentUser.id,
  isDuplicate: false
});
```

Log a duplicate:
```javascript
await logUploadHistory({
  fileName: 'MATH101_Calculus_2024_1.pdf',
  status: 'duplicate',
  isDuplicate: true,
  uploadedBy: currentUser.id,
  // ... other optional fields
});
```

Log a failure:
```javascript
await logUploadHistory({
  fileName: 'BROKEN_FILE.pdf',
  status: 'failed',
  errorMessage: 'PDF parsing failed: Invalid file format',
  uploadedBy: currentUser.id,
  // ... other fields
});
```

---

### 2. `fetchUploadHistory(params)`

**Purpose:** Retrieve upload history with optional filtering and pagination

**Parameters:**
```javascript
{
  page: number,                 // Page number (default: 1)
  pageSize: number,             // Records per page (default: 20)
  status: 'success'|'failed'|'duplicate'|null,  // Filter by status
  universityId: UUID|null,      // Filter by university
  startDate: Date|null,         // Filter by start date
  endDate: Date|null,           // Filter by end date
  uploadedBy: UUID|null         // Filter by uploader
}
```

**Returns:**
```javascript
{
  data: [
    {
      id: UUID,
      file_name: string,
      status: string,
      paper_title: string,
      university_id: UUID,
      universities: {              // Joined data
        name: string,
        code: string
      },
      faculty: string,
      unit_code: string,
      unit_name: string,
      year: number,
      uploaded_by: UUID,
      profiles: {                   // Joined data
        full_name: string,
        email: string
      },
      error_message: string|null,
      is_duplicate: boolean,
      created_at: timestamp,
      updated_at: timestamp
    },
    // ... more records
  ],
  count: number                     // Total records matching filter
}
```

**Called From:**
- UploadHistory.jsx line 26 (load history on mount/filter change)

**Examples:**

Get all history:
```javascript
const result = await fetchUploadHistory({});
console.log(result.data);        // All records
console.log(result.count);       // Total count
```

Get page 2 with 30 per page:
```javascript
const result = await fetchUploadHistory({
  page: 2,
  pageSize: 30
});
```

Get only successful uploads:
```javascript
const result = await fetchUploadHistory({
  status: 'success'
});
```

Get only failed uploads for specific university:
```javascript
const result = await fetchUploadHistory({
  status: 'failed',
  universityId: 'uuid-of-egerton'
});
```

Get uploads by specific user between dates:
```javascript
const result = await fetchUploadHistory({
  uploadedBy: 'uuid-of-admin',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});
```

**SQL Query Built:**
```sql
SELECT
  uh.*,
  u.name as universities_name,
  u.code as universities_code,
  p.full_name as profiles_full_name,
  p.email as profiles_email
FROM past_papers_upload_history uh
LEFT JOIN universities u ON uh.university_id = u.id
LEFT JOIN profiles p ON uh.uploaded_by = p.id
WHERE [conditions]
ORDER BY uh.created_at DESC
LIMIT pageSize OFFSET (page-1)*pageSize
```

---

### 3. `getUploadHistoryStats()`

**Purpose:** Get aggregated upload statistics

**Parameters:** None

**Returns:**
```javascript
{
  today: number,          // Uploads since midnight today
  total: number,          // All-time uploads
  duplicates: number,     // Total duplicates detected
  failed: number,         // Total failed uploads
  successful: number      // Calculated: total - duplicates - failed
}
```

**Called From:**
- UploadHistory.jsx line 38 (load stats on mount)

**Example:**
```javascript
const stats = await getUploadHistoryStats();
console.log(stats);
// Output:
// {
//   today: 5,
//   total: 247,
//   duplicates: 12,
//   failed: 3,
//   successful: 232
// }
```

**Queries Run (Parallel):**
```sql
-- Today's uploads
SELECT COUNT(*) FROM past_papers_upload_history
WHERE DATE(created_at) = CURRENT_DATE

-- Total uploads
SELECT COUNT(*) FROM past_papers_upload_history

-- Duplicates
SELECT COUNT(*) FROM past_papers_upload_history
WHERE status = 'duplicate'

-- Failed
SELECT COUNT(*) FROM past_papers_upload_history
WHERE status = 'failed'
```

**Performance:**
- Uses `Promise.all()` to run 4 queries in parallel
- Result cached if called multiple times within same component render
- Database indexes optimize queries:
  - `idx_upload_history_created_at`
  - `idx_upload_history_status`

---

## Database Schema

```sql
CREATE TABLE past_papers_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'duplicate')),
  paper_title TEXT,
  university_id UUID REFERENCES universities(id),
  faculty TEXT,
  unit_code TEXT,
  unit_name TEXT,
  year INTEGER,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  error_message TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_upload_history_created_at ON past_papers_upload_history(created_at DESC);
CREATE INDEX idx_upload_history_uploaded_by ON past_papers_upload_history(uploaded_by);
CREATE INDEX idx_upload_history_status ON past_papers_upload_history(status);
CREATE INDEX idx_upload_history_university_id ON past_papers_upload_history(university_id);
CREATE INDEX idx_upload_history_unit_code ON past_papers_upload_history(unit_code);
```

---

## Security & RLS Policies

**Row-Level Security Enabled:** YES

**Policy 1: View Own Uploads**
```sql
CREATE POLICY "Users can view their own upload history"
  ON past_papers_upload_history
  FOR SELECT
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```
- Users see only uploads they made
- Admins see all uploads

**Policy 2: Create History Records**
```sql
CREATE POLICY "Authenticated users can insert upload history"
  ON past_papers_upload_history
  FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());
```
- Only logged-in users can insert
- Can only set `uploaded_by` to their own ID

**Policy 3: Admin Can Update**
```sql
CREATE POLICY "Admins can update upload history"
  ON past_papers_upload_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```
- Only admins can modify existing records
- For future enhancements (mark reviewed, etc.)

---

## Error Handling

### logUploadHistory() Errors
```javascript
try {
  await logUploadHistory({...});
} catch (error) {
  console.error('Failed to log upload:', error);
  // Continues anyway - doesn't block upload
}
```

### fetchUploadHistory() Errors
```javascript
try {
  const result = await fetchUploadHistory({...});
  setHistory(result.data || []);
} catch (error) {
  console.error('Failed to load history:', error);
  // Returns empty array, shows "No data" message
}
```

### getUploadHistoryStats() Errors
```javascript
try {
  const stats = await getUploadHistoryStats();
  setStats(stats);
} catch (error) {
  console.error('Failed to load stats:', error);
  // Still shows UI with default stats
}
```

---

## Integration Points

### Called From AutoUpload.jsx

**Line 1108 - Duplicate Detection:**
```javascript
if (isDuplicate) {
  await logUploadHistory({
    fileName: file.name,
    status: 'duplicate',
    isDuplicate: true,
    // ... metadata
  });
}
```

**Line 1145 - Success Path:**
```javascript
const createdPaper = await createPastPaper({...});
if (createdPaper) {
  await logUploadHistory({
    fileName: file.name,
    status: 'success',
    paperTitle: createdPaper.title,
    // ... metadata
  });
}
```

**Line 1169 - Error Handler:**
```javascript
.catch(error => {
  await logUploadHistory({
    fileName: file.name,
    status: 'failed',
    errorMessage: error?.message,
    // ... metadata
  }).catch(err => console.error('Failed to log error:', err));
});
```

### Called From UploadHistory.jsx

**Line 26 - Load History:**
```javascript
const result = await fetchUploadHistory({
  page,
  pageSize,
  status: statusFilter
});
setHistory(result.data || []);
setTotalCount(result.count || 0);
```

**Line 38 - Load Stats:**
```javascript
const stats = await getUploadHistoryStats();
setStats(stats);
```

---

## Performance Considerations

### Query Optimization
- **Indexes:** 5 indexes on frequently queried columns
- **Pagination:** Limits data transfer (20 records default)
- **Joins:** Uses efficient LEFT JOINs
- **Parallel Queries:** Stats uses Promise.all()

### Caching Strategy
- Component-level caching via React state
- No global cache (data changes with each upload)
- Refresh on mount and filter change

### Expected Latencies
- `logUploadHistory()`: <100ms (simple insert)
- `fetchUploadHistory()`: 50-200ms (depends on filters)
- `getUploadHistoryStats()`: 100-300ms (4 parallel queries)

---

## Future Enhancements

1. **Export to CSV**
   - Add export button to UploadHistory component
   - Call new `exportUploadHistoryCSV()` function

2. **Date Range Filtering**
   - Add date picker inputs
   - Pass startDate/endDate to `fetchUploadHistory()`

3. **Advanced Filtering**
   - Faculty dropdown filter
   - University dropdown filter
   - User/uploader filter

4. **Analytics Dashboard**
   - Charts for uploads over time
   - Success rate percentage
   - Most uploaded units
   - Top uploaders

5. **Email Notifications**
   - Alert on failed uploads
   - Daily summary report
   - Alert on duplicate detection

6. **Audit Trail**
   - Who viewed what history
   - When records were accessed
   - Export audit logs

---

## Maintenance

### Regular Tasks
1. **Monitor table size:** Check if past_papers_upload_history grows too large
2. **Archive old data:** After 1 year, archive to separate table
3. **Verify indexes:** Ensure indexes are being used efficiently
4. **Check RLS performance:** Verify policies don't slow queries

### Troubleshooting
- **Slow history queries:** Add indexes on filter columns
- **Missing records:** Check RLS policies are correct
- **Failed uploads not logged:** Verify `try/catch` in error handler
- **Stats always zero:** Run migration to create table

