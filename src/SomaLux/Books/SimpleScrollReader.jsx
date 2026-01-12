// SimpleScrollReader.jsx - Like Microsoft Edge PDF viewer - just scroll to read
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FiX, FiZoomIn, FiZoomOut, FiList, FiDownload, FiBarChart2, FiSettings, FiEdit3, FiBookmark, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PDFDocument } from 'pdf-lib';
import saveAs from 'file-saver';
import SummaryModal from './SummaryModal';
import DownloadModal from './DownloadModal';
import StatisticsModal from './StatisticsModal';
import SettingsModal from './SettingsModal';
import TextSelectionPanel from './TextSelectionPanel';
import useWPSPrecisionSelectionPerfect from './useWPSPrecisionSelectionPerfect';
import { generateSummaryDocument } from './utils/generateWordDoc';
import './SimpleScrollReader.css';

// Verify worker is configured (set in pdfConfig.js at startup)
let simpleReaderWorkerReady = false;
if (pdfjs.GlobalWorkerOptions.workerSrc) {
  console.log('✅ SimpleScrollReader: Worker ready:', pdfjs.GlobalWorkerOptions.workerSrc);
  simpleReaderWorkerReady = true;
} else {
  console.error('❌ PDF worker not configured! Attempting fallback...');
  try {
    const fallbackWorker = '/pdf.worker.min.mjs';
    pdfjs.GlobalWorkerOptions.workerSrc = fallbackWorker;
    simpleReaderWorkerReady = true;
    console.log('✅ SimpleScrollReader: Worker set to fallback:', fallbackWorker);
  } catch (e) {
    console.error('❌ Failed to set PDF worker fallback in SimpleScrollReader:', e);
    simpleReaderWorkerReady = false;
  }
}

