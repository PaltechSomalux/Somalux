// PDFCover.jsx - Renders the first page of a PDF as a cover thumbnail
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PDFCover = ({ src, alt, className, style, onClick, loading = 'lazy' }) => {
  const [error, setError] = useState(false);
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = useState(280);

  // Update PDF width based on container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Use container width minus padding, but max 280px
        setContainerWidth(Math.min(width - 4, 280));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (error || !src) {
    // Fallback to placeholder if PDF fails to load
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: '#00a884',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.8em',
          textAlign: 'center',
          padding: '10px',
        }}
        onClick={onClick}
      >
        📄 PDF
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        width: '100%',
      }}
      onClick={onClick}
    >
      <Document
        file={src}
        onLoadSuccess={() => {
          // Document loaded
        }}
        onError={(error) => {
          console.warn('PDF load error (will display fallback):', error?.message || error);
          setError(true);
        }}
        loading={<div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>}
      >
        <Page
          pageNumber={1}
          width={containerWidth}
          onRenderError={(error) => {
            console.warn('PDF render error (will display fallback):', error?.message || error);
            setError(true);
          }}
        />
      </Document>
    </div>
  );
};

export default PDFCover;
