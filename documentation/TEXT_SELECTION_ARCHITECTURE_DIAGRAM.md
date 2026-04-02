# Text Selection Feature - Visual Architecture & Flow

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                             │
│  (Select text via mouse/touch/keyboard)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BROWSER SELECTION API                               │
│  (window.getSelection(), Range.getBoundingClientRect())          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           EVENT LISTENERS (5 types attached to document)         │
│  • mouseup (desktop)                                             │
│  • selectionchange (keyboard)                                    │
│  • touchend (mobile)                                             │
│  • pointerup (hybrid)                                            │
│  • contextmenu (iOS long-press)                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              DEBOUNCING LAYER                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Desktop: 50ms delay (scheduleDetection)                    │ │
│  │ Mobile:  300ms delay (scheduleDetection with longer delay) │ │
│  │ Purpose: Stabilize detection, prevent jitter              │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          PROCESSING GUARD (Deduplication)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Check: isProcessingRef.current === true?                  │ │
│  │ ├─ YES → Return early (skip processing)                   │ │
│  │ └─ NO  → Set flag to true, proceed                        │ │
│  │                                                             │ │
│  │ Purpose: Prevent concurrent detectSelection() calls       │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           VALIDATION PIPELINE                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Selection exists? (rangeCount > 0)                      │ │
│  │    ├─ NO → Return null, clear state                       │ │
│  │    └─ YES → Continue                                      │ │
│  │                                                             │ │
│  │ 2. Has text content? (text.length >= 1)                   │ │
│  │    ├─ NO → Return null, clear state                       │ │
│  │    └─ YES → Continue                                      │ │
│  │                                                             │ │
│  │ 3. Valid bounding rect? (width > 0, height > 0)           │ │
│  │    ├─ NO → Return null, clear state                       │ │
│  │    └─ YES → Continue                                      │ │
│  │                                                             │ │
│  │ 4. Position calculation succeeds?                          │ │
│  │    ├─ NO → Return null, clear state                       │ │
│  │    └─ YES → Continue                                      │ │
│  │                                                             │ │
│  │ Purpose: Only valid selections proceed                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          THROTTLING LAYER (State Update)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Check: Time since last update < 100ms?                    │ │
│  │ ├─ YES → Skip state update (skip this cycle)              │ │
│  │ └─ NO  → Update state (new cycle allowed)                 │ │
│  │                                                             │ │
│  │ Purpose: Max 1 state update per 100ms                     │ │
│  │ Benefit: Reduces re-renders, smoother UI                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STATE UPDATE (React)                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ setSelection({                                             │ │
│  │   text: selected text string,                             │ │
│  │   range: Browser Range object,                            │ │
│  │   timestamp: Date.now()                                   │ │
│  │ })                                                         │ │
│  │                                                             │ │
│  │ setPosition({                                             │ │
│  │   x: horizontal position in px,                           │ │
│  │   y: vertical position in px                              │ │
│  │ })                                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          POSITION CALCULATION                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Get selection bounding rect                            │ │
│  │ 2. Calculate panel size (150px × 120px)                   │ │
│  │ 3. Position above text (with 10px gap)                    │ │
│  │ 4. Fallback: Position below if not enough space above    │ │
│  │ 5. Constrain to viewport (±15px padding)                  │ │
│  │ 6. Return final {x, y} position                           │ │
│  │                                                             │ │
│  │ Purpose: Always position panel within viewport            │ │
│  │ Never off-screen, centered on selection                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         REACT RENDERS TextSelectionPanel                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Conditional render:                                       │ │
│  │   {selection && position && (                             │ │
│  │     <TextSelectionPanel {...props} />                     │ │
│  │   )}                                                       │ │
│  │                                                             │ │
│  │ Animation: panelSlideIn (120ms)                           │ │
│  │   - Scale: 0.9 → 1.0                                      │ │
│  │   - Opacity: 0 → 1                                        │ │
│  │   - Timing: cubic-bezier(0.34, 1.56, 0.64, 1)           │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              UI PANEL DISPLAYED                                  │
│  ┌─────────────────────────────────────┐                        │
│  │  [📋 Copy]  [✏️ Highlight]  [✕]     │                        │
│  │      ▼                               │ 120px × 150px         │
│  │   (on text)                         │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  With arrow pointer pointing to selection                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            USER INTERACTS WITH PANEL                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Button Clicked:                                           │ │
│  │ ├─ Copy:      copyText() handler                         │ │
│  │ ├─ Highlight: addHighlight() handler                     │ │
│  │ └─ Close:     clearSelection() handler                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │          │
                    ▼          ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Copy Action    │  │  Close Action    │
        ├──────────────────┤  ├──────────────────┤
        │ Copy to Clipboard│  │ clearSelection() │
        │ Show Feedback    │  │ Remove Panel     │
        │ (1200ms)         │  │ Clear State      │
        │ Keep Panel Open  │  │                  │
        └──────────────────┘  └──────────────────┘
                    │          │
                    └────┬─────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   User Continues/Closes        │
        │   (Panel stays/goes away)      │
        └────────────────────────────────┘
