// FastReader.jsx - Ultra-fast minimal PDF reader, loads like a normal PDF
import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi';
import './FastReader.css';

// Use local pdfjs-dist worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const FastReader = ({ src, title, author, onClose, userId, bookId }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Lazy load pages: only render current page +/- 1
  const [visiblePages, setVisiblePages] = useState(new Set([1]));

  useEffect(() => {
    const pages = new Set();
    pages.add(pageNumber);
    if (pageNumber > 1) pages.add(pageNumber - 1);
    if (pageNumber < numPages) pages.add(pageNumber + 1);
    setVisiblePages(pages);
  }, [pageNumber, numPages]);

  const handleDocumentLoad = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    setIsLoading(false);
  };

  const goPrev = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goNext = () => {
    setPageNumber(prev => (numPages ? Math.min(numPages, prev + 1) : prev + 1));
  };

  const zoomIn = () => setScale(s => Math.min(2.5, s + 0.2));
  const zoomOut = () => setScale(s => Math.max(0.8, s - 0.2));

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') goNext();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'Escape') onClose();
  }, [numPages, pageNumber]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fast-reader-overlay" onClick={onClose}>
      <div className="fast-reader-container" onClick={e => e.stopPropagation()}>
        {/* Minimal header */}
        <div className="fast-reader-header">
          <div className="fast-reader-info">
            <div className="fast-reader-title">{title}</div>
            <div className="fast-reader-author">{author}</div>
          </div>

          <div className="fast-reader-controls">
            <button
              onClick={zoomOut}
              className="fast-btn"
              title="Zoom out (Ctrl + -)"
            >
              <FiZoomOut size={18} />
            </button>
            
            <button
              onClick={zoomIn}
              className="fast-btn"
              title="Zoom in (Ctrl + +)"
            >
              <FiZoomIn size={18} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="fast-btn"
              title="Fullscreen"
            >
              {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
            </button>

            <button
              onClick={onClose}
              className="fast-btn close-btn"
              title="Close (Esc)"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content - No watermarks, no extra layers */}
        <div className={`fast-reader-content ${isFullscreen ? 'fullscreen' : ''}`}>
          {isLoading && (
            <div className="fast-loading">
              <div className="fast-spinner"></div>
              <p>Loading page {pageNumber}...</p>
            </div>
          )}

          <Document
            file={src}
            onLoadSuccess={handleDocumentLoad}
            loading={<div className="fast-loading"><div className="fast-spinner"></div></div>}
            error={<div className="fast-error">Failed to load PDF</div>}
          >
            {/* Only render visible pages to save memory */}
            {numPages && Array.from(visiblePages).sort((a, b) => a - b).map(page => (
              <div key={page} className={`fast-page-wrapper ${page === pageNumber ? 'current' : ''}`}>
                <Page
                  pageNumber={page}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        </div>

        {/* Minimal footer */}
        <div className="fast-reader-footer">
          <div className="fast-page-nav">
            <button
              onClick={goPrev}
              disabled={pageNumber <= 1}
              className="fast-nav-btn"
              title="Previous page (← or ↑)"
            >
              <FiChevronLeft size={20} />
            </button>

            <div className="fast-page-indicator">
              <input
                type="number"
                min="1"
                max={numPages || 1}
                value={pageNumber}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  if (num >= 1 && num <= (numPages || 1)) {
                    setPageNumber(num);
                  }
                }}
                className="fast-page-input"
              />
              <span className="fast-page-total">/ {numPages || '?'}</span>
            </div>

            <button
              onClick={goNext}
              disabled={numPages && pageNumber >= numPages}
              className="fast-nav-btn"
              title="Next page (→ or Space)"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastReader;
