import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiFolder, FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiFile } from 'react-icons/fi';
import { createBook, createBookSubmission, fetchCategories } from '../api';
import * as pdfjsLib from 'pdfjs-dist';
import { useAdminUI } from '../AdminUIContext';

const AutoUpload = ({ userProfile, asSubmission = false }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState([]);
  const folderInputRef = useRef(null);
  const { showToast: uiShowToast } = useAdminUI();

  useEffect(() => {
    // Configure PDF.js worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    // Fetch categories
    fetchCategories().then(cats => setCategories(cats || []));
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const extractCoverFromPDF = async (pdfFile) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdfDoc.numPages > 0) {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const coverFile = new File([blob], `${pdfFile.name.replace('.pdf', '')}_cover.png`, { type: 'image/png' });
              resolve(coverFile);
            } else {
              resolve(null);
            }
          }, 'image/png', 0.95);
        });
      }
    } catch (error) {
      console.error('Error extracting cover:', error);
    }
    return null;
  };

  const extractBasicMetadataFromName = (fileName) => {
    // Try to extract title from filename
    const name = fileName.replace('.pdf', '').trim();
    return {
      title: name.length > 3 ? name : '',
      author: '',
      description: '',
      category_id: null,
      year: null,
      language: 'English',
      isbn: '',
      pages: 0,
      publisher: ''
    };
  };

  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      showToast('No PDF files found in selected folder', 'error');
      return;
    }

    setSelectedFiles(pdfFiles);
    showToast(`Found ${pdfFiles.length} PDF files`, 'success');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    // Handle dropped files/folders
    const items = e.dataTransfer.items;
    const files = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file.name.toLowerCase().endsWith('.pdf')) {
            files.push(file);
          }
        }
      }
    }

    if (files.length === 0) {
      showToast('No PDF files found', 'error');
      return;
    }

    setSelectedFiles(files);
    showToast(`Found ${files.length} PDF files`, 'success');
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      showToast('No files selected', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });
    setUploadedCount(0);
    setFailedCount(0);
    setSkippedCount(0);

    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });

      try {
        // Extract cover
        const cover = await extractCoverFromPDF(file);

        // Extract basic metadata from filename
        const metadata = extractBasicMetadataFromName(file.name);

        // Determine if user is admin
        const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'editor';

        // Upload
        if (isAdmin) {
          await createBook({ metadata, pdfFile: file, coverFile: cover });
        } else {
          await createBookSubmission({ metadata, pdfFile: file, coverFile: cover });
        }

        uploaded++;
        setUploadedCount(uploaded);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        failed++;
        setFailedCount(failed);
      }
    }

    setUploading(false);
    const message = `Upload complete: ${uploaded} successful, ${failed} failed`;
    showToast(message, failed === 0 ? 'success' : 'info');
    
    // Clear selected files after upload
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadProgress({ current: 0, total: 0 });
    }, 2000);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadProgress({ current: 0, total: 0 });
    setUploadedCount(0);
    setFailedCount(0);
    setSkippedCount(0);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const progressPercent = uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0;
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#e9edef', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Bulk Upload from Folder
        </h2>
        <p style={{ color: '#8696a0', fontSize: '13px', margin: '0' }}>
          Select a folder to upload multiple PDF files at once
        </p>
      </div>

      {asSubmission && (
        <div style={{
          marginBottom: '15px',
          padding: '10px 12px',
          background: '#1f2c33',
          border: '1px solid #00a884',
          borderRadius: '6px',
          color: '#00a884',
          fontSize: '12px'
        }}>
          📋 Your uploads will be reviewed and appear after approval
        </div>
      )}

      {/* Main Content */}
      {selectedFiles.length === 0 ? (
        // Upload Area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => folderInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#00a884' : '#374151'}`,
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(0, 168, 132, 0.08)' : '#0b141a',
            transition: 'all 0.2s'
          }}
        >
          <FiFolder size={40} style={{ color: '#00a884', marginBottom: '12px' }} />
          <h3 style={{ color: '#e9edef', fontSize: '16px', fontWeight: '500', margin: '0 0 4px 0' }}>
            Select Folder or Drag & Drop
          </h3>
          <p style={{ color: '#8696a0', fontSize: '13px', margin: '0' }}>
            Choose a folder with PDF files
          </p>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory="true"
            directory=""
            multiple
            onChange={handleFolderSelect}
            style={{ display: 'none' }}
            accept=".pdf"
          />
        </div>
      ) : (
        <>
          {/* File List */}
          <div style={{
            background: '#0b141a',
            border: '1px solid #1f2c33',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1f2c33',
              background: '#0b141a'
            }}>
              <div style={{ color: '#e9edef', fontSize: '13px', fontWeight: '500' }}>
                Files ({selectedFiles.length}) • {totalSize.toFixed(1)} MB
              </div>
            </div>

            <div style={{
              maxHeight: '250px',
              overflowY: 'auto'
            }}>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderBottom: idx < selectedFiles.length - 1 ? '1px solid #1f2c33' : 'none',
                    color: '#8696a0',
                    fontSize: '12px'
                  }}
                >
                  <FiFile size={14} style={{ color: '#00a884', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: '#8696a0', fontSize: '11px', flexShrink: 0 }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: '#8696a0',
                fontSize: '12px'
              }}>
                <span>Progress: {uploadProgress.current} / {uploadProgress.total}</span>
                <span>✓ {uploadedCount} | ✗ {failedCount}</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#1f2c33',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: '#00a884',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={uploadFiles}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: uploading ? '#00a88466' : '#00a884',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: uploading ? 0.6 : 1
              }}
            >
              {uploading ? (
                <>
                  <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload size={14} />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            <button
              onClick={clearSelection}
              disabled={uploading}
              style={{
                padding: '10px 16px',
                background: '#1f2c33',
                color: '#8696a0',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: uploading ? 0.5 : 1
              }}
            >
              <FiX size={14} />
              Clear
            </button>
          </div>
        </>
      )}

      {/* Results */}
      {(uploadedCount > 0 || failedCount > 0) && !uploading && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#0b141a',
          border: `1px solid ${failedCount === 0 ? '#00a884' : '#f1b233'}`,
          borderRadius: '8px'
        }}>
          <div style={{ color: '#e9edef', fontSize: '13px', fontWeight: '500', marginBottom: '12px' }}>
            Upload Complete
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00a884', fontSize: '20px', fontWeight: '600', marginBottom: '2px' }}>
                {uploadedCount}
              </div>
              <div style={{ color: '#8696a0', fontSize: '11px' }}>Uploaded</div>
            </div>
            {failedCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ea4335', fontSize: '20px', fontWeight: '600', marginBottom: '2px' }}>
                  {failedCount}
                </div>
                <div style={{ color: '#8696a0', fontSize: '11px' }}>Failed</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          maxWidth: '300px',
          width: 'calc(100% - 40px)',
          background: toast.type === 'error' ? '#ea4335' : toast.type === 'success' ? '#00a884' : '#374151',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '6px',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AutoUpload;
