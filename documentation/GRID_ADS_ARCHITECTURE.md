# Grid Ads System - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│              Advanced Ads Management Page                     │
│                                                               │
│  Create New Ad:                                               │
│  ├─ Title:           "Sample Ad"                             │
│  ├─ Type:            Image                                    │
│  ├─ Content:         [Upload Image]                          │
│  ├─ Click URL:       "https://example.com"                   │
│  ├─ Countdown:       10 seconds                              │
│  └─ Placement:       "Grid - Books" ◄──────────┐            │
│         ▼                                       │            │
│    [Create Ad Button]                          │            │
│         │                                       │            │
│         └──────────────────────────────────────┘            │
│                      │                                       │
│                      ▼                                       │
│              Database Update                                 │
│         (ads table + grid-books placement)                   │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ Data persisted
                       │
┌─────────────────────────────────────────────────────────────┐
│                   BOOKS PAGE COMPONENT                       │
│                  (BookPanel.jsx)                             │
│                                                               │
│  Grid Layout (CSS Grid):                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Grid Container (.gridBKP)                           │   │
│  │                                                       │   │
│  │  ┌─────────────────┬──────────────┬─────────────┐   │   │
│  │  │  GRID AD CARD   │ BOOK CARD    │ BOOK CARD   │   │   │
│  │  │                 │              │             │   │   │
│  │  │ (Ad Item 1)     │ (Book 1)     │ (Book 2)    │   │   │
│  │  │                 │              │             │   │   │
│  │  └─────────────────┴──────────────┴─────────────┘   │   │
│  │  ┌─────────────────┬──────────────┬─────────────┐   │   │
│  │  │ BOOK CARD       │ BOOK CARD    │ BOOK CARD   │   │   │
│  │  │ (Book 3)        │ (Book 4)     │ (Book 5)    │   │   │
│  │  └─────────────────┴──────────────┴─────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ├─ Motion Animation (fade in + slide up)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              AdBanner Component                              │
│         (Grid Ad Rendering Logic)                            │
│                                                               │
│  1. Detect placement starts with "grid":                     │
│     if (placement?.startsWith('grid')) {                     │
│                                                               │
│  2. Fetch from database:                                     │
│     GET /api/ads/grid-books?limit=1                          │
│                                                               │
│  3. Render grid card:                                        │
│     <div className="ad-grid-card">                           │
│       <img|video>                                            │
│       <div className="ad-grid-overlay">                      │
│         <span className="ad-label">Ad</span>                 │
│         <div className="ad-countdown">10s</div>              │
│         <button className="ad-close-btn">×</button>          │
│       </div>                                                  │
│     </div>                                                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              CSS Grid Sizing                                 │
│          (Responsive Dimensions)                             │
│                                                               │
│  Mobile Phone (< 640px):                                     │
│  ├─ Card Width: 160px (auto-fill)                           │
│  ├─ Ad Height: 180px (min-height)                           │
│  └─ Image: 160 × 180px                                      │
│                                                               │
│  Tablet (640px - 767px):                                     │
│  ├─ Card Width: ~50% - gap                                  │
│  ├─ Ad Height: 200px (min-height)                           │
│  └─ Image: auto × 200px                                     │
│                                                               │
│  Desktop (768px+):                                           │
│  ├─ Card Width: 240px (auto-fill)                           │
│  ├─ Ad Height: 180px (768px) or 220px (1280px+)             │
│  └─ Image: 240 × 180/220px                                  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│            USER INTERACTIONS & ANALYTICS                     │
│                                                               │
│  On Ad Load:                                                 │
│  └─ POST /api/ad-impression {adId, placement, viewDuration} │
│                                                               │
│  On Ad Click:                                                │
│  ├─ POST /api/ad-click {adId, placement, viewDuration}      │
│  └─ window.open(ad.click_url, '_blank')                     │
│                                                               │
│  On Close Button:                                            │
│  └─ POST /api/ad-dismiss {adId, placement, viewDuration}    │
│                                                               │
│  On Countdown Expire:                                        │
│  └─ Ad auto-hides from DOM                                  │
│                                                               │
│  Analytics Tracked:                                          │
│  ├─ Impressions (ad shown)                                   │
│  ├─ Clicks (user clicked)                                    │
│  ├─ Dismisses (user closed)                                  │
│  ├─ View Duration (how long viewed)                          │
│  └─ Device Type (mobile/tablet/desktop)                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Ad Creation                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Admin → AdvancedAdsManagement.jsx                           │
│    └─ User fills form with:                                  │
│       • Title                                                 │
│       • Type (image/video)                                   │
│       • File (image/video data)                              │
│       • Click URL                                            │
│       • Countdown (10s)                                      │
│       • Placement: "Grid - Books"                            │
│                                                               │
│    └─ API Call: POST /api/ads/create                         │
│       Payload: {title, type, file, clickUrl, countdown,     │
│                 placement: "grid-books"}                     │
│                                                               │
│    └─ Response: {success: true, adId: "123"}                 │
│    └─ Database: ads table updated                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Page Navigation                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User → BookPanel (Books page)                               │
│    └─ Component mounts                                       │
│    └─ Renders grid layout                                   │
│    └─ Motion animations initialize                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Ad Fetching                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BookPanel renders AdBanner:                                │
│    └─ <AdBanner placement="grid-books" limit={1} />         │
│                                                               │
│  AdBanner component mounts:                                 │
│    └─ Detects placement starts with 'grid' ✓               │
│    └─ Calls API: GET /api/ads/grid-books?limit=1            │
│                                                               │
│  API Response:                                               │
│    {                                                         │
│      success: true,                                          │
│      data: [{                                                │
│        id: "ad-123",                                         │
│        title: "Sample Ad",                                   │
│        ad_type: "image",                                     │
│        image_url: "https://...",                             │
│        click_url: "https://example.com",                     │
│        countdown_seconds: 10,                                │
│        placement: "grid-books"                               │
│      }]                                                      │
│    }                                                         │
│                                                               │
│  State Update:                                               │
│    └─ setAds([adData])                                       │
│    └─ setCountdown(10)                                       │
│    └─ Log impression                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Ad Rendering                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AdBanner renders grid card:                                │
│                                                               │
│    <div className="ad-grid-card">                           │
│      <img src={image_url}                                   │
│           style={{width: '100%', height: '100%',           │
│                   objectFit: 'cover'}} />                   │
│                                                               │
│      <div className="ad-grid-overlay">                      │
│        <span className="ad-label">Ad</span>                 │
│        <div className="ad-countdown">                       │
│          <span>10s</span>  ◄─ Updates every 1s              │
│        </div>                                                │
│        <button className="ad-close-btn">                    │
│          × (close)                                           │
│        </button>                                             │
│      </div>                                                  │
│    </div>                                                    │
│                                                               │
│  CSS Applied:                                                │
│    └─ .ad-grid-card                                          │
│       • Position: relative                                   │
│       • Width: 100% (fills grid cell)                        │
│       • Height: 100% (fills card container)                  │
│       • Min-height: 180px (responsive)                       │
│       • Border-radius: 8px (matches book cards)              │
│                                                               │
│  Display Result:                                             │
│    └─ Ad displays with exact book card dimensions           │
│    └─ Image stretches to fill card (object-fit: cover)      │
│    └─ Overlay labels visible at top                         │
│    └─ Countdown timer counts down                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: User Interaction                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Option A: Click Ad                                          │
│    └─ onClick handler fires                                  │
│    └─ POST /api/ad-click                                     │
│    └─ window.open(click_url, '_blank')                       │
│    └─ User taken to advertiser website                       │
│                                                               │
│  Option B: Click Close Button                                │
│    └─ onClick handler fires                                  │
│    └─ POST /api/ad-dismiss                                   │
│    └─ setClosed(true)                                        │
│    └─ Ad hidden immediately                                  │
│                                                               │
│  Option C: Wait (Countdown expires)                          │
│    └─ Timer decrements every 1 second                        │
│    └─ When countdown reaches 0:                              │
│    └─ clearInterval(countdownTimer)                          │
│    └─ setClosed(true)                                        │
│    └─ Ad disappears automatically                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Analytics & Logging                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  All Ad Events Logged to Database:                           │
│                                                               │
│  Event: Impression                                           │
│    When: On ad load (componentDidMount)                      │
│    Endpoint: POST /api/ad-impression                         │
│    Data: {adId, placement, userId, viewDuration: 0,         │
│            deviceType}                                       │
│    Result: +1 to impressions count                           │
│                                                               │
│  Event: Click                                                │
│    When: User clicks ad                                      │
│    Endpoint: POST /api/ad-click                              │
│    Data: {adId, placement, userId, viewDuration,            │
│            deviceType}                                       │
│    Result: +1 to clicks count                                │
│                                                               │
│  Event: Dismiss                                              │
│    When: User closes ad or countdown expires                 │
│    Endpoint: POST /api/ad-dismiss                            │
│    Data: {adId, placement, userId, viewDuration,            │
│            deviceType}                                       │
│    Result: +1 to dismisses count                             │
│                                                               │
│  Device Type Tracking:                                       │
│    • mobile: phone devices                                   │
│    • tablet: tablet devices                                  │
│    • desktop: larger screens                                 │
│                                                               │
│  View Duration:                                              │
│    Calculated from Date.now() - startTimeRef.current         │
│    Measured in seconds                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Sizing Reference

```
MOBILE (< 640px):
┌──────────┐
│  AD/BOOK │  Width: ~160px (grid: auto-fill, minmax(160px))
│  CARD    │  Height: 180px (image/video)
│          │  Gap: 0.75rem
└──────────┘

TABLET (640px - 767px):
┌──────────────┬──────────────┐
│  AD/BOOK     │  AD/BOOK     │  Width: ~calc(50% - gap)
│  CARD        │  CARD        │  Height: 200px
│              │              │  Gap: 0.75rem
└──────────────┴──────────────┘  (2 columns)

DESKTOP (768px - 1279px):
┌──────────────┬──────────────┬──────────────┐
│  AD/BOOK     │  AD/BOOK     │  AD/BOOK     │  Width: 240px (auto-fill, minmax(240px))
│  CARD        │  CARD        │  CARD        │  Height: 180px
│              │              │              │  Gap: 1.2rem
└──────────────┴──────────────┴──────────────┘  (3+ columns)

LARGE DESKTOP (1280px+):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  AD/BOOK     │  AD/BOOK     │  AD/BOOK     │  AD/BOOK     │  Width: 240px
│  CARD        │  CARD        │  CARD        │  CARD        │  Height: 220px
│              │              │              │              │  Gap: 1.2rem
└──────────────┴──────────────┴──────────────┴──────────────┘  (4+ columns)

CSS Breakpoints Used:
├─ 0px (mobile):   minmax(160px, 1fr), height 180px
├─ 420px:          2 columns, height 180px
├─ 640px:          2 columns, height 200px
├─ 768px:          minmax(240px, 1fr), height 180px
├─ 1024px:         minmax(240px, 1fr), height 180px
└─ 1280px:         minmax(240px, 1fr), height 220px
```

## Component Hierarchy

```
Application
│
├─ BookPanel
│  ├─ State: displayedBooks, filters, etc.
│  ├─ Rendering:
│  │  └─ Grid Container (.gridBKP)
│  │     ├─ AnimatePresence (Framer Motion)
│  │     │  ├─ motion.div (grid ad)
│  │     │  │  └─ div.book-cardBKP
│  │     │  │     └─ AdBanner
│  │     │  │        ├─ useEffect (fetch ads)
│  │     │  │        ├─ useEffect (countdown timer)
│  │     │  │        ├─ State: ads, countdown, etc.
│  │     │  │        └─ Render: .ad-grid-card
│  │     │  │           ├─ img/video
│  │     │  │           └─ div.ad-grid-overlay
│  │     │  │              ├─ span.ad-label
│  │     │  │              ├─ div.ad-countdown
│  │     │  │              └─ button.ad-close-btn
│  │     │  │
│  │     │  ├─ motion.div (book 1)
│  │     │  │  └─ div.book-cardBKP
│  │     │  │     └─ (book display content)
│  │     │  │
│  │     │  ├─ motion.div (book 2)
│  │     │  │  └─ div.book-cardBKP
│  │     │  │     └─ (book display content)
│  │     │  │
│  │     │  └─ ... more books ...
│  │     │
│  │     └─ Pagination (load more)
│  │
│  └─ CSS: BookPanel.css
│     ├─ .gridBKP (CSS Grid)
│     ├─ .book-cardBKP (grid cells)
│     └─ .book-coverBKP (images)
│
└─ AdBanner
   ├─ CSS: AdBanner.css
   │  ├─ .ad-grid-card (grid placement)
   │  ├─ .ad-grid-overlay (overlay controls)
   │  └─ (other ad styles for non-grid placements)
   │
   └─ API Endpoints:
      ├─ GET /api/ads/{placement}
      ├─ POST /api/ad-impression
      ├─ POST /api/ad-click
      └─ POST /api/ad-dismiss
```

## Key Integration Points

```
1. ADMIN CREATES AD
   └─ AdvancedAdsManagement.jsx
      └─ Placement dropdown includes "Grid - Books"
      └─ Creates ad with placement="grid-books"
      └─ Database: ads table updated

2. USER VISITS BOOKS PAGE
   └─ BookPanel.jsx mounts
      └─ Renders grid layout
      └─ First item: AdBanner with placement="grid-books"

3. ADBANNER FETCHES AD
   └─ API: GET /api/ads/grid-books?limit=1
      └─ Returns ad with image_url or video_url
      └─ Logs impression

4. AD RENDERS IN GRID
   └─ .ad-grid-card fills grid cell
   └─ Image/video displays with responsive sizing
   └─ Overlay controls visible
   └─ Countdown timer starts

5. USER INTERACTS
   └─ Click: Opens ad.click_url, logs click
   └─ Close: Dismisses ad, logs dismiss
   └─ Wait: Auto-hides when countdown expires

6. ANALYTICS RECORDED
   └─ Database: ad_impressions, ad_clicks, ad_dismisses
   └─ Metrics: viewDuration, deviceType, timestamp
```

---

**Complete grid ad system implemented end-to-end with database integration, responsive sizing, and analytics tracking.**
