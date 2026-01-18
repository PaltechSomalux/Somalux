# Auto Download Folder Selection - Visual Guide

## 📊 Feature Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER CLICKS DOWNLOAD                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Is Folder   │
                    │ Selected?   │
                    └──┬──────┬───┘
                       │      │
                    NO │      │ YES
                       │      │
        ┌──────────────┘      └──────────────┐
        │                                     │
   ┌────▼─────┐                        ┌─────▼────┐
   │  Show    │                        │  Use     │
   │ Folder   │                        │ Selected │
   │ Modal    │                        │ Folder   │
   └────┬─────┘                        └─────┬────┘
        │                                     │
        │  ┌──────────────────────────┐      │
        │  │ SELECT/CREATE FOLDER     │      │
        │  └──────────────────────────┘      │
        │          │                         │
        │          ├─ Select: Downloads      │
        │          ├─ Select: Books          │
        │          ├─ Select: Past Papers    │
        │          └─ Create: My Folder      │
        │                                     │
        │  ┌──────────────────────────┐      │
        │  │ SAVE FOLDER SELECTION    │      │
        │  └──────────────────────────┘      │
        │          │                         │
        │          ├─ Save to localStorage   │
        │          └─ Save to backend DB     │
        │                                     │
        └─────────────┬──────────────────────┘
                      │
              ┌───────▼────────┐
              │ DOWNLOAD FILES │
              │ TO FOLDER      │
              └───────┬────────┘
                      │
          ┌───────────▼───────────┐
          │  FILES SAVED WITH:    │
          │ Folder/Filename.ext   │
          └───────────────────────┘
