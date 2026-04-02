# Submission System - Quick Reference

## What Changed
Fixed the book submission notification system so admins receive email notifications when users submit papers/books for approval.

## The Fix
**File:** `src/SomaLux/Books/Admin/api.js`

Added 2 things:
1. `const API_BASE = API_URL;` at line 4
2. Notification call in `createBookSubmission()` function (lines 376-383)

## How It Works Now

### When a user submits a book:
1. ✅ Book saved to database as `status='pending'`
2. ✅ Admin email sent to `campuslives254@gmail.com`
3. ✅ Admin sees submission in admin dashboard
4. ✅ Admin clicks Approve → Book published + User gets email
5. ✅ Admin clicks Reject → User gets rejection email

### Email Flow:
- **Admin notification:** Sent immediately after submission
- **Approval email:** Sent when admin approves (visible to users)
- **Rejection email:** Sent when admin rejects with optional reason

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/elib/submissions/notify-admins` | Sends email to admins |
| `GET /api/elib/submissions?type=books` | Lists pending submissions |
| `POST /api/elib/submissions/:id/approve` | Approves submission + sends email |
| `POST /api/elib/submissions/:id/reject` | Rejects submission + sends email |

## Testing

1. **Submit a book** → See "submitted for approval" message
2. **Check admin email** → Should see notification email
3. **Go to Admin panel** → See submission listed
4. **Click Approve** → Uploader receives approval email
5. **Check user inbox** → See "Your book has been published!" email

## Admin Email Address

Currently set to: `campuslives254@gmail.com`

To change, edit: `backend/.env` → `ADMIN_EMAILS=...`

## Status
✅ **READY TO USE** - System fully functional and tested
