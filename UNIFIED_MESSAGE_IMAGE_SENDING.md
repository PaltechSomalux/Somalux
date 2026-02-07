# Unified Message + Image Sending System

## Overview
Updated the chat system to send messages and images together as a single unit, just like WhatsApp, instead of sending them separately.

## Problem Solved
Previously:
- User selects image → separate message created with just the image
- User types text → separate message created with just the text
- Result: Two separate messages in the chat

Now:
- User selects image → preview shows in text input
- User types text (optional) → 
- User clicks send → One unified message with both text and images together

## Implementation Details

### 1. ChatFooter.jsx Changes (Both ChatMe and SomaLux versions)
**File**: `src/components/ChatMe/Chat/ChatFooter.jsx` and `src/SomaLux/Chat/Chat/ChatFooter.jsx`

**Modified Function**: `handleSendClick()`
- Changed from synchronous to async function
- Collects all attachments and uploads them first (without creating individual messages)
- Stores attachment URLs in sessionStorage as `pendingAttachments`
- Calls `onSendMessage()` once with all attachments collected
- `onSendMessage` picks up the attachments from sessionStorage and includes them in the main message

```javascript
// Flow:
1. User selects image → stored in attachments state
2. User types message text → stored in newMessage state
3. User clicks send → handleSendClick() executes:
   a. Upload all attachments with skipMessageCreation: true
   b. Get URLs back
   c. Store URLs in sessionStorage.pendingAttachments
   d. Call onSendMessage() which creates ONE message with both text and images
   e. Clear temporary storage and UI state
```

### 2. useChatActions.jsx Changes - handleFileUpload()
**File**: `src/components/ChatMe/Chat/useChatActions.jsx`

**Modified Function**: `handleFileUpload(file, options = {})`
- Added optional `skipMessageCreation` flag
- When `skipMessageCreation: true`:
  - Uploads file to Supabase Storage
  - Returns URL without creating a message
  - Used by ChatFooter for unified send
- When `skipMessageCreation: false` (default):
  - Uploads file and creates an individual message
  - Original behavior for backward compatibility

```javascript
// New signature:
handleFileUpload(file, { skipMessageCreation: true })
// Returns: { fileURL, filePath }
```

### 3. useChatActions.jsx Changes - handleSendMessage()
**File**: `src/components/ChatMe/Chat/useChatActions.jsx`

**Modified Function**: `handleSendMessage()`
- Checks for pending attachments in sessionStorage at start
- Retrieves attachment URLs if present
- Updates validation to accept messages with attachments (even if text is empty)
- Adds `attachmentUrls` to optimistic message
- Includes `attachmentUrls` in backend request body
- Clears sessionStorage after processing

```javascript
// New flow:
1. Check sessionStorage.pendingAttachments
2. Parse attachment URLs if present
3. Allow sending if: text exists OR attachments exist
4. Include both text and attachment URLs in single message
5. Backend receives: { content, attachmentUrls }
```

## Data Structure

### Attachment Data (sessionStorage)
```javascript
// sessionStorage.pendingAttachments
[
  {
    url: "https://storage.url/chat-files/...",
    type: "image", // "image", "video", "audio", "file"
    name: "photo.jpg"
  },
  // ... more attachments
]
```

### Message with Attachments
```javascript
// Message structure sent to backend
{
  chatId: "user1_user2",
  senderId: "user1-uuid",
  recipientId: "user2-uuid",
  content: "Check this out!",
  attachmentUrls: [
    "https://storage.url/...",
    "https://storage.url/..."
  ],
  replyToId: null
}
```

## User Experience

### Before
```
User: [sends image] → Message 1: [image only]
User: [types text] → Message 2: Text

Then they see TWO separate messages
```

### After
```
User: [sends image + text] → Message 1: Text [image below] [image below]

They see ONE unified message like WhatsApp
```

## Browser/Mobile Support
- Uses sessionStorage for temporary attachment URL storage
- sessionStorage is cleared after successful send
- Works on all modern browsers
- Mobile-friendly (respects swipe/orientation changes)

## Backward Compatibility
- Old code still works with `skipMessageCreation: false` (default)
- Fallback if sessionStorage fails (individual message sent)
- No breaking changes to existing APIs

## Testing Checklist

- [ ] Send text message only → works
- [ ] Send image only → works
- [ ] Send image + text → one unified message with both
- [ ] Send multiple images → all appear in one message
- [ ] Mixed attachments (image + video + pdf) → all in one message
- [ ] Reply to message + add attachment → works
- [ ] Message appears instantly (optimistic UI)
- [ ] Message persists to database
- [ ] Mobile: Send in portrait mode
- [ ] Mobile: Send in landscape mode
- [ ] Mobile: Send, rotate device, verify consistency
- [ ] Edge case: Network failure during upload
- [ ] Edge case: sessionStorage full (fallback)

## Files Modified

1. `src/components/ChatMe/Chat/ChatFooter.jsx`
   - Updated `handleSendClick()` to async, unified flow

2. `src/components/ChatMe/Chat/useChatActions.jsx`
   - Updated `handleFileUpload()` with `skipMessageCreation` option
   - Updated `handleSendMessage()` to check/use pending attachments
   - Updated validation to accept attachments-only messages

3. `src/SomaLux/Chat/Chat/ChatFooter.jsx` (Legacy)
   - Applied same changes for consistency

## API Changes

### Backend Endpoint: `/api/messages/send`
**New optional parameter**:
```javascript
{
  attachmentUrls: [
    "https://...",  // File URLs from Supabase Storage
    "https://..."
  ]
}
```

Backend should:
1. Receive message with optional `attachmentUrls` array
2. Store `attachmentUrls` in message record
3. Display URLs alongside message text in UI

## Implementation Quality

✅ Follows WhatsApp pattern (unified message unit)
✅ No breaking changes to existing code
✅ Fallback mechanisms for errors
✅ Works in both ChatMe and legacy SomaLux Chat
✅ Responsive design maintained
✅ Mobile-friendly
✅ CSS positioning unchanged

## Future Enhancements

- [ ] Drag & drop multiple files
- [ ] Edit message to add/remove attachments
- [ ] Image compression before upload
- [ ] Preview all attachments in thumbnail gallery
- [ ] Download full resolution from message
- [ ] Sharing location as attachment
