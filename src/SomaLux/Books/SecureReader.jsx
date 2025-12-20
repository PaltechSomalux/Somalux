// SecureReader.jsx
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { supabase } from './supabaseClient';
import {
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiRefreshCw,
  FiAlignJustify,
  FiFile,
  FiSun,
  FiCheckCircle,
} from 'react-icons/fi';
import './SecureReader.css'; // Import CSS file

// Use local pdfjs-dist worker; ensure pdfjs-dist version matches react-pdf's pdfjs.version
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const SecureReader = ({ src, title, author, onClose, userId, bookId, pages, sessionId: sessionIdProp, openedAt: openedAtProp }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [warmMode, setWarmMode] = useState(false);

  // Stable per-reader session identifiers for watermarking
  const [sessionId] = useState(() => {
    if (sessionIdProp) return sessionIdProp;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `sess_${Math.random().toString(36).slice(2, 10)}`;
  });

  const [openedAt] = useState(() => {
    if (openedAtProp) return openedAtProp;
    return new Date().toISOString();
  });

  const visibleWatermarkText = React.useMemo(() => {
    const shortSession = sessionId ? sessionId.slice(0, 8) : '';
    const ts = new Date(openedAt).toLocaleString();
    const uid = userId || 'anonymous';
    return `${uid} · ${ts} · ${shortSession}`;
  }, [userId, openedAt, sessionId]);

  // Block common save/print shortcuts while reader is open
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const isModifier =
        e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;

      // If S, P, or G is pressed with ANY modifier key, block it
      if (isModifier && ['s', 'p', 'g'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Blocked shortcut for: ${key.toUpperCase()}`);
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  const handleDocumentLoad = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages || 1);
    setPageNumber(1);
  };

  const goPrev = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goNext = () => {
    setPageNumber(prev => (numPages ? Math.min(numPages, prev + 1) : prev + 1));
  };

  const zoomIn = () => setScale(s => Math.min(2.0, s + 0.1));
  const zoomOut = () => setScale(s => Math.max(0.6, s - 0.1));

  const toggleFullscreen = () => {
    setIsFullscreen(v => !v);
  };

  const rotate = () => {
    setRotation(r => (r + 90) % 360);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  };

  const toggleScrollMode = () => {
    setScrollMode(m => !m);
  };

  const toggleWarmMode = () => {
    setWarmMode(m => !m);
  };

  const handleMarkFinished = async () => {
    if (!userId || !bookId) {
      alert('You need to be signed in to mark this book as finished.');
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reading/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          bookId,
          pagesRead: pages || 0,
          progressPercent: 100,
        }),
      });
      console.log('Marked book as finished for stats/goals');
    } catch (e) {
      console.warn('Failed to mark book finished', e);
    }
    onClose();
  };

  // Build CSS classes dynamically
  const containerClasses = [
    'secure-reader-container',
    isFullscreen ? 'fullscreen' : '',
    warmMode ? 'warm-mode' : ''
  ].filter(Boolean).join(' ');

  const pdfContainerClasses = [
    'pdf-container',
    isFullscreen ? 'fullscreen' : '',
    warmMode ? 'warm-mode' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className="secure-reader-overlay"
      onClick={onClose}
      data-watermark-user={userId || ''}
      data-watermark-session={sessionId}
      data-watermark-opened-at={openedAt}
    >
      <div
        className={containerClasses}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="secure-reader-header">
          <div className="title-section">
            <h3 className="secure-reader-title">{title}</h3>
            {author && <p className="secure-reader-author">by {author}</p>}
          </div>

          <div className="button-group">
            <button
              className="icon-button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
            </button>
            
            <button
              className="icon-button"
              onClick={toggleScrollMode}
              title={scrollMode ? 'Single page mode' : 'Scroll mode'}
            >
              {scrollMode ? <FiFile size={14} /> : <FiAlignJustify size={14} />}
            </button>
            
            <button
              className="icon-button"
              onClick={zoomOut}
              title="Zoom out"
            >
              <FiZoomOut size={14} />
            </button>
            
            <button
              className="icon-button"
              onClick={zoomIn}
              title="Zoom in"
            >
              <FiZoomIn size={14} />
            </button>
            
            <button
              className="icon-button"
              onClick={rotate}
              title="Rotate 90°"
            >
              <FiRotateCcw size={14} />
            </button>
            
            <button
              className="icon-button"
              onClick={resetView}
              title="Reset view"
            >
              <FiRefreshCw size={14} />
            </button>
            
            <button
              className={`icon-button ${warmMode ? 'warm-mode' : ''}`}
              onClick={toggleWarmMode}
              title="Reading mode"
            >
              <FiSun size={14} />
            </button>
            
            <button
              className="finish-button"
              onClick={handleMarkFinished}
              title="Mark book as finished (updates goals & stats)"
            >
              <FiCheckCircle size={14} />
              <span style={{ fontSize: 11 }}>Finished</span>
            </button>
            
            <button
              className="close-button"
              onClick={onClose}
              title="Close reader"
            >
              <FiX size={16} />
              <span style={{ fontSize: 12 }}>Close reader</span>
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className={pdfContainerClasses}>
            {/* Visible watermark overlay */}
            <div className="watermark-overlay">
              <div className="watermark-text">
                {visibleWatermarkText}
              </div>
            </div>

            {/* PDF content */}
            <Document
              file={src}
              onLoadSuccess={handleDocumentLoad}
              loading={
                <div className="loading-text">Loading book pages...</div>
              }
            >
              {scrollMode && numPages
                ? Array.from({ length: numPages }, (_, idx) => (
                  <div key={idx + 1} className="pdf-page-container">
                    <Page
                      pageNumber={idx + 1}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))
                : (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                )}
            </Document>
          </div>

          <div className="reader-footer">
            <span>
              {scrollMode
                ? numPages
                  ? `Scroll mode · ${numPages} pages`
                  : 'Scroll mode'
                : `Page ${pageNumber}${numPages ? ` of ${numPages}` : ''}`}
            </span>
            
            <div className="navigation-group">
              <button
                className="page-button"
                onClick={goPrev}
                disabled={scrollMode || pageNumber <= 1}
                title={scrollMode ? 'Previous page (disabled in scroll mode)' : 'Previous page'}
              >
                <FiChevronLeft size={14} />
              </button>
              
              <button
                className="page-button"
                onClick={goNext}
                disabled={scrollMode || (numPages && pageNumber >= numPages)}
                title={scrollMode ? 'Next page (disabled in scroll mode)' : 'Next page'}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureReader;