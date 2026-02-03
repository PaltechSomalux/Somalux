# Chat System: Delete User from Chat List Implementation

## Overview
Implemented a feature that allows users to delete/remove already added users from their chat list. This makes it easy for users to manage their contacts and remove conversations they no longer want to see.

## Changes Made

### 1. **ChatMenu Component** (`src/components/ChatMe/Chat/ChatMenu.jsx`)
- Added new prop: `isSelfChat` (boolean) - to hide delete option for self-chat
- Added new prop: `onDeleteUser` (function) - callback to handle user deletion
- Added new button: "Delete User" button with red styling (appears only for one-to-one chats)
- The button appears in the chat menu dropdown with a trash icon and red text color (#e63946)
- Updated PropTypes to include the new props

**Key Features:**
- Delete button only shows for non-self chats (`!isSelfChat && onDeleteUser`)
- Styled in red (#e63946) to indicate a destructive action
- Uses FiTrash2 icon from react-icons

### 2. **ChatHeader Component** (`src/components/ChatMe/Chat/ChatHeader.jsx`)
- Added new prop: `onDeleteUser` (function) - passed from parent
- Updated PropTypes to include `onDeleteUser`
- Passes `isSelfChat` and `onDeleteUser` to ChatMenu component

### 3. **ChatWindow Component** (`src/components/ChatMe/Chat/ChatWindow.jsx`)
- Added new prop: `onDeleteUser` (function) - receives from parent Chat component
- Passes `onDeleteUser` to ChatHeader component for use in the menu

### 4. **Chat Component** (`src/components/ChatMe/Chat/Chat.jsx`)
- **Imported SupabaseChatService** - for database operations
- **Created handleDeleteUser function** - handles the deletion logic:
  - Shows confirmation dialog with contact name
  - Calls `SupabaseChatService.deleteChat()` with current user ID and chat ID
  - Marks the chat as deleted in the database
  - Returns user to chat list via `onBackClick`
  - Handles errors gracefully with user-friendly alerts
- Passes `onDeleteUser={handleDeleteUser}` to ChatWindow component

## User Flow

1. **User opens a chat** with another person
2. **User clicks the menu button** (three dots) in chat header
3. **Menu appears** with options including "Delete User" (in red)
4. **User clicks "Delete User"**
5. **Confirmation dialog appears** asking: "Are you sure you want to delete [Contact Name] from your chat list? This action cannot be undone."
6. **User confirms or cancels**:
   - If **Cancel**: Dialog closes, nothing happens
   - If **Confirm**: 
     - Chat is marked as deleted in the database
     - User is automatically returned to the chat list
     - The deleted chat no longer appears in the chat list

## Technical Details

### Database Operation
- Uses `SupabaseChatService.deleteChat(userId, chatId)`
- Marks the chat as `is_deleted: true` in the `user_chats` table
- Preserves message history in case user wants to restore in future (soft delete)
- Both users can delete independently on their side

### Chat ID Generation
- For one-to-one chats: `[userA_id, userB_id].sort().join('_')`
- For self-chat: `yourself_[userId]`
- Self-chats cannot be deleted (delete button hidden)

### Error Handling
- Missing contact/user info validation
- Chat ID generation validation
- Database operation error handling
- User-friendly error messages displayed in alerts

## Files Modified

1. `src/components/ChatMe/Chat/ChatMenu.jsx` - Added delete button UI
2. `src/components/ChatMe/Chat/ChatHeader.jsx` - Added prop passing
3. `src/components/ChatMe/Chat/ChatWindow.jsx` - Added prop passing
4. `src/components/ChatMe/Chat/Chat.jsx` - Added delete logic and service call

## Existing Delete Functionality

This feature complements the existing **Delete Chat** functionality in the chat list:
- **From Chat List**: Users can right-click/tap a chat and select "Delete Chat"
- **From Chat Menu**: Users can now click menu → "Delete User" while viewing the chat
- Both methods delete the chat from the user's chat list
- The difference is convenience - users can delete while viewing the chat instead of going back to the list first

## Testing Checklist

- [ ] Open a one-to-one chat
- [ ] Click the menu button (⋮) in the chat header
- [ ] Verify "Delete User" button appears in red
- [ ] Click "Delete User"
- [ ] Confirm deletion in the dialog
- [ ] Verify user returns to chat list
- [ ] Verify the chat no longer appears in the chat list
- [ ] Test canceling the confirmation dialog
- [ ] Test with different contacts
- [ ] Verify self-chat ("Me" chat) doesn't show delete button

## Future Enhancements

1. **Block User**: Could add blocking functionality alongside delete
2. **Archive Instead**: Option to archive instead of delete
3. **Restore**: Recover recently deleted chats from an archive
4. **Batch Delete**: Delete multiple users at once from chat list
5. **Undo**: Add an undo option right after deletion

## Notes

- The delete operation is permanent for the UI but can be restored from backup
- Message history is preserved in the database (soft delete)
- Other user is not notified when you delete them
- Deleting a chat doesn't block or notify the other user
- The implementation uses the existing Supabase infrastructure with no breaking changes
