import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { supabase } from '../Books/supabaseClient';
import { trackPastPaperDownload } from '../Books/Admin/pastPapersApi';

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
  padding: 8px 16px;
  background: transparent;
 
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: lightgrey;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(226, 232, 240, 0.2);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const Download = ({ 
  paper, 
  variant = 'icon',
  onDownloadStart,
  onDownloadComplete 
}) => {
  const [downloading, setDownloading] = useState(false);

  // Handle case where paper is undefined
  if (!paper || (!paper.title && !paper.course)) {
    return null;
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    if (onDownloadStart) onDownloadStart();
    
    try {
      let url = '';
      // If we already have a public URL, use it
      if (paper.file_url && /^https?:\/\//i.test(paper.file_url)) {
        url = paper.file_url;
      }

      if (!url) throw new Error('File URL is not available');

      // Force download: fetch as blob and trigger a download
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Failed to fetch file');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = (paper.title || paper.course || 'past-paper').replace(/\s+/g, '_') + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

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