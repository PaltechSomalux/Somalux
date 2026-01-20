# 📝 Code Changes - User Notifications Implementation

## Files Modified

### 1. `backend/index.js`
Added 3 major changes for user notifications

---

## Change 1: Approval WebSocket Notification

**Location:** Lines 3975-4020 in `backend/index.js`  
**When:** User's file is approved by admin

```javascript
// Send in-app notification via WebSocket
if (sub.uploaded_by) {
  try {
    const isPastPaper = type === 'past_papers';
    const itemName = isPastPaper
      ? `${sub.unit_code || ''} ${sub.unit_name || ''} (${sub.year})`.trim() || 'Past Paper'
      : sub.title || 'Your Book';

    const notificationMessage = {
      type: 'submission_approved',
      title: 'Submission Approved! 🎉',
      message: `Your ${isPastPaper ? 'past paper' : 'book'} "${itemName}" has been approved and is now live!`,
      submissionId: id,
      submissionType: type,
      timestamp: nowIso,
    };

    // Send via WebSocket to user if connected
    if (userChannels.has(sub.uploaded_by)) {
      const userConnections = userChannels.get(sub.uploaded_by);
      userConnections.forEach((ws) => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify(notificationMessage));
        }
      });
      console.log('📲 [IN-APP NOTIFICATION] Approval notification sent via WebSocket to user:', sub.uploaded_by);
    }
  } catch (notifyErr) {
    console.warn('⚠️ [IN-APP NOTIFICATION] Failed to send WebSocket notification:', notifyErr);
    // Non-blocking
  }
}
```

**What it does:**
1. Checks if user who uploaded has a WebSocket connection
2. If connected, sends notification immediately
3. Notification includes approval confirmation and item title
4. Logged to console for debugging
5. Non-blocking - failure doesn't fail the approval

---

## Change 2: Rejection WebSocket Notification

**Location:** Lines 4133-4165 in `backend/index.js`  
**When:** User's file is rejected by admin