```

---

## Component Relationship Diagram

```
SimpleScrollReader (PDF Viewer)
│
├─ useTextSelection() [Hook]
│  │
│  ├─ State:
│  │  ├─ selection: {text, range, timestamp}
│  │  └─ position: {x, y}
│  │
│  ├─ Refs (Stability):
│  │  ├─ isProcessingRef (deduplication)
│  │  ├─ lastSelectionTimeRef (throttling)
│  │  └─ selectionStableRef (validity tracking)
│  │
│  ├─ Event Listeners:
│  │  ├─ mouseup → handleMouseUp → scheduleDetection
│  │  ├─ selectionchange → handleSelectionChange → scheduleDetection
│  │  ├─ touchend → handleTouchEnd → scheduleDetection (300ms)
│  │  ├─ pointerup → handlePointerUp → scheduleDetection
│  │  └─ contextmenu → handleContextMenu → scheduleDetection
│  │
│  ├─ Functions:
│  │  ├─ detectSelection() [Core detection with validation]
│  │  ├─ calculatePosition() [Viewport-aware positioning]
│  │  └─ clearSelection() [Reset state]
│  │
│  └─ Returns:
│     ├─ selection
│     ├─ position
│     ├─ clearSelection
│     └─ selectedText
│
└─ TextSelectionPanel [Component]
   │
   ├─ Props:
   │  ├─ position: {x, y}
   │  ├─ selectedText: string
   │  ├─ onCopy: function
   │  ├─ onHighlight: function
   │  └─ onClose: function
   │
   ├─ State:
   │  ├─ showColorPicker: boolean
   │  ├─ copiedFeedback: boolean
   │  └─ adjustedPos: {x, y}
   │
   ├─ Refs:
   │  ├─ panelRef (DOM ref)
   │  ├─ feedbackTimeoutRef (feedback timing)
   │
   ├─ Effects:
   │  ├─ Position adjustment (RAF-based)
   │  └─ Click-outside detection
   │
   ├─ Handlers:
   │  ├─ handleCopyClick() → onCopy() → copyText()
   │  ├─ handleHighlightColor() → onHighlight() → addHighlight()
   │  └─ handleClosePanel() → onClose() → clearSelection()
   │
   └─ UI Elements:
      ├─ Copy Button (FiCopy icon)
      ├─ Highlight Button (FiPenTool icon)
      ├─ Color Picker (5 colors)
      ├─ Close Button (FiX icon)
      ├─ Feedback Animation (✓ Copied!)
      ├─ Panel Arrow Pointer
      └─ Click Overlay (for outside click detection)
```

---

## State Flow Diagram

```
NO SELECTION
    │
    ├─ User selects text
    │
    ▼
SELECTION DETECTED
    │
    ├─ Event fired (mouseup, selectionchange, etc.)
    ├─ Debounce delay (50ms or 300ms)
    │
    ▼
