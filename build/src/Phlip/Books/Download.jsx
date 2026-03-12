import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const IconDownloadButton = styled(motion.button)`
  background: transparent; /* Keep background transparent */
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #d3d3d3; /* Changed text/icon color to lightgrey */
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  margin-left: 0; /* Aligns to the left corner */

  &:hover {
    color: #b0b0b0; /* Slightly darker lightgrey for hover effect */
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FullDownloadButton = styled(motion.button)`
  padding: 8px 16px;
  background: transparent; /* Keep background transparent */
  border: none; /* Removed border */
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #d3d3d3; /* Changed text/icon color to lightgrey */
  transition: all 0.2s ease;
  margin-left: 0; /* Aligns to the left corner */

  &:hover {
    color: #b0b0b0; /* Slightly darker lightgrey for hover effect */
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const Download = ({
  book,
  file,
  variant = 'icon',
  onDownloadStart,
  onDownloadComplete,
  downloadText = 'Save',
  downloadingText = 'Downloading...',
}) => {
  const [downloading, setDownloading] = useState(false);

  // Handle case where neither book nor file is provided
  if (!book && !file) {
    return null;
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      if (onDownloadStart) {
        const ok = await onDownloadStart();
        if (ok === false) return;
      }
    } catch {
      return;
    }

    setDownloading(true);

    try {
      // If a direct file URL is provided
      if (file) {
        await downloadFile(file.url, file.filename || file.url.split('/').pop());
      }
      // If a book object is provided (legacy support)
      else if (book) {
        if (book.downloadUrl) {
          // If book has a direct download URL
          await downloadFile(
            book.downloadUrl,
            book.downloadFilename || `${book.title.replace(/\s+/g, '_')}.${book.fileFormat || 'txt'}`
          );
        } else {
          // Fallback to generating a sample text file (original behavior)
          await generateSampleDownload(book);
        }
      }

      setDownloading(false);
      if (onDownloadComplete) onDownloadComplete();
    } catch (error) {
      setDownloading(false);
      console.error('Download failed:', error);
      if (onDownloadComplete) onDownloadComplete(error);
    }
  };

  const downloadFile = async (url, filename) => {
    // For same-origin URLs or data URLs, we can use the fetch API
    if (url.startsWith('data:') || url.startsWith(window.location.origin)) {
      const response = await fetch(url);
      const blob = await response.blob();
      triggerDownload(blob, filename);
    }
    // For external URLs, create a hidden anchor tag
    else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank'; // For cases where download attribute isn't supported
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
  };

  const generateSampleDownload = (book) => {
    const sampleContent = `${book.title} - Sample\nby ${book.author}\n\n${book.sampleText || 'No sample content available'}`;
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    triggerDownload(blob, `${book.title.replace(/\s+/g, '_')}_Sample.txt`);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (variant === 'full') {
    return (
      <FullDownloadButton
        onClick={handleDownload}
        disabled={downloading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Download ${book?.title || file?.filename || 'file'}`}
      >
        <FiDownload size={18} />
        {downloading ? downloadingText : downloadText}
      </FullDownloadButton>
    );
  }

  return (
    <IconDownloadButton
      onClick={handleDownload}
      disabled={downloading}
      title={`Download ${book?.title || file?.filename || 'file'}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Download ${book?.title || file?.filename || 'file'}`}
    >
      <FiDownload size={18} />
    </IconDownloadButton>
  );
};