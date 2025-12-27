import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { supabase } from '../Books/supabaseClient';
import { trackPastPaperDownload } from '../Books/Admin/pastPapersApi';
import { downloadOptimizer } from '../../utils/DownloadOptimizer';

const DownloadButton = styled(motion.button)`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: lightgrey;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #334155;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FullDownloadButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2a3942;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  color: #e5e7eb;
  cursor: pointer;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  flex: 1;
  min-width: 0;

  &:hover {
    transform: translateY(-1px);
    border-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// High-speed download utility with streaming and caching
const highSpeedDownload = async (url, filename) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'force-cache', // Use browser cache aggressively
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Priority': 'high',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const chunks = [];

    // Stream response for memory efficiency
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Create blob from chunks
    const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'application/pdf' });

    // Trigger download immediately
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 50);

    // Store in IndexedDB for offline access
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open('SomaLuxDownloads', 1);
          req.onupgradeneeded = (e) => {
            const objStore = e.target.result.createObjectStore('files', { keyPath: 'filename' });
            objStore.createIndex('timestamp', 'timestamp', { unique: false });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        const transaction = db.transaction('files', 'readwrite');
        transaction.objectStore('files').put({
          filename,
          blob,
          timestamp: Date.now(),
          size: blob.size,
        });
      } catch (e) {
        console.warn('IndexedDB storage failed:', e);
      }
    }
  } catch (error) {
    console.error('High-speed download failed:', error);
    throw error;
  }
};

export const Download = ({ 
  paper, 
  variant = 'icon',
  onDownloadStart,
  onDownloadComplete 
}) => {
  const [downloading, setDownloading] = useState(false);
  const abortControllerRef = useRef(null);

  // Handle case where paper is undefined
  if (!paper || (!paper.title && !paper.course)) {
    return null;
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    if (onDownloadStart) onDownloadStart();
    
    abortControllerRef.current = new AbortController();
    
    try {
      let url = '';
      // If we already have a public URL, use it
      if (paper.file_url && /^https?:\/\//i.test(paper.file_url)) {
        url = paper.file_url;
      }

      if (!url) throw new Error('File URL is not available');

      // Use high-speed download with streaming and caching
      await highSpeedDownload(
        url,
        (paper.title || paper.course || 'past-paper').replace(/\s+/g, '_') + '.pdf'
      );

      // Track download
      if (paper.id) {
        await trackPastPaperDownload(paper.id);
      }

      setDownloading(false);
      if (onDownloadComplete) onDownloadComplete();
    } catch (error) {
      setDownloading(false);
      console.error('Download failed:', error);
      if (onDownloadComplete) onDownloadComplete(error);
    }
  };

  if (variant === 'full') {
    return (
      <FullDownloadButton
        onClick={handleDownload}
        disabled={downloading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Download ${paper.title || paper.course}`}
      >
        <FiDownload size={24} />
        {downloading ? 'Downloading...' : 'Download'}
      </FullDownloadButton>
    );
  }

  return (
    <DownloadButton
      onClick={handleDownload}
      disabled={downloading}
      title={`Download ${paper.title || paper.course}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Download ${paper.title || paper.course}`}
    >
      <FiDownload size={20} />
    </DownloadButton>
  );
};

Download.propTypes = {
  paper: PropTypes.shape({
    title: PropTypes.string,
    course: PropTypes.string,
  }).isRequired,
  variant: PropTypes.oneOf(['icon', 'full']),
  onDownloadStart: PropTypes.func,
  onDownloadComplete: PropTypes.func,
};

Download.defaultProps = {
  variant: 'icon',
  onDownloadStart: null,
  onDownloadComplete: null,
}; 