VALIDATION PIPELINE
    │
    ├─ Has selection? ✓
    ├─ Has text? ✓
    ├─ Valid rect? ✓
    ├─ Position ok? ✓
    │
    ├─ Processing guard check ✓
    ├─ Throttle check (100ms) ✓
    │
    ▼
STATE UPDATED
    │
    ├─ setSelection({...})
    ├─ setPosition({x, y})
    │
    ▼
PANEL RENDERED
    │
    ├─ Animate entrance (120ms)
    ├─ Position adjusted (RAF)
    │
    ▼
PANEL VISIBLE
    │
    ├─ Waiting for user action
    ├─ Stays open
    │
    ├─ User clicks Copy
    │  ├─ Copy to clipboard
    │  ├─ Show feedback (1200ms)
    │  └─ Keep panel open
    │
    ├─ User clicks Highlight
    │  ├─ Show color picker
    │  ├─ User selects color
    │  └─ Keep panel open
    │
    ├─ User clicks Close
    │  └─ Go to: CLEAR
    │
    └─ User clicks outside
       └─ Go to: CLEAR
    
CLEAR
    │
    ├─ setSelection(null)
    ├─ setPosition(null)
    ├─ Clear refs
    │
    ▼
NO SELECTION
    │
    └─ Cycle repeats on new selection
```

---

## Stability Layers Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                              │
        ▼                              ▼
    DESKTOP                        MOBILE
   (50ms delay)                 (300ms delay)
        │                              │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 1: DEBOUNCING        │
        │  (Stabilize timing)         │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 2: GUARD FLAG        │
        │  (Prevent duplicates)       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 3: VALIDATION        │
        │  (Reject invalid)           │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 4: THROTTLING        │
        │  (100ms min between updates)│
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 5: STATE MANAGEMENT  │
        │  (React updates)            │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 6: RENDERING         │
        │  (Smooth animation)         │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 7: INTERACTION       │
        │  (User actions)             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  LAYER 8: CLEANUP           │
        │  (Proper teardown)          │
        └──────────────────────────────┘

Each layer prevents specific issues:
═════════════════════════════════════
1. Debouncing    → Jitter from rapid events
2. Guard Flag    → Race conditions
3. Validation    → Invalid state
4. Throttling    → Excessive re-renders
5. State Mgmt    → Proper updates
6. Animation     → Smooth transitions
7. Interaction   → User control
8. Cleanup       → Memory leaks
```

---

## Event Flow During Selection

```
User selects text
│
├─ Browser fires: mouseup (capture phase)
│  └─ Attached to: document (guaranteed catch)
│
├─ Browser fires: selectionchange
│  └─ Attached to: document (guaranteed catch)
│
├─ Browser fires: pointerup (capture phase)
│  └─ Attached to: document (guaranteed catch)
│
│  All events trigger scheduleDetection():
│  ┌─ Clear previous timeout
│  ├─ Wait 50ms (desktop) or 300ms (mobile)
│  └─ Call detectSelection()
│
├─ detectSelection() runs:
│  ├─ Check: isProcessingRef → if true, exit
│  ├─ Set: isProcessingRef = true
│  │
│  ├─ Validate: sel, text, rect, position
│  │
│  ├─ Check: Throttle (100ms since last update?)
│  │
│  ├─ Update: setSelection() + setPosition()
│  │
│  └─ Set: isProcessingRef = false
│
└─ React renders: <TextSelectionPanel />
   └─ Shows animated panel with buttons

User interacts:
├─ Click Copy → copyText() → navigator.clipboard.writeText()
├─ Click Highlight → Color picker appears
├─ Click Close → clearSelection()
└─ Click Outside → clearSelection()
```

---

## Summary

This architecture ensures:
- ✅ **Stability**: Multiple protective layers
- ✅ **Reliability**: Comprehensive error handling
- ✅ **Effectiveness**: Smooth, responsive UI
- ✅ **Performance**: Optimal resource usage
- ✅ **Accessibility**: Keyboard and voice control compatible

Each component has a clear responsibility and proper error handling! 🎉
