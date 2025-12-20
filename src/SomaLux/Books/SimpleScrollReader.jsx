// SimpleScrollReader.jsx - Like Microsoft Edge PDF viewer - just scroll to read
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FiX, FiZoomIn, FiZoomOut, FiList, FiDownload, FiBarChart2, FiSettings, FiEdit3 } from 'react-icons/fi';
import { PDFDocument } from 'pdf-lib';
import saveAs from 'file-saver';
import SummaryModal from './SummaryModal';
import DownloadModal from './DownloadModal';
import StatisticsModal from './StatisticsModal';
import SettingsModal from './SettingsModal';
import NoteModal from './NoteModal';
import { generateSummaryDocument } from './utils/generateWordDoc';
import './SimpleScrollReader.css';

// Suppress pdfjs worker warnings for corrupted PDFs
if (typeof window !== 'undefined' && window.PDFJS) {
  window.PDFJS.disableWorker = false;
  window.PDFJS.logLevel = window.PDFJS.VERBOSITY_LEVELS.ERRORS;
}

// Set the worker source - use CDN for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [showTOC, setShowTOC] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [audioCurrentPage, setAudioCurrentPage] = useState(1);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [visiblePages, setVisiblePages] = useState(new Set([1]));
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
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [notes, setNotes] = useState(new Map());
  const [readingStartTime, setReadingStartTime] = useState(new Date());
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('dark');
  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pageRefsMap = useRef({});
  const scaleRef = useRef(1.0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentPageAudioRef = useRef(1);
  const pausedPageRef = useRef(null);
  const pausedSentenceIndexRef = useRef(0);

  const handleDocumentLoad = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    setIsLoading(false);
  };

  // Track reading time
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedTime = new Date() - readingStartTime;
      setTotalReadingTime(Math.floor(elapsedTime / 1000)); // in seconds
    }, 1000);

    return () => clearInterval(timer);
  }, [readingStartTime]);

  // Save settings to localStorage
  useEffect(() => {
    const settings = {
      fontSize,
      theme
    };
    localStorage.setItem('pdfReaderSettings', JSON.stringify(settings));
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
  const addNote = (noteData) => {
    const newNotes = new Map(notes);
    newNotes.set(currentPage, {
      text: typeof noteData === 'string' ? noteData : noteData.text,
      category: typeof noteData === 'object' ? noteData.category : 'general',
      color: typeof noteData === 'object' ? noteData.color : 'blue',
      tags: typeof noteData === 'object' ? noteData.tags : [],
      timestamp: new Date().toISOString(),
      pageNumber: currentPage
    });
    setNotes(newNotes);
    setNoteModalOpen(false);
  };

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
    scaleRef.current = Math.min(2.0, scaleRef.current + 0.05);
    setScale(scaleRef.current);
  }, []);
  
  const zoomOut = useCallback(() => {
    scaleRef.current = Math.max(0.6, scaleRef.current - 0.05);
    setScale(scaleRef.current);
  }, []);

  // Pinch zoom support - only on scroll area
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        setTouchStartDistance(distance);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDistance > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const diff = distance - touchStartDistance;

        if (Math.abs(diff) > 2) {
          // Smooth zoom: calculate incremental scale change based on touch distance
          const zoomFactor = 1 + (diff / 500); // Granular zoom factor
          scaleRef.current = Math.max(0.6, Math.min(2.0, scaleRef.current * zoomFactor));
          setScale(scaleRef.current);
          setTouchStartDistance(distance);
        }
      }
    };

    const handleTouchEnd = () => {
      setTouchStartDistance(0);
    };

    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      scrollArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      scrollArea.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('touchstart', handleTouchStart);
        scrollArea.removeEventListener('touchmove', handleTouchMove);
        scrollArea.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [touchStartDistance]);

  // Track current page while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current || !numPages) return;
      
      const scrollTop = scrollAreaRef.current.scrollTop;
      const containerHeight = scrollAreaRef.current.clientHeight;
      const visible = new Set();

      // Find all pages in viewport + buffer (3 pages above and below)
      for (let page = 1; page <= numPages; page++) {
        const pageElement = pageRefsMap.current[page];
        if (pageElement) {
          const rect = pageElement.getBoundingClientRect();
          const elementTop = scrollTop + rect.top;
          const elementBottom = elementTop + rect.height;
          
          // Add page if visible or in buffer range
          if (elementBottom > scrollTop - containerHeight && elementTop < scrollTop + containerHeight * 2) {
            visible.add(page);
          }

          // Update current page
          if (elementTop <= scrollTop + containerHeight / 2 && elementBottom >= scrollTop + containerHeight / 2) {
            setCurrentPage(page);
          }
        }
      }
      
      setVisiblePages(visible);
    };

    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', handleScroll);
      }
    };
  }, [numPages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
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

  return (
    <div className="ssr-overlay" onClick={onClose}>
      <div className="ssr-container" onClick={e => e.stopPropagation()}>
        {/* Header with page indicator */}
        <div className="ssr-header">
          <div className="ssr-title-section">
            <h2 className="ssr-title">{title}</h2>
            {author && <p className="ssr-author">{author}</p>}
          </div>
          
          <div className="ssr-top-controls">
            {/* Page indicator */}
            {numPages && (
              <div className="ssr-page-indicator">
                <span className="ssr-page-num">{currentPage}</span>
                <span className="ssr-page-sep">/</span>
                <span className="ssr-page-total">{numPages}</span>
              </div>
            )}

            {/* Audio progress indicator - show page reading */}
            {(isAudioPlaying || isPaused) && numPages && (
              <div className="ssr-audio-status" title={`Reading page ${audioPageIndex} of ${numPages}`}>
                <span className="ssr-audio-label">📖</span>
                <span className="ssr-audio-page">{audioPageIndex}</span>
                <span className="ssr-audio-sep">/</span>
                <span className="ssr-audio-total">{numPages}</span>
              </div>
            )}

            {/* Icon buttons only - no containers */}
            <button onClick={() => setShowTOC(!showTOC)} className="ssr-icon-btn" title="Toggle table of contents">
              <FiList size={18} />
            </button>

            {/* Bookmark current page button */}
            <button 
              onClick={() => toggleBookmark(currentPage)} 
              className={`ssr-icon-btn ${bookmarks.has(currentPage) ? 'active' : ''}`}
              title={bookmarks.has(currentPage) ? 'Remove bookmark' : 'Add bookmark'}
            >
              ⭐
            </button>

            {/* Add Note button */}
            <button 
              onClick={() => setNoteModalOpen(true)} 
              className={`ssr-icon-btn ${getCurrentPageNote() ? 'active' : ''}`}
              title="Add or edit note"
            >
              <FiEdit3 size={18} />
            </button>

            {/* Statistics button */}
            <button 
              onClick={() => setStatisticsModalOpen(true)} 
              className="ssr-icon-btn"
              title="View reading statistics"
            >
              <FiBarChart2 size={18} />
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
            
            <button onClick={zoomOut} className="ssr-icon-btn" title="Zoom out (Ctrl + -)">
              <FiZoomOut size={18} />
            </button>
            <button onClick={zoomIn} className="ssr-icon-btn" title="Zoom in (Ctrl + +)">
              <FiZoomIn size={18} />
            </button>
            <button onClick={onClose} className="ssr-icon-btn" title="Close (Esc)">
              <FiX size={18} />
            </button>
          </div>
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
                <div className="ssr-bookmarks-section">
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
          <div className="ssr-scroll-area" ref={scrollAreaRef}>
            {isLoading && sampleText ? (
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

            <Document
              file={src}
              onLoadSuccess={handleDocumentLoad}
              loading={<div className="ssr-loading"><div className="ssr-spinner"></div></div>}
              error={<div className="ssr-error">Failed to load PDF</div>}
            >
              {numPages && Array.from({ length: numPages }, (_, idx) => {
                const pageNum = idx + 1;
                // Only render visible pages + buffer
                if (!visiblePages.has(pageNum)) {
                  return (
                    <div 
                      key={pageNum} 
                      className="ssr-page-placeholder"
                      ref={(el) => {
                        if (el) pageRefsMap.current[pageNum] = el;
                      }}
                      style={{ height: '800px' }}
                    />
                  );
                }
                
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
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading=""
                    />
                  </div>
                );
              })}
            </Document>
          </div>
        </div>

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
          onClose={() => setSettingsModalOpen(false)}
        />

        {/* Note Modal */}
        <NoteModal
          isOpen={noteModalOpen}
          pageNumber={currentPage}
          existingNote={getCurrentPageNote()}
          onAddNote={addNote}
          onClose={() => setNoteModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default SimpleScrollReader;
