# PastPapersDownloader - Visual Architecture & System Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOMALUX APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     FRONTEND - REACT COMPONENT                       │  │
│  │                  PastPapersDownloader.jsx                            │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │  │
│  │  │  School Grid    │  │  Progress Card  │  │ Download History│     │  │
│  │  │  Selection      │  │  Real-time UI   │  │ List & Resume   │     │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │  │
│  │                                                                       │  │
│  │  [States] → schools, selectedSchool, currentProcess, processes      │  │
│  │  [Polling] → GET status every 2 seconds                             │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│              ↓ (HTTP - JSON)  ↑ (HTTP - JSON)                              │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
        ┌──────▼────────┐
        │  EXPRESS.JS   │
        │  API ROUTES   │
        └──────┬────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │  /api/elib/pastpapers/schools                               │
        │  /api/elib/pastpapers/school/:id/papers                    │
        │  /api/elib/pastpapers/paper/:id                            │
        │  /api/elib/pastpapers/bulk-download                        │
        │  /api/elib/pastpapers/download/status/:id                  │
        │  /api/elib/pastpapers/download/pause/:id                   │
        │  /api/elib/pastpapers/download/resume/:id                  │
        │  /api/elib/pastpapers/download/stop/:id                    │
        └──────┬──────────────────────────────────────────────────────┘
               │
        ┌──────▼─────────────────────────────────────────────────────┐
        │     SERVICE LAYER                                           │
        │  pastPapersDownloaderService.js                            │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  getSchools()                                │          │
        │  │  ↓ Parse DSpace homepage                    │          │
        │  │  ↓ Extract 18 schools with counts           │          │
        │  │  ↓ Return schools array                     │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  getSchoolPapers(schoolId, page)            │          │
        │  │  ↓ Fetch school page                        │          │
        │  │  ↓ Parse papers (20 per page)               │          │
        │  │  ↓ Extract: id, title, code                 │          │
        │  │  ↓ Return papers + hasNextPage flag         │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  getPaperDetails(paperId)                   │          │
        │  │  ↓ Fetch paper page                         │          │
        │  │  ↓ Extract metadata (title, date)           │          │
        │  │  ↓ Extract download links                   │          │
        │  │  ↓ Return details with URLs                 │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  startBulkDownload(config)                  │          │
        │  │  ↓ Create process object                    │          │
        │  │  ↓ Store in activeDownloads Map             │          │
        │  │  ↓ Start async _executeBulkDownload()       │          │
        │  │  ↓ Return process immediately               │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  _executeBulkDownload(process, config)      │          │
        │  │  ↓ Pagination loop through school papers    │          │
        │  │  ├─ Get papers (20 per page)                │          │
        │  │  ├─ For each paper:                         │          │
        │  │  │  ├─ Get paper details + download link    │          │
        │  │  │  ├─ Download file to disk                │          │
        │  │  │  ├─ Update stats                         │          │
        │  │  │  └─ Delay 500ms (respect server)         │          │
        │  │  └─ Mark complete when done                 │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  ┌──────────────────────────────────────────────┐          │
        │  │  pause/resume/stop operations                │          │
        │  │  ↓ Update process.status                    │          │
        │  │  ↓ Return success/failure                   │          │
        │  └──────────────────────────────────────────────┘          │
        │                                                             │
        │  In-Memory Storage:                                         │
        │  activeDownloads = Map {                                    │
        │    processId → {                                            │
        │      status, stats, papers, errors, startTime...          │
        │    }                                                         │
        │  }                                                           │
        └──────┬─────────────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │  WEB SCRAPER                                                 │
        │  Using: Axios + Cheerio                                      │
        │                                                              │
        │  ┌────────────────────────────────────────────┐             │
        │  │ axios.get(DSPACE_URL) → HTTP Request       │             │
        │  │ cheerio.load(html) → Parse HTML            │             │
        │  │ $('selectors').text() → Extract data       │             │
        │  │ Return structured data                     │             │
        │  └────────────────────────────────────────────┘             │
        │                                                              │
        │  Selectors parsed:                                           │
        │  - a[href*="/handle/"] → Links to schools/papers            │
        │  - .artifact → Individual paper entries                      │
        │  - .metadata-fields → Paper metadata                        │
        │  - a[href*="/bitstream/"] → Download links                  │
        └──────┬──────────────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │                                                              │
        │     ↓ HTTPS Network  ↓ File Streaming                       │
        │                                                              │
        └──────┬──────────────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │    DSPACE REPOSITORY (External)                             │
        │    https://pastpapers.ku.ac.ke                              │
        │                                                              │
        │    18 Schools / Communities                                  │
        │    6,168+ Past Papers                                        │
        │    PDF Files to Download                                     │
        └──────┬──────────────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │                                                              │
        │    ↓ Downloaded Files                                        │
        │                                                              │
        └──────┬──────────────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────────────────────┐
        │  FILE STORAGE                                                │
        │  storage/pastpapers/{processId}/                            │
        │                                                              │
        │  ├─ paper1.pdf                                              │
        │  ├─ paper2.pdf                                              │
        │  ├─ paper3.pdf                                              │
        │  ├─ ...                                                      │
        │  └─ paperN.pdf                                              │
        │                                                              │
        └──────────────────────────────────────────────────────────────┘