const SimpleScrollReader = ({ src, title, author, onClose, sampleText }) => {
  // Debug: Log the PDF source
  useEffect(() => {
    console.log('🔍 SimpleScrollReader received src:', src);
    if (!src) {
      console.warn('⚠️ No PDF source provided!');
    }
  }, [src]);

  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState(!simpleReaderWorkerReady);
  const [showTOC, setShowTOC] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [audioCurrentPage, setAudioCurrentPage] = useState(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [pageTextMap, setPageTextMap] = useState({});
  const [sentenceMap, setSentenceMap] = useState([]);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [audioPageIndex, setAudioPageIndex] = useState(1);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryPageNumber, setSummaryPageNumber] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [statisticsModalOpen, setStatisticsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [bookmarksPageOpen, setBookmarksPageOpen] = useState(false);
  const [notes, setNotes] = useState(new Map());
  const [readingStartTime, setReadingStartTime] = useState(new Date());
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('dark');
  const [mobileButtonsVisible, setMobileButtonsVisible] = useState(window.innerWidth > 768 ? true : false); // Show on desktop, hide on mobile by default

  // Use perfect WPS-grade selection with uniform styling support (all colors/styles)
  console.log('🔧 SimpleScrollReader: About to call useWPSPrecisionSelectionPerfect hook');
  const { selection, position, clearSelection, isSelecting, lensData, bounds } = useWPSPrecisionSelectionPerfect('.simple-scroll-reader');
  console.log('🔧 SimpleScrollReader: useWPSPrecisionSelectionPerfect hook returned', { selection, position, isSelecting });
  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pageRefsMap = useRef({});
  const scaleRef = useRef(1.0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentPageAudioRef = useRef(1);
  const pausedPageRef = useRef(null);
  const pausedSentenceIndexRef = useRef(0);
  
  // Edge optimization: Scroll tracking
  const lastScrollTimeRef = useRef(0);
  const scrollRAFRef = useRef(null);

  // Check if PDF source is available
  const hasPdfSource = !!src;

  // Debug: Monitor selection state
  useEffect(() => {
    if (selection) {
      console.log('📲 SimpleScrollReader - Selection state updated:', { selection, position });
    }
  }, [selection, position]);
  const handleDocumentLoad = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    // Much shorter delay - 300ms to show first pages faster
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Track reading time - reduced to 5s interval to prevent excessive re-renders (88% reduction)
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalReadingTime(prev => prev + 5); // Increment by 5 seconds
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Save settings to localStorage (debounced 500ms to prevent blocking UI)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const settings = {
        fontSize,
        theme
      };
      localStorage.setItem('pdfReaderSettings', JSON.stringify(settings));
    }, 500);

    return () => clearTimeout(timeout);
  }, [fontSize, theme]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pdfReaderSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.theme) setTheme(settings.theme);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);



  // Add or update note for current page
  // Get note for current page
  const getCurrentPageNote = () => {
    return notes.get(currentPage);
  };

  // Get reading statistics
  const getStatistics = () => {
    const timeInMinutes = Math.floor(totalReadingTime / 60);
    const readPercentage = numPages ? Math.floor((currentPage / numPages) * 100) : 0;
    
    return {
      totalPages: numPages || 0,
      currentPage: currentPage,
      bookmarkedPages: getBookmarkedPages().length,
      notes: notes.size,
      readingTime: timeInMinutes,
      readPercentage: readPercentage,
      pagesPerMinute: timeInMinutes > 0 ? (currentPage / timeInMinutes).toFixed(2) : 0
    };
  };

  const zoomIn = useCallback(() => {
    scaleRef.current = Math.min(3.0, scaleRef.current + 0.075);
    setScale(scaleRef.current);
  }, []);
  
  const zoomOut = useCallback(() => {
    scaleRef.current = Math.max(0.75, scaleRef.current - 0.075);
    setScale(scaleRef.current);
  }, []);

  // Ultra-optimized scroll handler - tracks current page
  useEffect(() => {
    const handleScroll = () => {
      // Skip scroll updates during document loading to prevent flickering
      if (isLoading) return;
      
      const now = performance.now();
      
      // Skip if recent scroll update (batch updates)
      if (now - lastScrollTimeRef.current < 16) return;
      lastScrollTimeRef.current = now;
      
      if (scrollRAFRef.current) cancelAnimationFrame(scrollRAFRef.current);
      
      scrollRAFRef.current = requestAnimationFrame(() => {
        if (!scrollAreaRef.current || !numPages || isLoading) return;
        
        const scrollTop = scrollAreaRef.current.scrollTop;
        const containerHeight = scrollAreaRef.current.clientHeight;
        let currentPageFound = false;

        // Find current page by checking which page is in viewport center
        for (let page = 1; page <= numPages; page++) {
          const pageElement = pageRefsMap.current[page];
          if (!pageElement) continue;
          
          const rect = pageElement.getBoundingClientRect();
          const elementTop = scrollTop + rect.top;
          const elementBottom = elementTop + rect.height;
          
          // Update current page only if in viewport center
          if (!currentPageFound && elementTop <= scrollTop + containerHeight / 2 && elementBottom >= scrollTop + containerHeight / 2) {
            setCurrentPage(page);
            currentPageFound = true;
          }
        }
      });
    };

    const scrollArea = scrollAreaRef.current;
    if (scrollArea && !isLoading) {
      scrollArea.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', handleScroll);
      }
      if (scrollRAFRef.current) {
        cancelAnimationFrame(scrollRAFRef.current);
      }
    };
  }, [numPages, isLoading]);



  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        }
        if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Jump to page
  const jumpToPage = (page) => {
    const pageElement = pageRefsMap.current[page];
    if (pageElement && scrollAreaRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(page);
    }
  };

  // Toggle bookmark for a page
  const toggleBookmark = (page) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(page)) {
        newBookmarks.delete(page);
      } else {
        newBookmarks.add(page);
      }
      return newBookmarks;
    });
  };

  // Get sorted bookmarked pages
  const getBookmarkedPages = () => {
    return Array.from(bookmarks).sort((a, b) => a - b);
  };



  // Open summary modal for a page
  const openSummary = (pageNumber) => {
    setSummaryPageNumber(pageNumber);
    setSummaryModalOpen(true);
  };

  // Open download modal
  const openDownloadModal = () => {
    if (getBookmarkedPages().length === 0) {
      alert('No bookmarked pages to export');
      return;
    }
    setDownloadModalOpen(true);
  };

  // Export bookmarked pages as PDF
  const exportBookmarkedPagesPDF = useCallback(async () => {
    if (getBookmarkedPages().length === 0) {
      alert('No bookmarked pages to export');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.load(await fetch(src).then(res => res.arrayBuffer()));
      const bookmarkedPageIndices = getBookmarkedPages().map(p => p - 1); // Convert to 0-indexed
      
      const newPdf = await PDFDocument.create();
      
      for (const pageIndex of bookmarkedPageIndices) {
        if (pageIndex < pdfDoc.getPageCount()) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
          newPdf.addPage(copiedPage);
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${title}-bookmarked-pages.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export bookmarked pages');
    }
  }, [bookmarks, src, title]);

  // Export summary as Word document
  const exportSummaryAsWord = useCallback(async () => {
    if (getBookmarkedPages().length === 0) {
      alert('No bookmarked pages to export');
      return;
    }

    try {
      await generateSummaryDocument(pageTextMap, getBookmarkedPages(), title);
    } catch (error) {
      console.error('Error exporting summary:', error);
      alert('Failed to export summary');
    }
  }, [bookmarks, src, title]);

  // Play audio for current page - page by page reading
  const playPageAudio = useCallback(() => {
    // Check if we've reached the end
    if (currentPageAudioRef.current > numPages) {
      setIsAudioPlaying(false);
      setAudioPageIndex(1);
      currentPageAudioRef.current = 1;
      isPlayingRef.current = false;
      return;
    }

    const pageNum = currentPageAudioRef.current;
    setAudioPageIndex(pageNum);

    // Get text for current page
    const pageData = pageTextMap[pageNum];
    if (!pageData || !pageData.text) {
      // Skip empty pages, move to next
      currentPageAudioRef.current += 1;
      setTimeout(() => {
        if (isPlayingRef.current) {
          playPageAudio();
        }
      }, 300);
      return;
    }

    // Extract sentences from this page for natural reading
    const pageText = pageData.text;
    const sentences = pageText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (sentences.length === 0) {
      // Page has no readable content, skip to next
      currentPageAudioRef.current += 1;
      setTimeout(() => {
        if (isPlayingRef.current) {
          playPageAudio();
        }
      }, 300);
      return;
    }

    // Scroll to current page
    const pageElement = pageRefsMap.current[pageNum];
    if (pageElement && scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView = true;
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }

    // Read all sentences on this page
    let sentenceIndex = 0;

    const readNextSentence = () => {
      if (sentenceIndex >= sentences.length) {
        // Page finished, move to next page
        currentPageAudioRef.current += 1;
        setTimeout(() => {
          if (isPlayingRef.current) {
            playPageAudio();
          }
        }, 500); // Pause between pages
        return;
      }

      if (!isPlayingRef.current) {
        return; // Audio stopped
      }

      const sentence = sentences[sentenceIndex];
      const utterance = new SpeechSynthesisUtterance(sentence);

      // Apply user's speed preference
      const baseRate = 0.85;
      utterance.rate = baseRate * audioSpeed;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        sentenceIndex += 1;
        if (isPlayingRef.current) {
          // Natural pause between sentences
          const pauseTime = Math.max(200, 350 / audioSpeed);
          setTimeout(readNextSentence, pauseTime);
        }
      };

      utterance.onerror = () => {
        console.error('Speech synthesis error');
        setIsAudioPlaying(false);
        isPlayingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    };

    // Start reading sentences on this page
    readNextSentence();
  }, [pageTextMap, numPages, audioSpeed]);

  // Toggle audio playback (play/pause)
  const toggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      // Pause audio - save position for resume
      window.speechSynthesis.pause();
      setIsAudioPlaying(false);
      setIsPaused(true);
      isPlayingRef.current = false;
      pausedPageRef.current = currentPageAudioRef.current;
    } else if (isPaused) {
      // Resume from pause - continue from saved position
      window.speechSynthesis.resume();
      setIsAudioPlaying(true);
      setIsPaused(false);
      isPlayingRef.current = true;
    } else {
      // Start fresh from page 1
      window.speechSynthesis.cancel();
      currentPageAudioRef.current = 1;
      pausedPageRef.current = null;
      pausedSentenceIndexRef.current = 0;
      
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }

      setAudioPageIndex(1);
      isPlayingRef.current = true;
      setIsAudioPlaying(true);
      setIsPaused(false);
      setAudioProgress(0);
      playPageAudio();
    }
  }, [isAudioPlaying, isPaused, playPageAudio]);

  // Stop audio completely and reset
  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsAudioPlaying(false);
    setIsPaused(false);
    setAudioProgress(0);
    setAudioPageIndex(1);
    currentPageAudioRef.current = 1;
    pausedPageRef.current = null;
    pausedSentenceIndexRef.current = 0;
    isPlayingRef.current = false;
  }, []);

  // Extract text from PDF with page-based organization
  useEffect(() => {
    const extractTextFromPDF = async () => {
      try {
        const pdfDoc = await pdfjs.getDocument(src).promise;
        const pageMapData = {};

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          
          pageMapData[pageNum] = {
            text: pageText,
            pageNum: pageNum
          };
        }

        setPageTextMap(pageMapData);
        setExtractedText('PDF loaded'); // Simple flag
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        // Set a fallback state - PDF may be corrupted but still displayable via react-pdf
        setPageTextMap({});
        setExtractedText('PDF loaded (text extraction unavailable)');
      }
    };

    if (src && !extractedText) {
      extractTextFromPDF();
    }
  }, [src, extractedText]);

  // Copy selected text
  const copyText = async () => {
    if (selection && selection.text && selection.text.length > 0) {
      try {
        await navigator.clipboard.writeText(selection.text);
        console.log('✅ Text copied to clipboard');
        // Panel stays open with feedback animation
      } catch (err) {
        console.error('❌ Failed to copy:', err);
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = selection.text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          console.log('✅ Text copied via fallback');
        } catch (e) {
          console.error('❌ Fallback copy failed:', e);
        }
        document.body.removeChild(textarea);
      }
    }
  };

  // Add highlight for selected text
  const addHighlight = (color) => {
    if (!selection || !selection.text || selection.text.length === 0) return;

    try {
      const sel = window.getSelection();
      if (!sel.rangeCount || sel.rangeCount === 0) {
        console.warn('⚠️ No selection range');
        return;
      }

      const range = sel.getRangeAt(0);
      const highlightColor = getHighlightColor(color);
      
      // Clone the range to avoid mutating it
      const rangeCopy = range.cloneRange();
      
      // Get all text nodes in the range
      const textNodes = [];
      const walker = document.createTreeWalker(
        rangeCopy.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        // Check if node is within the range
        const nodeRange = document.createRange();
        nodeRange.selectNode(node);
        
        // If ranges overlap, include the node
        if (rangeCopy.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 1 &&
            rangeCopy.compareBoundaryPoints(Range.START_TO_END, nodeRange) > -1) {
          textNodes.push(node);
        }
      }

      if (textNodes.length === 0) {
        console.warn('⚠️ No text nodes found in selection');
        return;
      }

      // Highlight each text node (handles multi-line selections)
      textNodes.forEach((textNode) => {
        const span = document.createElement('span');
        span.style.backgroundColor = highlightColor;
        span.style.opacity = '0.35';
        span.className = 'highlighted-text';
        
        // For each text node, wrap it or partial text if at boundaries
        const parent = textNode.parentNode;
        
        // Create a partial selection within this text node
        const nodeRange = document.createRange();
        
        if (textNode === rangeCopy.startContainer && textNode === rangeCopy.endContainer) {
          // Single node: partial selection
          const beforeText = textNode.nodeValue.substring(0, rangeCopy.startOffset);
          const selectedPart = textNode.nodeValue.substring(rangeCopy.startOffset, rangeCopy.endOffset);
          const afterText = textNode.nodeValue.substring(rangeCopy.endOffset);
          
          // Replace node with: before + span(selected) + after
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), textNode);
          }
          
          span.appendChild(document.createTextNode(selectedPart));
          parent.insertBefore(span, textNode);
          
          if (afterText) {
            parent.insertBefore(document.createTextNode(afterText), textNode);
          }
          
          parent.removeChild(textNode);
        } else if (textNode === rangeCopy.startContainer) {
          // Start node: partial from startOffset to end
          const beforeText = textNode.nodeValue.substring(0, rangeCopy.startOffset);
          const selectedPart = textNode.nodeValue.substring(rangeCopy.startOffset);
          
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), textNode);
          }
          
          span.appendChild(document.createTextNode(selectedPart));
          parent.insertBefore(span, textNode);
          parent.removeChild(textNode);
        } else if (textNode === rangeCopy.endContainer) {
          // End node: partial from start to endOffset
          const selectedPart = textNode.nodeValue.substring(0, rangeCopy.endOffset);
          const afterText = textNode.nodeValue.substring(rangeCopy.endOffset);
          
          span.appendChild(document.createTextNode(selectedPart));
          parent.insertBefore(span, textNode);
          
          if (afterText) {
            parent.insertBefore(document.createTextNode(afterText), textNode);
          }
          
          parent.removeChild(textNode);
        } else {
          // Middle node: wrap entire text
          span.appendChild(document.createTextNode(textNode.nodeValue));
          parent.insertBefore(span, textNode);
          parent.removeChild(textNode);
        }
      });

      console.log(`✨ Highlighted: "${selection.text.substring(0, 30)}..." in ${color}`);
      sel.removeAllRanges();
    } catch (err) {
      console.error('❌ Highlight failed:', err);
    }
  };

  // Helper to get highlight color hex value
  const getHighlightColor = (colorName) => {
    const colors = {
      yellow: '#FFFF00',
      green: '#00FF00',
      blue: '#0080FF',
      pink: '#FF0080',
      orange: '#FF3300'
    };
    return colors[colorName.toLowerCase()] || '#FFFF00';
  };

  return (
    <div className="ssr-overlay" style={{ pointerEvents: 'none' }}>
      <div className="ssr-container" onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto', opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s ease-out' }}>
        {/* Header with page indicator */}
        <div className="ssr-header">
          <div className="ssr-title-section">
            <h2 className="ssr-title">{title}</h2>
            {author && <p className="ssr-author">{author}</p>}
          </div>
          
          <div className="ssr-top-controls">
            {/* Audio progress indicator - show page reading */}
            {(isAudioPlaying || isPaused) && numPages && (
              <div className="ssr-audio-status" title={`Reading page ${audioPageIndex} of ${numPages}`}>
                <span className="ssr-audio-label">📖</span>
                <span className="ssr-audio-page">{audioPageIndex}</span>
                <span className="ssr-audio-sep">/</span>
                <span className="ssr-audio-total">{numPages}</span>
              </div>
            )}

            {/* Container for buttons that can be hidden/shown on mobile */}
            <div className={`ssr-mobile-controls-wrapper ${mobileButtonsVisible ? 'visible' : 'hidden'}`}>
            
            {/* Page indicator - hidden when panel is hidden */}
            {numPages && (
              <div className="ssr-page-indicator">
                <span className="ssr-page-num">{currentPage}</span>
                <span className="ssr-page-sep">/</span>
                <span className="ssr-page-total">{numPages}</span>
              </div>
            )}
            
            {/* Icon buttons only - no containers */}
            <button onClick={() => setShowTOC(!showTOC)} className="ssr-icon-btn ssr-toc-toggle" title="Toggle table of contents">
              <FiList size={18} />
            </button>

            {/* Bookmark current page button - toggles bookmark */}
            <button 
              onClick={() => toggleBookmark(currentPage)}
              className={`ssr-icon-btn ssr-bookmark-btn-desktop ${bookmarks.has(currentPage) ? 'active' : ''}`}
              title={bookmarks.has(currentPage) ? 'Remove bookmark' : 'Add bookmark'}
            >
              ⭐
            </button>

            {/* Mobile bookmark button with icon */}
            <button 
              onClick={() => toggleBookmark(currentPage)}
              className={`ssr-icon-btn ssr-bookmark-btn-mobile ${bookmarks.has(currentPage) ? 'active' : ''}`}
              title={bookmarks.has(currentPage) ? 'Remove bookmark' : 'Add bookmark'}
            >
              <FiBookmark size={18} fill={bookmarks.has(currentPage) ? 'currentColor' : 'none'} />
            </button>

            {/* Settings button */}
            <button 
              onClick={() => setSettingsModalOpen(true)} 
              className="ssr-icon-btn"
              title="Reading settings"
            >
              <FiSettings size={18} />
            </button>
            
            {/* Audio controls - always visible when loading or during audio */}
            {(isAudioPlaying || isPaused || extractedText) && (
              <div className="ssr-audio-controls-group">
                {/* Play button */}
                {!isAudioPlaying && !isPaused && (
                  <button onClick={toggleAudio} className="ssr-icon-btn" title="Play audio">
                    ▶️
                  </button>
                )}
                
                {/* Pause button - only when playing */}
                {isAudioPlaying && (
                  <button onClick={toggleAudio} className="ssr-icon-btn active" title="Pause audio">
                    ⏸️
                  </button>
                )}
                
                {/* Resume button - only when paused */}
                {isPaused && (
                  <button onClick={toggleAudio} className="ssr-icon-btn" title="Resume audio">
                    ▶️
                  </button>
                )}
                
                {/* Stop button - always when audio controls visible */}
                {(isAudioPlaying || isPaused) && (
                  <button onClick={stopAudio} className="ssr-icon-btn" title="Stop audio">
                    ⏹️
                  </button>
                )}
                
                {/* Speed control - always visible */}
                <div className="ssr-speed-control">
                  <select value={audioSpeed} onChange={(e) => setAudioSpeed(parseFloat(e.target.value))} title="Reading speed">
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>
              </div>
            )}
            
            <button onClick={zoomOut} className="ssr-icon-btn ssr-zoom-btn" title="Zoom out (Ctrl + -)">
              <FiZoomOut size={18} />
            </button>
            <div className="ssr-zoom-percentage" title="Current zoom level">
              {Math.round((scale / 1.5) * 100)}%
            </div>
            <button onClick={zoomIn} className="ssr-icon-btn ssr-zoom-btn" title="Zoom in (Ctrl + +)">
              <FiZoomIn size={18} />
            </button>
            </div>
          </div>

          {/* Mobile button toggle - show/hide all buttons */}
          <button 
            onClick={() => setMobileButtonsVisible(!mobileButtonsVisible)} 
            className={`ssr-icon-btn ssr-mobile-toggle ${!mobileButtonsVisible ? 'hidden' : ''}`}
            title="Toggle controls visibility"
          >
            ⋮
          </button>

          {/* Close button - positioned at top right corner */}
          <button onClick={onClose} className="ssr-close-corner-btn" title="Close (Esc)">
            <FiX size={18} />
          </button>
        </div>

        {/* Main content area with TOC sidebar */}
        <div className="ssr-main-content">
          {/* Table of Contents Sidebar - Toggleable like Edge */}
          {showTOC && (
            <div className="ssr-toc-sidebar">
              <div className="ssr-toc-header">
                <h3>Pages</h3>
              </div>

              {/* Bookmarks section */}
              {getBookmarkedPages().length > 0 && (
                <div className="ssr-bookmarks-section ssr-bookmarks-mobile">
                  <div className="ssr-bookmarks-title">
                    <span>⭐ Bookmarks</span>
                    <button 
                      onClick={openDownloadModal} 
                      className="ssr-bookmark-export-btn"
                      title="Download bookmarked pages"
                    >
                      <FiDownload size={14} />
                    </button>
                  </div>
                  <div className="ssr-bookmarks-list">
                    {getBookmarkedPages().map((page) => (
                      <div
                        key={`bookmark-${page}`}
                        className={`ssr-bookmark-item ${currentPage === page ? 'active' : ''}`}
                        onClick={() => jumpToPage(page)}
                      >
                        <span className="ssr-bookmark-page">⭐ {page}</span>
                        <div className="ssr-bookmark-spacer"></div>
                        <div className="ssr-bookmark-actions">
                          <button
                            className="ssr-bookmark-summary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSummary(page);
                            }}
                            title="View summary"
                          >
                            📋
                          </button>
                          <button
                            className="ssr-bookmark-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(page);
                            }}
                            title="Remove bookmark"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ssr-toc-list">
                {numPages && Array.from({ length: numPages }, (_, idx) => idx + 1).map((page) => (
                  <div
                    key={page}
                    className={`ssr-toc-item ${currentPage === page ? 'active' : ''}`}
                    onClick={() => jumpToPage(page)}
                  >
                    <span className="ssr-toc-page">{page}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll area - continuous pages */}
          <div className="ssr-scroll-area simple-scroll-reader" ref={scrollAreaRef}>
            {!hasPdfSource ? (
              <div className="ssr-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px', gap: '20px', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px' }}>📄</div>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>PDF File Not Available</h2>
                <p style={{ margin: '0', color: '#9ca3af' }}>The PDF file could not be loaded. Please try another book or contact support.</p>
                {sampleText && (
                  <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', width: '100%', textAlign: 'left' }}>
                    <p style={{ color: '#9ca3af', fontSize: '12px' }}>Preview from book description:</p>
                    {sampleText.split('\n').slice(0, 100).map((line, idx) => (
                      <p key={idx} style={{ margin: '4px 0', color: '#d1d5db', lineHeight: 1.4, fontSize: '13px' }}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : isLoading && sampleText ? (
              <div className="ssr-sample-text">
                {sampleText.split('\n').slice(0, 200).map((line, idx) => (
                  <p key={idx} style={{ margin: '6px 0', color: '#d1d5db', lineHeight: 1.5 }}>{line}</p>
                ))}
                <div style={{ marginTop: 12, color: '#9ca3af' }}>Loading full book…</div>
              </div>
            ) : isLoading ? (
              <div className="ssr-loading">
                <div className="ssr-spinner"></div>
                <p>Loading book...</p>
              </div>
            ) : null}

            {hasPdfSource && (
              <Document
                file={src}
                onLoadSuccess={handleDocumentLoad}
                onError={(error) => {
                  console.error('PDF loading error in SimpleScrollReader:', error?.message || error);
                  setPdfError(true);
                }}
                loading={<div className="ssr-loading"><div className="ssr-spinner"></div></div>}
                error={
                  <div className="ssr-error">
                    {pdfError 
                      ? '❌ Failed to load PDF. The file may be corrupted or inaccessible. Please refresh and try again.'
                      : 'Failed to load PDF. The file may be corrupted or inaccessible.'}
                  </div>
                }
              >
                {/* Scroll Mode - Only continuous scrolling */}
                <div className="ssr-scroll-area simple-scroll-reader" ref={scrollAreaRef}>
                  {numPages && Array.from({ length: numPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    
                    return (
                      <div 
                        key={pageNum} 
                        className="ssr-page"
                        ref={(el) => {
                          if (el) pageRefsMap.current[pageNum] = el;
                        }}
                      >
                        <Page
                          pageNumber={pageNum}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={false}
                          loading=""
                          onRenderError={(error) => {
                            console.warn('PDF page render error:', error?.message || error);
                            setPdfError(true);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Document>
            )}
            {!hasPdfSource && (
              <div className="ssr-error">
                ❌ No PDF source provided. The file location may be invalid.
              </div>
            )}
          </div>
        </div>

        {/* Floating View Bookmarks Button - Mobile Only, Shows only when bookmarks exist */}
        {getBookmarkedPages().length > 0 && (
          <button
            onClick={() => setBookmarksPageOpen(true)}
            className="ssr-floating-bookmarks-btn"
            title="View all bookmarks"
          >
            <FiBookmark size={24} />
            <span className="ssr-bookmarks-badge">{getBookmarkedPages().length}</span>
          </button>
        )}

        {/* Summary Modal */}
        <SummaryModal
          isOpen={summaryModalOpen}
          pageNumber={summaryPageNumber}
          pageText={summaryPageNumber ? pageTextMap[summaryPageNumber]?.text : ''}
          title={title}
          onClose={() => setSummaryModalOpen(false)}
        />

        {/* Download Modal */}
        <DownloadModal
          isOpen={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
          onDownloadPDF={exportBookmarkedPagesPDF}
          onDownloadSummary={exportSummaryAsWord}
          bookmarkCount={getBookmarkedPages().length}
        />

        {/* Statistics Modal */}
        <StatisticsModal
          isOpen={statisticsModalOpen}
          statistics={getStatistics()}
          onClose={() => setStatisticsModalOpen(false)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsModalOpen}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          theme={theme}
          onThemeChange={setTheme}
          onStatisticsClick={() => setStatisticsModalOpen(true)}
          onClose={() => setSettingsModalOpen(false)}
        />

        {/* Bookmarks Page/Modal for Mobile */}
        {bookmarksPageOpen && (
          <div className="ssr-bookmarks-page-overlay">
            <div className="ssr-bookmarks-page">
              <div className="ssr-bookmarks-page-header">
                <div className="ssr-bookmarks-page-header-content">
                  <h2>⭐ My Bookmarks</h2>
                  <span className="ssr-bookmarks-page-count">{getBookmarkedPages().length} marked page{getBookmarkedPages().length !== 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => setBookmarksPageOpen(false)}
                  className="ssr-bookmarks-page-close"
                  title="Close bookmarks"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="ssr-bookmarks-page-content">
                {getBookmarkedPages().length > 0 ? (
                  <div className="ssr-bookmarks-page-list">
                    {getBookmarkedPages().map((page, index) => (
                      <div
                        key={`bookmark-page-${page}`}
                        className={`ssr-bookmarks-page-item ${currentPage === page ? 'active' : ''} ${notes.get(page) ? 'has-note' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div 
                          className="ssr-bookmarks-page-item-left"
                          onClick={() => {
                            jumpToPage(page);
                            setBookmarksPageOpen(false);
                          }}
                        >
                          <div className="ssr-bookmarks-page-item-number-box">
                            <span className="ssr-bookmarks-page-item-number">{page}</span>
                            {notes.get(page) && (
                              <span className="ssr-bookmarks-page-item-note-tick">✓</span>
                            )}
                          </div>
                          <div className="ssr-bookmarks-page-item-details">
                            <div className="ssr-bookmarks-page-item-title">Page {page}</div>
                            {notes.get(page) && (
                              <div className="ssr-bookmarks-page-item-note-preview">
                                <span className="ssr-bookmarks-page-item-note-icon">📝</span>
                                {notes.get(page).text ? notes.get(page).text.substring(0, 50) : notes.get(page).substring(0, 50)}
                              </div>
                            )}
                          </div>
                          {currentPage === page && <span className="ssr-bookmarks-page-item-reading">Reading</span>}
                        </div>
                        <div className="ssr-bookmarks-page-item-actions">
                          <button
                            className="ssr-bookmarks-page-action-btn ssr-bookmarks-page-summary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSummary(page);
                            }}
                            title="View summary"
                          >
                            📋
                          </button>
                          <button
                            className="ssr-bookmarks-page-action-btn ssr-bookmarks-page-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(page);
                            }}
                            title="Remove bookmark"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ssr-bookmarks-page-empty">
                    <div className="ssr-bookmarks-page-empty-icon">⭐</div>
                    <p>No bookmarks yet</p>
                    <small>Mark pages while reading to keep track</small>
                  </div>
                )}
              </div>

              {getBookmarkedPages().length > 0 && (
                <div className="ssr-bookmarks-page-footer">
                  <button
                    onClick={openDownloadModal}
                    className="ssr-bookmarks-page-download-btn"
                    title="Download bookmarked pages"
                  >
                    <FiDownload size={16} /> Download All ({getBookmarkedPages().length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* High-precision Text Selection Panel */}
      {selection && position && (
        <TextSelectionPanel
          position={position}
          selectedText={selection.text}
          onCopy={copyText}
          onHighlight={addHighlight}
          onClose={clearSelection}
          summaryModalOpen={summaryModalOpen}
        />
      )}
    </div>
  );
};

export default SimpleScrollReader;