```javascript
// Send in-app notification via WebSocket
if (submission.uploaded_by) {
  try {
    const itemName = submission.title?.trim() || 'Your submission';

    const notificationMessage = {
      type: 'submission_rejected',
      title: 'Submission Status Update',
      message: `Your submission "${itemName}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
      submissionId: id,
      submissionType: type,
      reason: reason || null,
      timestamp: nowIso,
    };

    // Send via WebSocket to user if connected
    if (userChannels.has(submission.uploaded_by)) {
      const userConnections = userChannels.get(submission.uploaded_by);
      userConnections.forEach((ws) => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify(notificationMessage));
        }
      });
      console.log('📲 [IN-APP NOTIFICATION] Rejection notification sent via WebSocket to user:', submission.uploaded_by);
    }
  } catch (notifyErr) {
    console.warn('⚠️ [IN-APP NOTIFICATION] Failed to send WebSocket notification:', notifyErr);
    // Non-blocking
  }
}
```

**What it does:**
1. Checks if user who uploaded has a WebSocket connection
2. If connected, sends rejection notification immediately
3. Includes rejection reason if admin provided one
4. Notification title is "Submission Status Update"
5. Non-blocking - failure doesn't fail the rejection

---

## Change 3: Notification History Endpoint

**Location:** Lines 6188-6260 in `backend/index.js`  
**Endpoint:** `GET /api/user/notifications`  
**Purpose:** Users can fetch their complete notification history

```javascript
// Get user notifications (approval/rejection status updates)
app.get('/api/user/notifications', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase not configured' });

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'Missing x-user-id header' });
    }

    // Fetch user's submission approval/rejection history
    const { data: bookSubmissions, error: bookErr } = await supabaseAdmin
      .from('book_submissions')
      .select('id, title, status, approved_at, rejected_at, admin_notes')
      .eq('uploaded_by', userId)
      .in('status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: paperSubmissions, error: paperErr } = await supabaseAdmin
      .from('past_paper_submissions')
      .select('id, unit_code, unit_name, year, status, approved_at, rejected_at, admin_notes')
      .eq('uploaded_by', userId)
      .in('status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (bookErr || paperErr) {
      console.error('Error fetching notifications:', { bookErr, paperErr });
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Transform into notification objects
    const notifications = [
      ...(bookSubmissions || []).map(sub => ({
        id: sub.id,
        type: 'book',
        title: sub.title,
        status: sub.status,
        timestamp: sub.status === 'approved' ? sub.approved_at : sub.rejected_at,
        reason: sub.admin_notes,
        message: sub.status === 'approved' 
          ? `Your book "${sub.title}" has been approved and published!`
          : `Your book submission "${sub.title}" was not approved.${sub.admin_notes ? ` Reason: ${sub.admin_notes}` : ''}`
      })),
      ...(paperSubmissions || []).map(sub => {
        const paperName = `${sub.unit_code} ${sub.unit_name} (${sub.year})`.trim();
        return {
          id: sub.id,
          type: 'paper',
          title: paperName,
          status: sub.status,
          timestamp: sub.status === 'approved' ? sub.approved_at : sub.rejected_at,
          reason: sub.admin_notes,
          message: sub.status === 'approved'
            ? `Your past paper "${paperName}" has been approved and published!`
            : `Your past paper submission "${paperName}" was not approved.${sub.admin_notes ? ` Reason: ${sub.admin_notes}` : ''}`
        };
      })
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      ok: true,
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});
```

**What it does:**
1. Requires `x-user-id` header (user authentication)
2. Fetches user's approved and rejected book submissions (last 50)
3. Fetches user's approved and rejected past paper submissions (last 50)
4. Transforms data into notification objects
5. Returns sorted by newest first
6. Includes status, timestamp, reason, and formatted message

**Request Format:**
```bash
curl -H "x-user-id: user-uuid" https://backend.com/api/user/notifications
```

**Response Format:**
```json
{
  "ok": true,
  "count": 3,
  "notifications": [
    {
      "id": "submission-uuid",
      "type": "book",
      "title": "Advanced JavaScript",
      "status": "approved",
      "timestamp": "2026-01-20T10:30:00Z",
      "reason": null,
      "message": "Your book \"Advanced JavaScript\" has been approved and published!"
    },
    {
      "id": "submission-uuid",
      "type": "paper",
      "title": "CS101 Past Papers (2024)",
      "status": "rejected",
      "timestamp": "2026-01-19T14:15:00Z",
      "reason": "Please update format",
      "message": "Your past paper submission \"CS101 Past Papers (2024)\" was not approved. Reason: Please update format"
    }
  ]
}
```

---

## Summary of Changes

| Change | Type | Lines | Purpose |
|--------|------|-------|---------|
| **Approval Notification** | WebSocket | 3975-4020 | Send real-time notification when file approved |
| **Rejection Notification** | WebSocket | 4133-4165 | Send real-time notification when file rejected |
| **Notifications History** | REST API | 6188-6260 | Allow users to fetch notification history |

---

## How They Work Together

```
Flow 1: Real-Time Approval
  Admin clicks APPROVE
    ↓
  Database updated (status='approved')
    ↓
  Change 1 executes:
    - Creates notification object
    - Checks if user is WebSocket connected
    - Sends notification immediately (if online)
    - Logs success/failure
    ↓
  Email also sent (existing system)
    ↓
  User gets INSTANT notification + EMAIL

Flow 2: Real-Time Rejection
  Admin clicks REJECT + enters reason
    ↓
  Database updated (status='rejected')
    ↓
  Change 2 executes:
    - Creates notification with reason
    - Checks if user is WebSocket connected
    - Sends notification immediately (if online)
    - Logs success/failure
    ↓
  Email also sent (existing system)
    ↓
  User gets INSTANT notification + EMAIL

Flow 3: Fetch History Anytime
  User calls GET /api/user/notifications
    ↓
  Change 3 executes:
    - Validates user ID
    - Fetches all approved/rejected submissions
    - Transforms into notification objects
    - Sorts by date (newest first)
    ↓
  Returns notification history
    ↓
  User can see all past notifications
```

---

## Integration Points

### WebSocket System
- Uses existing `userChannels` Map (line 660)
- Reuses `join_user` message type
- Sends custom notification messages
- Checks connection state before sending

### Email System
- No changes to existing email logic
- Both approval and rejection emails still sent
- WebSocket is additional/faster channel

### Database
- Reads from existing submission tables
- No schema changes needed
- Uses existing `uploaded_by` field to find users
- Uses existing `status`, `approved_at`, `rejected_at`, `admin_notes` fields

---

## Dependencies

**None added!** Uses existing:
- ✅ WebSocket (`userChannels`)
- ✅ Email service (`sendEmail`)
- ✅ Supabase (`supabaseAdmin`)
- ✅ Database tables (book_submissions, past_paper_submissions)

---

## Testing the Code

### Test Approval Notification
```bash
# 1. Have user connect to WebSocket and join user channel
# 2. Admin approves user's file
# 3. Console shows: 📲 [IN-APP NOTIFICATION] Approval notification sent via WebSocket to user: [user-id]
# 4. Frontend receives notification object with type='submission_approved'
```

### Test Rejection Notification
```bash
# 1. Have user connect to WebSocket and join user channel
# 2. Admin rejects user's file with reason
# 3. Console shows: 📲 [IN-APP NOTIFICATION] Rejection notification sent via WebSocket to user: [user-id]
# 4. Frontend receives notification object with type='submission_rejected' and reason
```

### Test History API
```bash
curl -H "x-user-id: user-uuid" \
  https://somalux-backend.onrender.com/api/user/notifications
# Returns JSON with all approved/rejected submissions
```

---

## Performance Impact

- **WebSocket notifications:** O(1) - direct send to connected user
- **History API:** O(n) where n = number of submissions (typically small)
- **CPU:** Negligible - simple JSON creation and sending
- **Network:** ~100-200 bytes per notification
- **Database:** 2 queries (one for books, one for papers)

---

## Error Handling

All changes include try-catch blocks:
- ✅ WebSocket send failures don't fail approval/rejection
- ✅ User not connected is not an error (email will notify)
- ✅ API errors return proper HTTP status codes
- ✅ Full error logging to console for debugging