```

## Request-Response Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│  USER CLICKS "START DOWNLOAD"                                             │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────────────┐
│  React Component: handleStartDownload()                                   │
│  - Prepares: { schoolId, schoolName, userId }                            │
│  - POSTs to API                                                            │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
         POST /api/elib/pastpapers/bulk-download
         Body: { schoolId, schoolName, userId }
                              ↓
┌───────────────────────────────────────────────────────────────────────────┐
│  Backend Route Handler                                                    │
│  - Validates input                                                        │
│  - Calls service.startBulkDownload(config)                              │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────────────┐
│  Service: startBulkDownload()                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 1. Create process object                                            │ │
│  │ 2. Generate UUID processId                                          │ │
│  │ 3. Initialize stats: { total:0, processed:0, ... }                 │ │
│  │ 4. Store in activeDownloads Map                                     │ │
│  │ 5. Start async _executeBulkDownload()                               │ │
│  │ 6. IMMEDIATELY return process object                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
              Response: { ok: true, process: {...} }
                              ↓
┌───────────────────────────────────────────────────────────────────────────┐
│  React Component: setCurrentProcess(process)                             │
│  - Render progress card                                                   │
│  - Start polling status                                                   │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
              ┌─────── Every 2 Seconds ──────┐
              ↓                               ↓
    GET /api/elib/pastpapers/          Render updated stats
    download/status/{processId}        Progress bar moves
                                       Numbers update
              ↓
    Return current process state
    (stats, papers downloaded, errors)


┌───────────────────────────────────────────────────────────────────────────┐
│  MEANWHILE: Backend Service (Async)                                       │
│  _executeBulkDownload() running in background                            │
│                                                                            │
│  For page = 1 to N:                                                       │
│  ├─ Fetch papers from school (20 per page)                              │
│  │  getSchoolPapers(schoolId, page)                                      │
│  │  ↓ axios.get(dspace_url)                                             │
│  │  ↓ cheerio.load(html)                                                │
│  │  ↓ Parse papers array                                                │
│  │                                                                       │
│  ├─ For each paper in papers array:                                     │
│  │  ├─ Get paper details                                                │
│  │  │  getPaperDetails(paperId)                                         │
│  │  │  ↓ axios.get(paper_url)                                           │
│  │  │  ↓ Extract download link                                          │
│  │  │                                                                   │
│  │  ├─ Download file                                                    │
│  │  │  _downloadFile(downloadUrl, filename, destDir)                   │
│  │  │  ↓ axios.get(url, { responseType: 'stream' })                   │
│  │  │  ↓ pipe to fs.createWriteStream()                                │
│  │  │  ↓ Save to: storage/pastpapers/{processId}/{filename}           │
│  │  │                                                                   │
│  │  ├─ Update process stats                                             │
│  │  │  stats.processed++                                                │
│  │  │  stats.successful++                                               │
│  │  │  papers array updated                                             │
│  │  │                                                                   │
│  │  ├─ Wait 500ms (respect server)                                      │
│  │  │  await _delay(500)                                                │
│  │  │                                                                   │
│  │  └─ Continue if status === 'running'                                │
│  │     else break (if paused/stopped)                                   │
│  │                                                                       │
│  └─ Check hasNextPage, continue or finish                              │
│                                                                          │
│  Mark complete: process.status = 'completed'                            │
└───────────────────────────────────────────────────────────────────────────┘
                              ↓
              Process polling detects completion
                              ↓
              Refresh download history
                              ↓
          Stop polling & show "Download Complete"
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPONENT STATE                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  schools: []                    ← All 18 schools loaded          │
│  selectedSchool: null           ← User selects one               │
│  currentProcess: null           ← Active download                │
│  processes: []                  ← History of all downloads       │
│  loading: false                 ← Fetch progress                 │
│  error: null                    ← Error messages                 │
│  showStopConfirm: false         ← Modal visibility               │
│  showResumeConfirm: false       ← Modal visibility               │
│  toast: null                    ← Toast notification             │
│  historyPage: 1                 ← Pagination state               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  PROCESS OBJECT STRUCTURE                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  {                                                                │
│    id: "UUID-processId",                                          │
│    schoolId: "4384",             ← School handle                 │
│    schoolName: "School of...",   ← School name                   │
│    status: "running",            ← running/paused/stopped/       │
│                                    completed/failed               │
│    startTime: "2026-01-18...",   ← ISO timestamp                 │
│    endTime: null,                ← Filled when done              │
│    stats: {                                                       │
│      total: 100,                 ← Total papers in school        │
│      processed: 45,              ← Papers processed so far       │
│      successful: 42,             ← Papers downloaded             │
│      failed: 2,                  ← Download errors               │
│      skipped: 1                  ← No download link available    │
│    },                                                             │
│    papers: [                     ← Array of downloaded papers    │
│      {                                                            │
│        id: "11165",                                               │
│        title: "Economics...",                                     │
│        code: "EMP723(2023-05)",                                   │
│        url: "/handle/123456789/11165",                            │
│        school: "4392",                                            │
│        downloaded: true,         ← true if successful            │
│        filename: "EMP723.pdf"    ← Saved filename                │
│      },                                                           │
│      ...                                                          │
│    ],                                                             │
│    errors: [                     ← Array of error messages       │
│      "Failed to download: ...",                                   │
│      "Error processing: ..."                                      │
│    ],                                                             │
│    userId: "user-123",           ← User who started download    │
│    downloadDir: "/path/to/..."   ← Download directory           │
│  }                                                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Event Timeline Example

```
Timeline: Downloading "Common Units" School (21 papers)

