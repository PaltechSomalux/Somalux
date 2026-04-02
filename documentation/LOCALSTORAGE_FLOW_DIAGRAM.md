# localStorage Persistence - Visual Flow Diagram

## Upload Flow with localStorage

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTO UPLOAD COMPONENT LOADS                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │ checkForIncomplete*() │ ← Checks localStorage on mount
                   └───────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         [Has saved state?]      [No saved state]
              │YES                    NO│
              │                        │
              ▼                        ▼
    Set canResume = true      Show file selector
              │                        │
              ▼                        ▼
    "Resume Previous"          "Select Folder"
    button appears    ◄─────────button only


┌─────────────────────────────────────────────────────────────────────┐
│                      USER SELECTS FILES & UPLOADS                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │   uploadFiles()      │
                    │   Loop starts        │
                    └──────────────────────┘
                              │
                ┌─────────────┴──────────────────┐
                │      FOR EACH FILE            │
                │    (i = 0 to selectedFiles)   │
                └───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐         ┌──────────┐         ┌──────────────┐
   │ PAUSED? │         │ UPLOAD   │         │ ABORT FLAG?  │
   └────┬────┘         │ FILE     │         └──────┬───────┘
   YES  │  NO          └────┬─────┘            YES │
        │                   ▼                      ▼
        ▼           Save Progress             Break Loop
   Wait 500ms       (saveUploadState)         Cleanup
        │           (every 500ms)             Exit
        │                   │
        ▼                   ▼
   Save State         ┌──────────┐
   to localStorage    │ Success? │
        │             └────┬──────┘
        │             YES  │  NO
        │                  ▼
        │          ┌──────────────┐
        │          │ Save Error   │
        │          │ Increment    │
        │          │ failed count │
        │          └──────┬───────┘
        │                 │
        └─────────┬───────┘
                  ▼
          Save Progress to
          localStorage
          - currentIndex
          - uploaded count
          - failed count
          - duplicates
          - fileNames[]
          - timestamp
                  │
                  ▼
          ┌──────────────────┐
          │ More files?      │
          └────┬─────────┬───┘
          YES  │         │ NO
               ▼         ▼
            LOOP    Complete Upload
               │         │
               │         ▼
               │    Clear localStorage
               │    (clearUploadState)
               │         │
               │         ▼
               │    Set uploading=false
               │         │
               └─────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    PAGE REFRESH DURING UPLOAD                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  Component unmounts (cleanup)
                              │
                              ▼
            New page load / navigation back
                              │
                              ▼
              Component remounts (useEffect runs)
                              │
                              ▼
                  checkForIncomplete*() runs
                              │
                              ▼
                   localStorage lookup
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         Found saved state         No saved state
              │                        │
              ▼                        ▼
    Set canResume = true      Normal UI shown
              │                (no resume button)
              ▼
    "Resume Previous" button
    appears in blue (#2196F3)
              │
              ▼
        User clicks button
              │
              ▼
    Read saved state from
    localStorage
              │
              ▼
    Restore:
    - uploadProgress
    - uploadedCount
    - failedCount
    - duplicatesCount
              │
              ▼
    Reset refs:
    - uploadAbortRef = false
    - pauseRef = false
              │
              ▼
    Set uploading = true
              │
              ▼
    Call uploadFiles()
              │
              ▼
    Upload loop RESUMES
    from saved index
              │
              ▼
    Continues with remaining files...


┌─────────────────────────────────────────────────────────────────────┐
│                    PAUSE/RESUME SAME SESSION                        │
└─────────────────────────────────────────────────────────────────────┘

User Upload     pauseRef     localStorage     UI Button
State          .current      Entry           Display
─────────────────────────────────────────────────────────

UPLOADING   →  false      →  saved     →   Pause button
                                         (yellow)
                            
User clicks      ↓
Pause button

PAUSED      →  true       →  saved     →   Resume button
                               every       (green)
                               500ms
                            
User clicks      ↓
Resume button

UPLOADING   →  false      →  saved     →   Pause button
                                         (continues upload)
                            
Upload done      ↓
                 ↓          cleared      →   No button
                           entry             (hidden)


┌─────────────────────────────────────────────────────────────────────┐
│                    MULTIPLE UPLOADS TRACKING                        │
└─────────────────────────────────────────────────────────────────────┘

localStorage
─────────────────────────────────────────────────────────

Key: "booksUploadState"
├─ fileNames: [...]
├─ currentIndex: 5
├─ total: 20
├─ uploaded: 6
├─ failed: 0
└─ timestamp: 169912...

Key: "pastPapersUploadState"
├─ fileNames: [...]
├─ currentIndex: 3
├─ total: 15
├─ uploaded: 4
├─ failed: 0
└─ timestamp: 169912...


Two separate entries allow:
- Books upload paused
- Past Papers upload paused
- BOTH can be resumed independently
- Each shows its own "Resume Previous" button


┌─────────────────────────────────────────────────────────────────────┐
│                    STATE CLEANUP SCENARIOS                          │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: UPLOAD COMPLETES
    Upload finishes (all files done)
         ↓
    clearUploadState() called
         ↓
    localStorage entry DELETED
         ↓
    canResume = false
         ↓
    "Resume Previous" button HIDDEN
         ↓
    Page refresh → button still hidden ✅

Scenario 2: USER CANCELS
    User clicks red "Cancel"
         ↓
    uploadAbortRef.current = true
         ↓
    Upload loop breaks
         ↓
    clearUploadState() called
         ↓
    localStorage entry DELETED
         ↓
    canResume = false
         ↓
    Page refresh → button hidden ✅

Scenario 3: USER PAUSES INDEFINITELY
    User pauses upload
         ↓
    pauseRef.current = true
         ↓
    State saved every 500ms
         ↓
    User never resumes
         ↓
    localStorage entry PERSISTS
         ↓
    Page refresh next week
         ↓
    "Resume Previous" button shows ✅
         ↓
    User can still resume old upload


═══════════════════════════════════════════════════════════════════════
                         KEY DECISION POINTS
═══════════════════════════════════════════════════════════════════════

1. WHY localStorage (not sessionStorage)?
   ✓ Survives browser close/reopen
   ✓ Survives page navigation away and back
   ✓ Persists until explicitly cleared

2. WHY separate keys (booksUploadState vs pastPapersUploadState)?
   ✓ Prevents overwriting between components
   ✓ Allows simultaneous uploads to be tracked
   ✓ Cleaner separation of concerns

3. WHY save fileNames (not File objects)?
   ✓ File objects cannot be serialized
   ✓ fileNames[] used only for reference/validation
   ✓ Actual file references kept in React state

4. WHY refs for pause/abort?
   ✓ Immediate state change without re-render
   ✓ Checked in tight loops every 500ms
   ✓ No race conditions with state updates

5. WHY multiple save points?
   ✓ Pause loop: progress saved while waiting
   ✓ Progress set: UI always matches storage
   ✓ After success: uploaded count persisted
   ✓ After failure: failed count persisted
   ✓ Ensures zero progress loss

═══════════════════════════════════════════════════════════════════════
