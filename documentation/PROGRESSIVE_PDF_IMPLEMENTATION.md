// IMPLEMENTATION EXAMPLE - How to integrate progressive PDF loading
// This file shows the exact code changes needed

// ============================================================================
// FILE: src/SomaLux/PastPapers/Pastpapers.jsx
// ============================================================================

// CHANGE 1: Add import for LazyPDFCover and hook
// LOCATION: Top of file with other imports
// ADD THESE LINES:

import LazyPDFCover from '../Books/LazyPDFCover';
import { useProgressivePDFLoader } from '../Books/useProgressivePDFLoader';

// CHANGE 2: Initialize the progressive loader hook
// LOCATION: Inside PaperPanel component, after other state declarations
// ADD AFTER LINE ~80:

export const PaperPanel = ({ demoMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [displayedPapers, setDisplayedPapers] = useState([]);
  
  // ... existing state declarations ...
  
  // ✅ ADD THIS:
  const { loadedPaperIds, markAsLoaded, progress } = useProgressivePDFLoader(
    displayedPapers,
    { 
      maxConcurrentLoads: 1,      // Load only 1 PDF at a time
      delayBetweenLoads: 250,     // 250ms delay between starting loads
      prioritizeVisible: true     // Load visible papers first
    }
  );

  // ... rest of component ...
};


// ============================================================================
// FILE: src/SomaLux/PastPapers/PaperGrid.jsx
// ============================================================================

// CHANGE 1: Update paper rendering to use LazyPDFCover
// LOCATION: Inside the displayedPapers.map() function (~line 200)
// REPLACE THIS:

{/* Paper Cover - DISABLED for performance, using placeholder instead */}
<div
  style={{
    width: '100%',
    height: '140px',
    backgroundColor: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    marginBottom: '8px',
    color: '#8696a0',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '8px'
  }}
>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
    <FiFileText size={24} />
    <span>{paper.courseCode || 'Paper'}</span>
  </div>
</div>

// WITH THIS:

<LazyPDFCover
  src={paper.file_url}
  alt={paper.title || paper.courseCode}
  paperId={paper.id}
  index={index}
  totalPapers={displayedPapers.length}
  style={{
    width: '100%',
    height: '140px',
    borderRadius: '6px',
    marginBottom: '8px'
  }}
  onClick={() => onPaperSelect(paper)}
  onLoadComplete={() => {
    // Optional: Call callback when preview loads
    console.log('Preview loaded for:', paper.id);
  }}
/>

// CHANGE 2: Add import at top of PaperGrid.jsx
// ADD THIS LINE at imports section:

import LazyPDFCover from '../Books/LazyPDFCover';


// ============================================================================
// OPTIONAL: Show loading progress indicator
// ============================================================================

// Add this in PaperPanel component render, after the grid displays

{progress < 100 && progress > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#00a884',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      fontWeight: 500
    }}
  >
    📄 Preview Progress: {Math.round(progress)}%
  </motion.div>
)}


// ============================================================================
// ADVANCED: Add settings to control loading speed
// ============================================================================

// In Pastpapers.jsx, add user preference state:

const [previewQuality, setPreviewQuality] = useState('medium');

// Then use in hook initialization:
const loaderConfig = {
  maxConcurrentLoads: previewQuality === 'fast' ? 2 : 1,
  delayBetweenLoads: previewQuality === 'fast' ? 100 : 250,
  prioritizeVisible: true
};

const { loadedPaperIds, markAsLoaded, progress } = useProgressivePDFLoader(
  displayedPapers,
  loaderConfig
);

// Add setting control:
<button onClick={() => setPreviewQuality('fast')}>
  ⚡ Fast Preview Loading
</button>
<button onClick={() => setPreviewQuality('medium')}>
  ⚙️ Balanced (Default)
</button>
<button onClick={() => setPreviewQuality('slow')}>
  🔋 Battery Saving
</button>


// ============================================================================
// BEFORE & AFTER COMPARISON
// ============================================================================

/* 
BEFORE (Current):
┌─────────────────────┐
│ User visits page    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 31 PDFs render      │
│ simultaneously      │
│ (CPU SPIKE)         │
└──────────┬──────────┘
           │
           ▼
         3-5s wait
      (PAGE HANGS)
           │
           ▼
┌─────────────────────┐
│ 31 previews show    │
│ Page finally usable │
└─────────────────────┘

AFTER (With Progressive Loading):
┌─────────────────────┐
│ User visits page    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 31 placeholders     │
│ show instantly      │
│ (NO CPU SPIKE)      │
└──────────┬──────────┘
           │
      <500ms
           │
           ▼
┌─────────────────────┐
│ Page fully usable   │
│ User can interact   │
│ immediately         │
└──────────┬──────────┘
           │
      In Background:
           ▼
┌─────────────────────┐
│ PDF 1 renders       │
│ (250ms)             │
│ → loads PDF 2       │
│ → loads PDF 3       │
│ ... one at a time   │
│ (NO PERFORMANCE     │
│  IMPACT)            │
└─────────────────────┘
*/


// ============================================================================
// CONFIGURATION PRESETS
// ============================================================================

const LOADER_PRESETS = {
  // Fast: Great for powerful computers
  fast: {
    maxConcurrentLoads: 2,
    delayBetweenLoads: 100,
    prioritizeVisible: true
  },
  
  // Medium: Balanced, recommended default
  medium: {
    maxConcurrentLoads: 1,
    delayBetweenLoads: 250,
    prioritizeVisible: true
  },
  
  // Slow: For low-end devices, slow networks
  slow: {
    maxConcurrentLoads: 1,
    delayBetweenLoads: 500,
    prioritizeVisible: true
  },
  
  // Battery Saving: Minimal rendering
  battery: {
    maxConcurrentLoads: 1,
    delayBetweenLoads: 1000,
    prioritizeVisible: true
  }
};

// Usage:
const { loadedPaperIds, markAsLoaded, progress } = useProgressivePDFLoader(
  displayedPapers,
  LOADER_PRESETS.medium  // Use medium preset
);