T+0s    [User selects school and clicks "Start Download"]
        → API POST /bulk-download
        → Process created with status='running'
        → Progress card appears

T+1s    [First poll] GET /download/status/processId
        → stats: { total: 0, processed: 0, ... }
        
T+3s    [Papers fetched from school]
        → stats: { total: 21, processed: 0, ... }
        
T+5s    [First paper downloading]
        → GET /download/status/
        → stats: { total: 21, processed: 1, successful: 1, ... }
        → Progress: 5%
        
T+10s   [Multiple papers downloaded]
        → stats: { total: 21, processed: 5, successful: 5, ... }
        → Progress: 24%

T+20s   [User pauses]
        → POST /download/pause/processId
        → status = 'paused'
        → Progress freezes at 57%
        
T+25s   [User resumes]
        → POST /download/resume/processId
        → status = 'running'
        → Progress continues

T+60s   [Download nearly complete]
        → stats: { total: 21, processed: 20, successful: 19, failed: 1, ... }
        → Progress: 95%
        
T+65s   [All papers processed]
        → status = 'completed'
        → stats: { total: 21, processed: 21, successful: 20, failed: 1, ... }
        → Progress: 100%
        → Polling stops
        → Process moved to history

Total Time: ~1 minute for 21 papers (21 × 500ms delay + overhead)
```

## File Storage Structure

```
storage/
└── pastpapers/
    ├── a1b2c3d4-e5f6-g7h8-i9j0/           [Process 1 - Completed]
    │   ├── HIST101.pdf                     (150 KB)
    │   ├── HIST102.pdf                     (200 KB)
    │   ├── HIST103.pdf                     (175 KB)
    │   └── HIST104.pdf                     (190 KB)
    │   [Total: 4 files, 715 KB]
    │
    ├── x9y8z7w6-v5u4-t3s2-r1q0/            [Process 2 - Paused at 45%]
    │   ├── PHYS201.pdf                     (220 KB)
    │   ├── PHYS202.pdf                     (225 KB)
    │   ├── PHYS203.pdf                     (218 KB)
    │   └── PHYS204.pdf                     (230 KB)
    │   [Total: 4 files, 893 KB - Can resume]
    │
    └── m5n6o7p8-q9r0-s1t2-u3v4/            [Process 3 - Running]
        ├── CHEM301.pdf                     (280 KB)
        ├── CHEM302.pdf                     (275 KB)
        └── CHEM303.pdf                     (285 KB)
        [Total: 3 files, 840 KB - More downloading...]

Each processId gets its own directory
Files organized as: {filename}.pdf
Can be accessed for further processing
```

## Component Lifecycle

```
┌─ Initialization ────────────────────────────────────────┐
│ useEffect([])                                            │
│ - Fetch schools list                                    │
│ - Fetch all processes (history)                         │
│ - Check for incomplete process                          │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ School Selection ──────────────────────────────────────┐
│ User clicks school → setSelectedSchool(school)         │
│ Button becomes enabled                                  │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ Start Download ───────────────────────────────────────┐
│ User clicks "Start Download"                            │
│ - POST /bulk-download                                  │
│ - setCurrentProcess(newProcess)                        │
│ - Start polling effect                                 │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ Active Polling ───────────────────────────────────────┐
│ useEffect([currentProcess?.id])                         │
│ - Every 2 seconds: GET /download/status/{processId}   │
│ - setCurrentProcess(updated)                           │
│ - If completed/failed: stop polling, refresh history   │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ User Controls ────────────────────────────────────────┐
│ - Pause: POST /download/pause/{id}                     │
│ - Resume: POST /download/resume/{id}                   │
│ - Stop: POST /download/stop/{id}                       │
│ - Each updates currentProcess state                    │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ Completion ───────────────────────────────────────────┐
│ Process status === 'completed'                          │
│ - Stop polling                                         │
│ - Fetch updated history                                │
│ - Show completion message                              │
│ - Optional: Clear currentProcess                       │
└────────────────────────────────────────────────────────┘
```

This visual guide complements the technical documentation and helps understand how all components interact!
