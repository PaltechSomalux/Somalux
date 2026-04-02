# Comments Section Fix - Accuracy & Delete Permissions

## Issues Fixed

### 1. **Delete Permission Logic**
**Problem**: The delete button was comparing `comment.user` (display name) with `currentUser` (email address), causing permission checks to always fail for the comment author.

**Solution**: 
- Added `userId` field to all comment objects containing the actual user ID
- Changed delete button disable logic from `comment.user !== currentUser` to `!comment.userId || comment.userId !== currentUser?.id`
- Added helpful tooltips to delete, edit, and pin buttons explaining permission requirements

**Files Updated**:
- `src/SomaLux/Books/CommentsSection.jsx`
- `src/SomaLux/PastPapers/CommentsSection.jsx`

### 2. **Comment Data Accuracy**
**Problem**: New comments being created had no `userId` field, and fetched comments weren't including `userId`.

**Solution**:
- Updated `handleSubmitComment` in `BookPanel.jsx` to include `userId: user.id` when adding optimistically created comments
- Updated `handleSubmitComment` in `Pastpapers.jsx` to include `userId: user.id` when adding optimistically created comments
- Updated comment loading to include `userId: comment.user_id` when mapping fetched comments from database

**Files Updated**:
- `src/SomaLux/Books/BookPanel.jsx` (lines ~2410 and ~1396)
- `src/SomaLux/PastPapers/Pastpapers.jsx` (lines ~1109 and ~1017)

### 3. **Current User Reference Fix**
**Problem**: `currentUser` was being passed as an email string, but delete button comparisons needed the full user object to access `user.id`.

**Solution**:
- Changed `currentUser={user?.email || 'Anonymous'}` to `currentUser={user}` in both BookPanel and Pastpapers
- Updated CommentsSection components to safely access `currentUser?.id`

**Files Updated**:
- `src/SomaLux/Books/BookPanel.jsx` (line 3614)
- `src/SomaLux/PastPapers/Pastpapers.jsx` (line 2134)

### 4. **Comment Text Accuracy**
**Problem**: Comments could display with extra whitespace or empty values.

**Solution**:
- Updated comment text display to trim whitespace and show "(Empty comment)" placeholder for invalid comments
- Comment text validation happens at submission (non-empty requirement enforced)

**Files Updated**:
- `src/SomaLux/Books/CommentsSection.jsx`
- `src/SomaLux/PastPapers/CommentsSection.jsx`

### 5. **PropTypes Updated**
**Change**: Added optional `userId` field to comment PropTypes for proper type checking.

**Files Updated**:
- `src/SomaLux/Books/CommentsSection.jsx`
- `src/SomaLux/PastPapers/CommentsSection.jsx`

## Backend Validation
The Supabase RLS (Row Level Security) policies already enforce ownership validation:
- Users can only delete their own comments (`eq('user_id', user.id)`)
- Admins can manage all comments
- These policies ensure backend protection even if frontend is compromised

## Testing Recommendations

1. **Test Delete Permission**:
   - Create a comment with your account
   - Verify delete button is enabled
   - Delete button tooltip shows correct message
   - Successfully delete the comment

2. **Test Other User's Comments**:
   - View another user's comment
   - Verify delete/edit/pin buttons are disabled
   - Verify tooltip shows "You can only delete your own comments"

3. **Test Comment Accuracy**:
   - Create comments with various content
   - Verify text displays correctly with trimmed whitespace
   - Verify empty comments show placeholder text

4. **Test Both Sections**:
   - Repeat tests in both Books and Past Papers sections
   - Verify behavior is consistent

## Files Modified
- `src/SomaLux/Books/BookPanel.jsx`
- `src/SomaLux/Books/CommentsSection.jsx`
- `src/SomaLux/PastPapers/Pastpapers.jsx`
- `src/SomaLux/PastPapers/CommentsSection.jsx`

## Related Documentation
- COMPLETE_BOOK_COMMENTS_SETUP.sql - Database schema and RLS policies
- PAST_PAPERS_COMMENTS_FIX.md - Past papers comments implementation
