# Specific Users Email Selection - Setup & Testing Guide

## Quick Start

### Prerequisites
- Backend running on `http://localhost:5000`
- Supabase users table populated with test users
- Admin user with access to email notification system

### Step 1: Verify Backend is Running
```bash
cd c:\Intel\Magic\SomaLux\backend
npm start
# Should see: ✅ Backend + WebSocket server running on http://localhost:5000
```

### Step 2: Test the Users API Endpoint
Open browser and navigate to:
```
http://localhost:5000/api/admin/users
```

Should return JSON like:
```json
{
  "success": true,
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user1@example.com",
      "full_name": "John Doe"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "user2@example.com",
      "full_name": "Jane Smith"
    }
  ]
}
```

### Step 3: Test the Frontend Component
1. Navigate to Admin Dashboard
2. Go to "Send Emails" section
3. Click on the "Email Notifications" tab (first tab)
4. In the "Who should receive this?" dropdown, select "Specific Users (Select from database)"
5. You should see:
   - Loading spinner briefly
   - List of users with checkboxes
   - Each user showing email and full name
   - Selection counter below the list

### Step 4: Test User Selection
1. Click checkboxes to select users
2. Verify selection counter updates
3. Try selecting/deselecting multiple users
4. Switch to different recipient type - selected users should clear
5. Switch back to "Specific Users" - list should reload

### Step 5: Send Email to Selected Users
1. Select users from the list (e.g., 3 users)
2. Fill in required fields:
   - Notification Type: e.g., "General Message"
   - Subject/Title: e.g., "Test Email"
   - Message Body: e.g., "This is a test"
3. Click "Send Email" button
4. Check backend logs for confirmation

## Expected Behavior

### When Loading "Specific Users"
- Spinner shows while loading
- Within 1-2 seconds, users list appears
- Users sorted alphabetically by email
- Each user shows as a checkbox with email and name

### When Selecting Users
- Click checkbox: user added to selection
- Click again: user removed from selection
- Counter updates: "Selected X users"
- Selection persists until form reset or recipient type change

### When Switching Recipient Types
- Previous selections clear
- If switching back to "Specific Users", need to select again
- No selection data loss to other fields

### When Sending Email
- Selected users' emails used as recipients
- Should see: "Successfully sent to X recipients"
- Check notification history to verify

## Troubleshooting

### Users List Not Loading
**Problem**: Spinner shows but list never appears
**Solution**:
- Check browser console for errors
- Verify backend is running: `curl http://localhost:5000/api/admin/users`
- Check backend logs for database connection errors
- Restart backend: `npm start`

### Users List is Empty
**Problem**: "No users found in the system" message
**Solution**:
- Check Supabase users table has data
- Verify RLS policies allow reading users table
- Check backend logs for SQL errors
- Query Supabase directly: `SELECT id, email, full_name FROM users LIMIT 5;`

### Selection Not Working
**Problem**: Clicking checkboxes doesn't select users
**Solution**:
- Check browser console for JavaScript errors
- Verify Material-UI Checkbox component renders
- Refresh page and try again
- Check React DevTools for state updates

### Send Email Fails After Selection
**Problem**: Error when sending to selected users
**Solution**:
- Verify at least one user is selected
- Check validation message for specific error
- Check backend logs for email sending errors
- Verify selected users' emails are valid
- Check email service credentials in backend

## Debug Commands

### Check Users in Database
```bash
# Via Supabase CLI
supabase db query "SELECT id, email, full_name FROM public.users LIMIT 10;"
```

### Check Backend Logs
```bash
# In backend directory
tail -f backend.log
# or
npm start 2>&1 | tee backend.log
```

### Test API Directly
```bash
# Get users list
curl -X GET http://localhost:5000/api/admin/users

# Send email (replace with actual data)
curl -X POST http://localhost:5000/api/admin/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "message": "Test message",
    "notificationType": "general",
    "recipientType": "specific_users",
    "recipientsList": [
      {"email": "user1@example.com"},
      {"email": "user2@example.com"}
    ]
  }'
```

## Performance Considerations

### User List with 10,000+ Users
- Component limits to 300px height (scrollable)
- Fetches up to 10,000 users from backend
- May be slow if database has millions of users
- Consider adding pagination for production

### Selection Performance
- Keeping track of selected users in memory
- Should handle 1000+ selections without issue
- If performance degrades, implement virtual scrolling

## Production Checklist

- [ ] Database has proper indexes on `users` table
- [ ] RLS policies allow admin to read users table
- [ ] Email sending limits verified
- [ ] Tested with 1000+ users
- [ ] Tested with multiple simultaneous admins
- [ ] Verified email delivery to selected users
- [ ] Logged all selections in audit trail
- [ ] Error handling covers all edge cases

## Next Steps

1. **Add Search/Filter**: Implement user search in the list
2. **Select All Button**: Add quick selection of all users
3. **User Roles**: Show user role/tier in the list
4. **Pagination**: Add pagination for large user lists
5. **Saved Groups**: Let admins save user groups for reuse
6. **Audit Log**: Log who sent emails to which users

## Files to Monitor

- `src/SomaLux/Books/Admin/pages/SendEmails.jsx` - Frontend component
- `backend/routes/emailNotifications.js` - Backend routes
- `backend/index.js` - Server setup (verify route mount)
- Browser DevTools → Console - Client-side errors
- `backend.log` or terminal output - Server-side errors
