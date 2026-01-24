# Specific Users Email Selection Enhancement

## Overview
Enhanced the email notification system to allow admins to fetch Supabase users and select them via checkboxes instead of manually typing email addresses.

## Changes Made

### Frontend (SendEmails.jsx)

#### 1. New State Variables
```jsx
// User selection states
const [availableUsers, setAvailableUsers] = useState([]);
const [selectedUsers, setSelectedUsers] = useState([]);
const [usersLoading, setUsersLoading] = useState(false);
const [showUserList, setShowUserList] = useState(false);
```

#### 2. New useEffect Hook
Triggers when `recipientType` changes to 'specific_users':
- Fetches available users from the backend
- Clears selected users when switching away from 'specific_users'
- Shows/hides the user list UI

#### 3. New Functions
- **fetchAvailableUsers()**: Calls `/api/admin/users` to fetch all Supabase users
- **handleUserSelect()**: Toggles user selection on/off
- **isUserSelected()**: Checks if a user is in the selection

#### 4. Updated Form Validation
- Changed from checking `specificEmails.trim()` to `selectedUsers.length === 0`
- Validates that at least one user is selected when using 'specific_users' type

#### 5. Updated Send Handler
- Changed from parsing `specificEmails` string to using `selectedUsers` array
- Converts selected users to email list: `selectedUsers.map((user) => ({ email: user.email }))`

#### 6. New UI Component
Replaced textarea input with:
- Scrollable list (max-height 300px, border-radius 8px)
- Checkbox for each user with email and full_name
- Dark-themed styling matching admin dashboard
- Loading spinner while fetching users
- Warning alert if no users found
- Counter showing number of selected users

### Backend (emailNotifications.js)

#### New Endpoint: GET `/api/admin/users`

**Purpose**: Fetch all Supabase users for selection in the email UI

**Response Format**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name"
    }
  ]
}
```

**Features**:
- Fetches up to 10,000 users
- Returns only id, email, and full_name fields
- Orders by email alphabetically
- Includes error handling and logging
- Uses getSupabaseClient() for consistent database access

## User Experience Flow

1. Admin selects "Specific Users (Select from database)" in recipient type dropdown
2. Component automatically fetches all available users from Supabase
3. Users are displayed in a scrollable list with checkboxes
4. Admin ticks/unticks users to select recipients
5. Selection count displayed below the list
6. When sending, selected users' emails are used as recipients

## Benefits

✅ **No Manual Entry**: Eliminates error-prone manual email typing
✅ **User Validation**: Automatically pulls from verified database users
✅ **Visual Selection**: Clear checkbox interface for easy selection
✅ **Scalable**: Supports up to 10,000 users
✅ **Responsive**: Scrollable list prevents UI overflow
✅ **Dark Theme**: Matches existing admin dashboard styling

## Technical Details

### Database Query
- Table: `public.users`
- Fields: `id, email, full_name`
- Limit: 10,000 rows (configurable)
- Order: By email ASC

### API Endpoint
- Route: `GET /api/admin/users`
- Mount Point: `/api/admin` (via emailNotificationsRouter in index.js)
- Full URL: `http://localhost:5000/api/admin/users`

### Component State Management
- Uses React hooks (useState, useEffect)
- Selected users stored as array of `{ id, email }` objects
- Auto-clears selection when changing recipient type
- Independent from other form fields

## Files Modified

1. **src/SomaLux/Books/Admin/pages/SendEmails.jsx**
   - Added 4 new state variables
   - Added 2 new useEffect hooks
   - Added 3 new handler functions
   - Replaced textarea with checkbox list UI
   - Updated validation and send logic

2. **backend/routes/emailNotifications.js**
   - Added new GET /users endpoint
   - Includes error handling and logging

3. **backend/index.js**
   - No changes (emailNotificationsRouter already mounted)

## Testing Checklist

- [ ] Backend running on localhost:5000
- [ ] Admin user has permission to view email tab
- [ ] Click "Specific Users" in recipient type dropdown
- [ ] User list loads and displays within 2 seconds
- [ ] Can select/deselect users with checkboxes
- [ ] Selection counter updates correctly
- [ ] Selected count persists until switching recipient types
- [ ] Send email with selected users succeeds
- [ ] Emails delivered to selected users only

## Future Enhancements

- Add search/filter functionality for large user lists
- Add "Select All" / "Deselect All" buttons
- Add user role/tier indicators in the list
- Add pagination for 10,000+ users
- Add export selected users to CSV
- Add saved user groups for quick selection

## Configuration

To modify user fetch limit, edit backend/routes/emailNotifications.js line 509:
```javascript
.limit(10000)  // Change this number
```

To modify displayed fields, edit line 506:
```javascript
.select('id, email, full_name')  // Add/remove fields
```
