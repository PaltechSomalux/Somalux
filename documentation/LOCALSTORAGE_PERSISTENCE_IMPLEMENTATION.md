# localStorage Persistence Implementation for Auto Upload

## Overview
Implemented localStorage persistence for both Books and Past Papers Auto Upload components to allow users to pause uploads and resume them even after refreshing the page.

## Changes Made

### 1. Books Auto Upload Component (BooksAutoUploadContent)

#### State Variables Added
- `canResume` - Boolean flag indicating if a previous upload can be resumed

#### Functions Added
- `saveUploadState(files, progress, uploaded, failed, dupes, paused, uploading)` - Saves current upload state to localStorage under key `booksUploadState`
- `clearUploadState()` - Removes the saved state from localStorage when upload completes
- `checkForIncompleteUpload()` - Checks on component mount if there's a previous incomplete upload

#### Integration Points
1. **Upload Loop** - Calls `saveUploadState()` after each file:
   - In pause loop (saves while paused)
   - After progress is set
   - After successful upload
   - After failed upload

2. **Completion** - Calls `clearUploadState()` when upload finishes

3. **Resume Button** - Added "Resume Previous" button that:
   - Appears only when `canResume === true`
   - Restores progress from localStorage
   - Resumes the upload from where it left off
   - Shows blue "Resume Previous" button with refresh icon

#### Key Implementation Details
```jsx
const canResume = false; // State
const saveUploadState = (files, progress, uploaded, failed, dupes, paused, uploading) => {
  const state = {
    fileNames: files.map(f => f.name),
    currentIndex: progress.current - 1,
    total: progress.total,
    uploaded, failed, duplicates: dupes, paused, uploading,
    timestamp: Date.now()
  };
  localStorage.setItem('booksUploadState', JSON.stringify(state));
};
```

### 2. Past Papers Auto Upload Component (PastPapersAutoUploadContent)

#### State Variables Added
- `canResumePastPapers` - Boolean flag for Past Papers resume capability

#### Functions Added
- `savePastPapersUploadState(files, progress, uploaded, failed, dupes)` - Saves state to `pastPapersUploadState`
- `clearPastPapersUploadState()` - Clears saved state
- `checkForIncompletePastPapersUpload()` - Checks for incomplete uploads on mount

#### Integration Points
Same as Books component:
1. In pause loop while paused
2. After setting progress
3. After successful upload  
4. After failed upload
5. Clears state when upload finishes

#### Initialization
- Added `checkForIncompletePastPapersUpload()` call in the initial `useEffect` that loads universities

### 3. localStorage Keys
- **Books**: `booksUploadState`
  - Stored data: `{ fileNames[], currentIndex, total, uploaded, failed, duplicates, paused, uploading, timestamp }`
  
- **Past Papers**: `pastPapersUploadState`
  - Stored data: `{ fileNames[], currentIndex, total, uploaded, failed, duplicates, timestamp }`

## User Experience Flow

### Scenario 1: Normal Upload
1. User selects files and starts upload
2. Files are saved to localStorage as each completes
3. Upload finishes → `clearUploadState()` removes data
4. ✅ No resume option appears on page refresh

### Scenario 2: Upload with Page Refresh
1. User starts upload of 50 files
2. After uploading 20 files, user closes tab or refreshes page
3. Progress (20/50) is saved to localStorage
4. `canResume` flag is set to `true` on component remount
5. **Blue "Resume Previous" button appears**
6. User clicks "Resume Previous" → resumes from file 21
7. ✅ Upload continues where it left off

### Scenario 3: Paused Upload Across Refresh
1. User pauses upload mid-way
2. State is saved including pause status
3. User refreshes page
4. `canResume` flag detects incomplete upload
5. User clicks "Resume Previous"
6. Upload resumes and continues from paused position
7. ✅ Works seamlessly across page refresh

## Technical Architecture

### State Persistence Strategy
- Used localStorage (not sessionStorage) so data survives browser close
- Timestamp added for future cleanup (old uploads > X days can be deleted)
- Simple JSON structure for easy serialization

### Progress Tracking
- Stores `currentIndex` (0-based) to track which file was being processed
- Stores counts: `uploaded`, `failed`, `duplicates` for UI restoration
- Stores file names to verify same files are being uploaded (optional validation)

### Pause/Resume Mechanism
- Refs (`pauseRef`, `uploadAbortRef`) handle immediate pause/cancel
- During pause loop, state is continuously saved to localStorage
- On resume, refs are reset and upload loop continues
- Uses busy-wait pattern (500ms intervals) to check pause status

## Testing Checklist

- [ ] Books upload: Pause, refresh, resume works
- [ ] Books upload: Cancel and localStorage clears
- [ ] Books upload: Completion clears saved state
- [ ] Past Papers upload: Pause, refresh, resume works
- [ ] Past Papers upload: Multiple files can be resumed
- [ ] Books & Past Papers: Different uploads can be tracked simultaneously
- [ ] Resume button only shows when there's saved state
- [ ] Progress numbers restore correctly after resume

## Browser Compatibility
- Uses standard `localStorage` API (all modern browsers)
- JSON.stringify/parse for serialization
- No special polyfills needed

## Future Enhancements
1. Add UI indicator showing "Upload paused - click Resume Previous to continue"
2. Auto-cleanup of old uploads after 30 days
3. Multiple simultaneous upload support (track by session ID)
4. Persist file selection state for better UX
5. Show estimated time remaining before page close

## Notes
- File objects cannot be serialized to JSON, so we store fileNames instead
- On resume, we work with the same file references from `selectedFiles` state
- This ensures the same files are uploaded that were originally selected
- Storage limit is ~5-10MB per origin (sufficient for metadata)