```

## 🎨 UI Layout Changes

### Before (Original)
```
┌─────────────────────────────────────────────────┐
│ 📥 Auto Download PDFs                           │
├─────────────────────────────────────────────────┤
│ DSpace URL:                                     │
│ [________________________] [PASTE] [START]     │
│                                                 │
│ Example: https://pastpapers.ku.ac.ke/...       │
└─────────────────────────────────────────────────┘
```

### After (Enhanced)
```
┌──────────────────────────────────────────────────────────────┐
│ 📥 Auto Download PDFs                                        │
├──────────────────────────────────────────────────────────────┤
│ DSpace URL:                                                  │
│ [________________________] [PASTE] [FOLDER] [START]          │
│                                                              │
│ 📁 Download Folder: Past Papers                             │
│                                                              │
│ Example: https://pastpapers.ku.ac.ke/...                    │
└──────────────────────────────────────────────────────────────┘
```

## 🪟 Folder Selection Modal

```
┌─────────────────────────────────────────────────┐
│ 📁 Select Download Folder                  [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Current Folder:                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 📁 Past Papers                           │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ Available Folders:                              │
│ ┌─────────────────────────────────────────┐    │
│ │ ○ 📁 Downloads                           │    │
│ │ ● 📁 Past Papers            [Selected]   │    │
│ │ ○ 📁 Books                               │    │
│ │ ○ 📁 Documents                           │    │
│ │ ○ 📁 Research                            │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ + Create New Folder                      │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Cancel]      [✓ Confirm]          │
└─────────────────────────────────────────────────┘
```

## 📝 Create Folder Dialog

```
┌─────────────────────────────────────────────────┐
│ 📁 Select Download Folder                  [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Current Folder: Downloads                       │
│                                                 │
│ Available Folders:                              │
│ [Folder list...]                                │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ [Folder name input] [Create] [Cancel]   │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│              [Cancel]      [✓ Confirm]          │
└─────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
Frontend Components          Utilities            Backend API
────────────────────         ────────            ────────────

PastPapersAutoDownload
        │
        ├─ Show Folder Button
        │
        └─ Click → FolderSelectModal
                      │
                      ├─ getSelectedFolder()
                      │       ↓
                      │   [localStorage]
                      │
                      ├─ fetchAvailableFolders()
                      │       ↓
                      │   [GET /api/elib/download-folders]
                      │       ↑
                      │   Backend returns default + user folders
                      │
                      ├─ createDownloadFolder()
                      │       ↓
                      │   [POST /api/elib/download-folders]
                      │       ↑
                      │   Backend creates and returns path
                      │
                      └─ setSelectedFolder()
                              ↓
                         [localStorage + Backend]

Download Handler
        │
        ├─ Get selectedFolder from state
        │
        ├─ Add to filename: folder/filename.ext
        │
        └─ Browser saves to folder
```

## 🎯 User Journey Map

### Journey 1: Download Book with Folder

```
Step 1: Open Book Page
        ↓
Step 2: Click Download Button
        ↓
Step 3: FolderSelectModal Opens
        ├─ Shows current: "Downloads"
        └─ Shows available folders
        ↓
Step 4: Select "Books" Folder
        ├─ Highlight selected
        └─ "Confirm" button enabled
        ↓
Step 5: Click Confirm
        ├─ Modal closes
        ├─ Save to localStorage
        └─ Save to backend
        ↓
Step 6: Download Starts
        ├─ File path: Books/book-title.pdf
        └─ Saved to Books folder
        ↓
Step 7: Success
        └─ ✓ File in Books folder
```

### Journey 2: Create and Use New Folder

```
Step 1: Click Folder Button
        ↓
Step 2: Modal Opens
        ├─ Current: "Downloads"
        └─ Folders listed
        ↓
Step 3: Click "Create New Folder"
        ├─ Input field appears
        └─ Ready for folder name
        ↓
Step 4: Type "Research Papers"
        ↓
Step 5: Click "Create"
        ├─ Validated on backend
        ├─ "Research Papers" created
        └─ Auto-selected
        ↓
Step 6: Click "Confirm"
        ├─ Modal closes
        └─ Selection saved
        ↓
Step 7: Download to New Folder
        ├─ File: Research Papers/paper-title.pdf
        └─ ✓ Saved successfully
```

### Journey 3: Resume with Remembered Folder

```
Day 1:
  Step 1: Select "Past Papers" folder
          ↓
  Step 2: Download 5 files
          ├─ localStorage: selectedDownloadFolder = "Past Papers"
          └─ All files in Past Papers folder

Day 2 (Next Session):
  Step 1: User opens app
  Step 2: Clicks Download
          ├─ System loads from localStorage
          └─ Shows "Past Papers" selected
  Step 3: Download starts
          └─ ✓ Same folder remembered!
```

## 📱 Mobile Layout

```
┌─────────────────────────┐
│ Auto Download PDFs      │
├─────────────────────────┤
│                         │
│ DSpace URL:             │
│ [URL input]             │
│                         │
│ [PASTE] [FOLDER] [►]   │
│                         │
│ 📁 Download: Past...   │
│                         │
│ [Example link]          │
└─────────────────────────┘

Modal on Mobile:
┌─────────────────────┐
│ 📁 Select Folder [✕]│
├─────────────────────┤
│                     │
│ Current: Past...   │
│                     │
│ [Folder list]       │
│ (scrollable)        │
│                     │
│ [Create...]         │
│                     │
├─────────────────────┤
│ [CANCEL] [✓ DONE]   │
└─────────────────────┘
```

## 🔗 Integration Points

```
Existing Download System
        ↓
    ┌───────────────────┐
    │ PastPapersAutoDownload
    │ Download.jsx
    └───────┬───────────┘
            │
            ├─ Adds: Folder Selection Button
            ├─ Adds: Folder Display
            └─ Modifies: Download Filename
            
                    ↓
            ┌───────────────────┐
            │ FolderSelectModal  │
            │ (NEW COMPONENT)    │
            └───────┬───────────┘
                    │
                    ├─ Modal UI
                    ├─ Folder list
                    └─ Create folder
                    
                    ↓
            ┌───────────────────┐
            │ downloadFolderMgr  │
            │ (NEW UTILITY)      │
            └───────┬───────────┘
                    │
                    ├─ localStorage
                    ├─ API calls
                    └─ Path utilities
                    
                    ↓
            ┌───────────────────┐
            │ Backend API        │
            │ (5 NEW ENDPOINTS)  │
            └───────────────────┘
```

## ✨ Feature Interaction Matrix

| Interaction | Result |
|-------------|--------|
| **Click Folder Button** | Modal opens with folder list |
| **Select Folder** | Folder highlighted, Confirm enabled |
| **Click Create Folder** | Input field appears |
| **Type Folder Name** | Name entered, Create button enabled |
| **Click Create** | Folder created, auto-selected |
| **Click Confirm** | Selection saved, modal closes |
| **Download File** | File saved to selected folder |
| **Close Browser** | Folder selection persists |
| **Switch Folders** | Selection updates, next download uses new folder |
| **Create Duplicate Name** | Error message shown, can retry |

## 📊 State Diagram

```
              ┌─────────────────┐
              │   INITIAL       │
              │ No folder set   │
              └────────┬────────┘
                       │
                ┌──────▼──────┐
         YES───┤ Use default? │
                └──────┬──────┘
                       │ NO
                       │
            ┌──────────▼──────────┐
            │ FOLDER_MODAL_OPEN   │
            │ User selecting...   │
            └──────────┬──────────┘
                       │
           ┌───────────┼───────────┐
           │ SELECT│CREATE    │CANCEL
           │       │          │
      ┌────▼──┐  ┌─▼──┐  ┌───▼──┐
      │SELECT │  │ NEW│  │CLOSED│
      │ED     │  │FOL │  │(no   │
      │FOLDER │  │DER │  │change)
      └────┬──┘  └─┬──┘  └───┬──┘
           │      │         │
           │      └──┬───┬──┘
           │         │   │
           └─────┬───┘   │
                 │       │
            ┌────▼───────▼─┐
            │ FOLDER_SAVED │
            │ Ready to     │
            │ download     │
            └────┬─────────┘
                 │
             ┌───▼────┐
             │DOWNLOAD│
             │ with   │
             │ folder │
             └────────┘
```

## 🎓 Learning Path

```
1. Understand the Feature
   └─ Read: AUTO_DOWNLOAD_FOLDER_SELECTION_QUICKREF.md

2. Explore Components
   └─ FolderSelectModal.jsx
   └─ downloadFolderManager.js

3. Review Integration
   └─ PastPapersAutoDownload.jsx
   └─ Download.jsx

4. Check API
   └─ backend/index.js
   └─ Folder endpoints

5. Test
   └─ Book download with folder
   └─ Auto-download with folder
   └─ Folder persistence

6. Deploy
   └─ Push to production
   └─ Monitor for errors
```

---

**Visual Guide Created:** January 18, 2026  
**Feature Status:** ✅ Complete and Ready
