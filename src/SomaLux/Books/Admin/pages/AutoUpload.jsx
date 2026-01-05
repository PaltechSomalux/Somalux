import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFolder, FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiFile, FiBook, FiFileText, FiClock, FiPause, FiPlay } from 'react-icons/fi';
import { createBook, createBookSubmission, fetchCategories } from '../api';
import { getUniversitiesForDropdown, getFacultiesByUniversity, createPastPaper, createPastPaperSubmission, searchUnitFaculty, clearPastPapersCache, checkDuplicatePastPaper, logUploadHistory } from '../pastPapersApi';
import { extractPastPaperMetadata, findMatchingUniversity, findMatchingFaculty, guessFacultyFromUnitCode } from '../utils/extractPastPaperMetadata';
import * as pdfjsLib from 'pdfjs-dist';
import { useAdminUI } from '../AdminUIContext';

// Books Auto Upload Component
const BooksAutoUploadContent = ({ userProfile, asSubmission, showToast }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [categories, setCategories] = useState([]);
  const [canResume, setCanResume] = useState(false);
  const [resumeState, setResumeState] = useState(null);
  const [isResumingUpload, setIsResumingUpload] = useState(false);
  const folderInputRef = useRef(null);
  const uploadAbortRef = useRef(false);
  const pauseRef = useRef(false);
  const resumeIndexRef = useRef(0);
  const { showToast: uiShowToast } = useAdminUI();

  console.log('📱 [RENDER] BooksAutoUploadContent component rendered. canResume:', canResume);

  // Check if we have a paused upload in localStorage (for immediate UI rendering before state updates)
  const savedUploadState = (() => {
    try {
      const saved = localStorage.getItem('booksUploadState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.fileNames && state.fileNames.length > 0 && (state.paused || state.uploading)) {
          console.log('⚡ [QUICK CHECK] Paused upload detected in localStorage: ' + state.fileNames.length + ' files');
          return state;
        }
      }
    } catch (e) {
      console.error('⚡ [QUICK CHECK] Error checking localStorage:', e);
    }
    return null;
  })();

  useEffect(() => {
    // Configure PDF.js worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    // Fetch categories
    fetchCategories().then(cats => setCategories(cats || []));
    
    // Check for incomplete uploads
    checkForIncompleteUpload();
  }, []);

  const checkForIncompleteUpload = () => {
    console.log('🔍 [RESUME CHECK] Starting check for incomplete uploads...');
    
    const savedState = localStorage.getItem('booksUploadState');
    console.log('🔍 [RESUME CHECK] localStorage.booksUploadState exists:', !!savedState);
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('🔍 [RESUME CHECK] Parsed state:', {
          fileNames: state.fileNames?.length || 0,
          paused: state.paused,
          uploading: state.uploading,
          uploaded: state.uploaded,
          failed: state.failed,
          currentIndex: state.currentIndex,
          total: state.total,
          timestamp: new Date(state.timestamp).toLocaleString()
        });
        
        // Check if upload was incomplete (paused or in progress)
        if (state.fileNames && state.fileNames.length > 0 && (state.paused || state.uploading)) {
          console.log('✅ [RESUME CHECK] Incomplete upload found! Setting canResume = true');
          
          // RESTORE UI STATE FROM SAVED STATE
          setUploadProgress({ current: state.currentIndex + 1, total: state.total });
          setUploadedCount(state.uploaded);
          setFailedCount(state.failed);
          setDuplicatesCount(state.duplicates || 0);
          setUploading(true);  // ← SET THIS TO SHOW PROGRESS BAR AND PAUSE/RESUME BUTTONS
          console.log('📊 [RESUME CHECK] Restored UI state: uploaded=' + state.uploaded + ', failed=' + state.failed + ', total=' + state.total);
          
          // CRITICAL: If the upload was paused, set the pause ref so it stays paused on resume
          if (state.paused) {
            pauseRef.current = true;
            setPaused(true);  // ← SET THE PAUSED STATE SO UI REFLECTS IT
            console.log('🔒 [RESUME CHECK] Setting pauseRef.current = true AND paused state = true to keep upload paused');
          }
          setCanResume(true);
          setResumeState(state);
        } else {
          console.log('❌ [RESUME CHECK] No incomplete upload (condition not met)');
          console.log('  - fileNames exists:', !!state.fileNames);
          console.log('  - fileNames.length > 0:', state.fileNames?.length > 0);
          console.log('  - paused or uploading:', state.paused || state.uploading);
        }
      } catch (e) {
        console.error('❌ [RESUME CHECK] Error parsing saved upload state:', e);
        localStorage.removeItem('booksUploadState');
      }
    } else {
      console.log('❌ [RESUME CHECK] No saved state in localStorage');
    }
  };

  const saveUploadState = (files, progress, uploaded, failed, dupes, paused, uploading) => {
    const state = {
      fileNames: files.map(f => f.name),
      currentIndex: progress.current - 1,
      total: progress.total,
      uploaded,
      failed,
      duplicates: dupes,
      paused,
      uploading,
      timestamp: Date.now()
    };
    
    console.log('💾 [SAVE STATE] Saving upload state:', {
      files: state.fileNames.length,
      currentIndex: state.currentIndex,
      uploaded,
      failed,
      paused,
      uploading
    });
    
    try {
      localStorage.setItem('booksUploadState', JSON.stringify(state));
      console.log('✅ [SAVE STATE] Successfully saved to localStorage');
    } catch (error) {
      console.error('❌ [SAVE STATE] Failed to save to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        console.error('❌ [SAVE STATE] localStorage quota exceeded!');
      }
    }
  };

  const clearUploadState = () => {
    console.log('🗑️ [CLEAR STATE] Clearing upload state from localStorage');
    try {
      localStorage.removeItem('booksUploadState');
      console.log('✅ [CLEAR STATE] Successfully cleared');
    } catch (error) {
      console.error('❌ [CLEAR STATE] Failed to clear:', error);
    }
    setCanResume(false);
  };

  const internalShowToast = (message, type = 'info') => {
    showToast(message, type);
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
      internalShowToast('No PDF files found in selected folder', 'error');
      return;
    }

    setSelectedFiles(pdfFiles);
    
    // If resuming, check if these files match and skip already-uploaded ones
    if (isResumingUpload && resumeState) {
      const matchedFiles = pdfFiles.filter(f => resumeState.fileNames.includes(f.name));
      if (matchedFiles.length === 0) {
        internalShowToast('❌ Selected files do not match the upload to resume', 'error');
        return;
      }
      if (matchedFiles.length < resumeState.fileNames.length) {
        internalShowToast(`⚠️ Only found ${matchedFiles.length} of ${resumeState.fileNames.length} files. Upload will continue with available files.`, 'warning');
      }
      setSelectedFiles(matchedFiles);
      // SET THE RESUME INDEX FOR THE UPLOAD FUNCTION
      resumeIndexRef.current = resumeState.currentIndex + 1;
      console.log('📁 [RESUME MODE] Setting resumeIndexRef to:', resumeIndexRef.current, 'from saved currentIndex:', resumeState.currentIndex);
      internalShowToast(`✅ Found ${matchedFiles.length} files to resume upload (${resumeState.currentIndex + 1}/${resumeState.total} already processed)`, 'success');
    } else {
      internalShowToast(`Found ${pdfFiles.length} PDF files`, 'success');
    }
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
      internalShowToast('No PDF files found', 'error');
      return;
    }

    setSelectedFiles(files);
    internalShowToast(`Found ${files.length} PDF files`, 'success');
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      internalShowToast('No files selected', 'error');
      return;
    }

    console.log('🚀 [UPLOAD START] Starting upload with', selectedFiles.length, 'files');
    setUploading(true);
    setPaused(false);
    uploadAbortRef.current = false;
    pauseRef.current = false;
    
    // If resuming, restore counts from saved state
    const startFromIndex = resumeIndexRef.current;
    const initialUploaded = resumeState?.uploaded || 0;
    const initialFailed = resumeState?.failed || 0;
    const initialDupes = resumeState?.duplicates || 0;
    
    console.log('📊 [UPLOAD INIT] startFromIndex:', startFromIndex, 'initialUploaded:', initialUploaded);
    
    // Only reset progress if not resuming
    if (startFromIndex === 0) {
      setUploadProgress({ current: 0, total: selectedFiles.length });
      setUploadedCount(0);
      setFailedCount(0);
      setDuplicatesCount(0);
      setSkippedCount(0);
    } else {
      // Resuming: restore previous progress
      setUploadProgress({ current: startFromIndex, total: selectedFiles.length });
      setUploadedCount(initialUploaded);
      setFailedCount(initialFailed);
      setDuplicatesCount(initialDupes);
      internalShowToast(`Resuming from file ${startFromIndex + 1}/${selectedFiles.length}`, 'info');
    }

    let uploaded = initialUploaded;
    let failed = initialFailed;
    let duplicates = initialDupes;
    let skipped = 0;

    for (let i = startFromIndex; i < selectedFiles.length; i++) {
      // Check if upload was aborted
      if (uploadAbortRef.current) {
        clearUploadState();
        setUploading(false);
        internalShowToast('Upload cancelled', 'info');
        break;
      }

      // Check if paused and wait
      while (pauseRef.current && !uploadAbortRef.current) {
        // Save state while paused
        saveUploadState(selectedFiles, { current: i, total: selectedFiles.length }, uploaded, failed, duplicates, true, true);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const file = selectedFiles[i];
      console.log(`📄 [FILE ${i + 1}/${selectedFiles.length}] Starting upload of: ${file.name}`);
      setUploadProgress({ current: i + 1, total: selectedFiles.length });
      // Save progress
      saveUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates, false, true);

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
        console.log(`✅ [FILE DONE] Uploaded: ${file.name} (${uploaded}/${selectedFiles.length})`);
        setUploadedCount(uploaded);
        // SAVE PROGRESS AFTER EACH FILE COMPLETES
        saveUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates, false, true);
      } catch (error) {
        console.error(`❌ [FILE ERROR] Failed to upload ${file.name}:`, error);
        failed++;
        console.log(`❌ [FILE FAILED] Total failed count: ${failed}`);
        setFailedCount(failed);
        // SAVE PROGRESS AFTER FAILURE TOO
        saveUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates, false, true);
      }
    }

    console.log('🏁 [UPLOAD COMPLETE] Total uploaded:', uploaded, 'Total failed:', failed);
    clearUploadState();
    resumeIndexRef.current = 0;
    setIsResumingUpload(false);
    setResumeState(null);
    setUploading(false);
    setPaused(false);
    const message = `Upload complete: ${uploaded} successful, ${failed} failed`;
    internalShowToast(message, failed === 0 ? 'success' : 'info');
    
    // Clear selected files after upload
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadProgress({ current: 0, total: 0 });
    }, 2000);
  };

  const handlePause = () => {
    console.log('⏸️ [PAUSE CLICKED] User clicked pause button');
    console.log('📋 [PAUSE] Current state: uploaded=' + uploadedCount + ', failed=' + failedCount + ', progress=' + JSON.stringify(uploadProgress));
    pauseRef.current = true;
    setPaused(true);
    
    // CRITICAL: Save state immediately when pause is clicked
    console.log('💾 [PAUSE] Forcing save of upload state to localStorage');
    saveUploadState(selectedFiles, uploadProgress, uploadedCount, failedCount, duplicatesCount, true, true);
    
    internalShowToast('Upload paused', 'info');
  };

  const handleResume = async () => {
    console.log('▶️ [RESUME CLICKED] User clicked resume button');
    console.log('🎯 [RESUME] Starting upload from index:', resumeIndexRef.current);
    
    pauseRef.current = false;
    setPaused(false);
    
    // CRITICAL: Call uploadFiles() again to continue from saved index
    if (selectedFiles && selectedFiles.length > 0) {
      console.log('🚀 [RESUME] Calling uploadFiles() to continue from saved position');
      await uploadFiles(selectedFiles);
    }
    
    internalShowToast('Upload resumed', 'info');
  };

  const handleCancel = () => {
    console.log('❌ [CANCEL CLICKED] User clicked cancel button');
    uploadAbortRef.current = true;
    pauseRef.current = false;
    setUploading(false);
    setPaused(false);
    internalShowToast('Upload cancelled', 'info');
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadProgress({ current: 0, total: 0 });
    setUploadedCount(0);
    setFailedCount(0);
    setDuplicatesCount(0);
    setSkippedCount(0);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const progressPercent = (uploadProgress.total || savedUploadState?.total || 0) > 0 ? ((uploadProgress.current || savedUploadState?.currentIndex + 1 || 0) / (uploadProgress.total || savedUploadState?.total || 0)) * 100 : 0;
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
      {isResumingUpload && !selectedFiles.length ? (
        // Resuming - show instructions
        <div style={{
          border: '2px dashed #2196F3',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          background: 'rgba(33, 150, 243, 0.08)',
          marginBottom: '20px'
        }}>
          <FiRefreshCw size={40} style={{ color: '#2196F3', marginBottom: '12px' }} />
          <h3 style={{ color: '#e9edef', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
            Resume Upload
          </h3>
          <p style={{ color: '#8696a0', fontSize: '13px', margin: '0 0 16px 0' }}>
            Select the SAME folder to resume upload
          </p>
          {resumeState && (
            <div style={{
              background: '#1f2c33',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#8696a0',
              textAlign: 'left',
              maxWidth: '400px',
              margin: '0 auto 16px'
            }}>
              <div>📊 Previous Progress:</div>
              <div style={{ marginTop: '8px', color: '#00a884' }}>
                ✓ {resumeState.uploaded} uploaded
              </div>
              <div style={{ color: '#ea4335' }}>
                ✗ {resumeState.failed} failed
              </div>
              <div style={{ color: '#f1b233' }}>
                ⏭️ {resumeState.duplicates} duplicates
              </div>
              <div style={{ marginTop: '8px', color: '#2196F3' }}>
                📁 {resumeState.total - resumeState.currentIndex - 1} files remaining
              </div>
            </div>
          )}
          <button
            onClick={() => folderInputRef.current?.click()}
            style={{
              padding: '12px 24px',
              background: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiFolder size={16} />
            Select Folder to Resume
          </button>
        </div>
      ) : selectedFiles.length === 0 ? (
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
                Files ({selectedFiles.length > 0 ? selectedFiles.length : ((resumeState || savedUploadState)?.fileNames?.length || 0)}) • {selectedFiles.length > 0 ? totalSize.toFixed(1) : 'resuming...'} MB
              </div>
            </div>

            <div style={{
              maxHeight: '250px',
              overflowY: 'auto'
            }}>
              {selectedFiles.length > 0 ? (
                // Show actual files if selected
                selectedFiles.map((file, idx) => (
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
                ))
              ) : (resumeState || savedUploadState) && (resumeState || savedUploadState).fileNames ? (
                // Show saved file names if resuming a paused upload
                (resumeState || savedUploadState).fileNames.map((fileName, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderBottom: idx < resumeState.fileNames.length - 1 ? '1px solid #1f2c33' : 'none',
                      color: '#8696a0',
                      fontSize: '12px'
                    }}
                  >
                    <FiFile size={14} style={{ color: '#00a884', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileName}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Progress */}
          {(uploading || savedUploadState) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: '#8696a0',
                fontSize: '12px'
              }}>
                <span>Progress: {uploadProgress.current || (savedUploadState?.currentIndex + 1) || 0} / {uploadProgress.total || savedUploadState?.total || 0}</span>
                <span>✓ {uploadedCount || savedUploadState?.uploaded || 0} | ⏭️ {duplicatesCount || savedUploadState?.duplicates || 0} | ✗ {failedCount || savedUploadState?.failed || 0}</span>
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
              disabled={uploading || paused}
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
                  <FiRefreshCw style={{ animation: paused ? 'none' : 'spin 1s linear infinite' }} />
                  {paused ? 'Paused' : 'Uploading...'}
                </>
              ) : (
                <>
                  <FiUpload size={14} />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            {uploading && (
              <>
                {!paused ? (
                  <button
                    onClick={handlePause}
                    style={{
                      padding: '10px 16px',
                      background: '#f1b233',
                      color: '#1f2c33',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiPause size={14} />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    style={{
                      padding: '10px 16px',
                      background: '#00a884',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiPlay size={14} />
                    Resume
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '10px 16px',
                    background: '#ea4335',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiX size={14} />
                  Cancel
                </button>
              </>
            )}
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
            {canResume && !uploading && (
              <button
                onClick={() => {
                  setIsResumingUpload(true);
                  internalShowToast('📁 Please select the SAME folder to continue upload', 'info');
                }}
                style={{
                  padding: '10px 16px',
                  background: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiRefreshCw size={14} />
                Resume Previous
              </button>
            )}
          </div>
        </>
      )}

      {/* Results */}
      {(uploadedCount > 0 || duplicatesCount > 0 || failedCount > 0) && !uploading && (
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
            {duplicatesCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f1b233', fontSize: '20px', fontWeight: '600', marginBottom: '2px' }}>
                  {duplicatesCount}
                </div>
                <div style={{ color: '#8696a0', fontSize: '11px' }}>Skipped (Duplicates)</div>
              </div>
            )}
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
    </div>
  );
};

// Past Papers Auto Upload Component
const PastPapersAutoUploadContent = ({ userProfile, asSubmission, showToast }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [showOverride, setShowOverride] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [canResumePastPapers, setCanResumePastPapers] = useState(false);
  const [resumeStatePastPapers, setResumeStatePastPapers] = useState(null);
  const [isResumingPastPapersUpload, setIsResumingPastPapersUpload] = useState(false);
  const folderInputRef = useRef(null);
  const uploadAbortRef = useRef(false);
  const pauseRef = useRef(false);
  const resumeIndexRef = useRef(0);

  const internalShowToast = (message, type = 'info') => {
    showToast(message, type);
  };

  // localStorage helper functions for past papers
  const savePastPapersUploadState = (files, progress, uploaded, failed, dupes, paused = false, uploading = false) => {
    try {
      const state = {
        fileNames: files.map(f => f.name),
        currentIndex: progress.current - 1,
        total: progress.total,
        uploaded, failed, duplicates: dupes,
        paused, uploading,
        timestamp: Date.now()
      };
      localStorage.setItem('pastPapersUploadState', JSON.stringify(state));
      console.log('✅ [SAVE PAST PAPERS] Successfully saved to localStorage');
    } catch (error) {
      console.error('❌ [SAVE PAST PAPERS] Failed to save:', error);
    }
  };

  const clearPastPapersUploadState = () => {
    localStorage.removeItem('pastPapersUploadState');
  };

  const checkForIncompletePastPapersUpload = () => {
    console.log('🔍 [PAST PAPERS CHECK] Starting check for incomplete uploads...');
    const savedState = localStorage.getItem('pastPapersUploadState');
    console.log('🔍 [PAST PAPERS CHECK] localStorage exists:', !!savedState);
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('🔍 [PAST PAPERS CHECK] Parsed state:', {
          fileNames: state.fileNames?.length || 0,
          paused: state.paused,
          uploading: state.uploading,
          uploaded: state.uploaded,
          failed: state.failed,
          currentIndex: state.currentIndex,
          total: state.total
        });
        
        // Check if upload was incomplete (paused or in progress)
        if (state.fileNames && state.fileNames.length > 0 && (state.paused || state.uploading)) {
          console.log('✅ [PAST PAPERS CHECK] Incomplete upload found!');
          
          // RESTORE UI STATE
          setUploadProgress({ current: state.currentIndex + 1, total: state.total });
          setUploadedCount(state.uploaded);
          setFailedCount(state.failed);
          setDuplicatesCount(state.duplicates || 0);
          setUploading(true);
          console.log('📊 [PAST PAPERS CHECK] Restored UI: uploaded=' + state.uploaded + ', failed=' + state.failed);
          
          // If paused, keep it paused
          if (state.paused) {
            pauseRef.current = true;
            setPaused(true);
            console.log('🔒 [PAST PAPERS CHECK] Upload is paused, keeping paused');
          }
          
          setCanResumePastPapers(true);
          setResumeStatePastPapers(state);
        } else {
          console.log('❌ [PAST PAPERS CHECK] No incomplete upload found');
        }
      } catch (error) {
        console.error('❌ [PAST PAPERS CHECK] Error parsing state:', error);
      }
    }
  };

  // Load universities on mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        console.log('🔄 Loading universities...');
        const unis = await getUniversitiesForDropdown();
        console.log('✅ Universities loaded:', unis);
        setUniversities(unis);
      } catch (error) {
        console.error('❌ Failed to load universities:', error);
      }
    };
    loadUniversities();
    checkForIncompletePastPapersUpload();
  }, []);

  // Auto-resume incomplete past papers upload
  useEffect(() => {
    if (canResumePastPapers && !uploading && !isResumingPastPapersUpload) {
      console.log('🚀 [AUTO RESUME] Auto-triggering resume for past papers upload');
      setIsResumingPastPapersUpload(true);
      handleResumePastPapers();
    }
  }, [canResumePastPapers]);

  // Load faculties when university changes
  useEffect(() => {
    const loadFaculties = async () => {
      if (!university) {
        setFaculties([]);
        setFaculty('');
        return;
      }
      try {
        const facs = await getFacultiesByUniversity(university);
        setFaculties(facs);
        
        // If we have extracted faculty, try to match it
        if (extractedMetadata?.faculty && facs.length > 0) {
          const matchedFaculty = findMatchingFaculty(extractedMetadata.faculty, facs);
          if (matchedFaculty) {
            setFaculty(matchedFaculty);
            internalShowToast(`✓ Auto-filled: University & Faculty detected from PDF`, 'success');
          }
        }
      } catch (error) {
        console.error('Failed to load faculties:', error);
        setFaculties([]);
      }
    };
    loadFaculties();
  }, [university, extractedMetadata?.faculty]);

  // Auto-extract metadata from PDF and filename
  const autoExtractMetadata = async (pdfFile, unisList = null) => {
    try {
      console.log('🔄 Extracting metadata from PDF:', pdfFile.name);
      const pdfMetadata = await extractPastPaperMetadata(pdfFile);
      setExtractedMetadata(pdfMetadata);
      
      console.log('📄 Extracted from PDF:', pdfMetadata);

      // Use provided universities list or fallback to state
      const unis = unisList || universities;
      
      // Try to match university from PDF
      let matchedUniversityId = null;
      if (pdfMetadata.university && unis.length > 0) {
        console.log('🔍 Attempting to match university:', pdfMetadata.university);
        matchedUniversityId = findMatchingUniversity(pdfMetadata.university, unis);
        console.log('✅ Matched university ID:', matchedUniversityId);
        
        if (matchedUniversityId) {
          setUniversity(matchedUniversityId);
        }
      }

      // Try to match faculty if we found a university
      if (matchedUniversityId && pdfMetadata.faculty) {
        console.log('🔍 Attempting to match faculty:', pdfMetadata.faculty);
        try {
          const facs = await getFacultiesByUniversity(matchedUniversityId);
          if (facs.length > 0) {
            const matchedFaculty = findMatchingFaculty(pdfMetadata.faculty, facs);
            if (matchedFaculty) {
              setFaculty(matchedFaculty);
              console.log('✅ Matched faculty:', matchedFaculty);
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch faculties:', error);
        }
      }

      // Show success message regardless of extraction result
      internalShowToast('✅ Metadata extracted - ready to upload', 'success');
    } catch (error) {
      console.error('⚠️ Extraction error:', error);
      // Don't fail - allow upload with filename extraction
      internalShowToast('✅ Ready to upload (using filename extraction)', 'success');
    }
  };

  const handleFolderSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      internalShowToast('No PDF files found in selected folder', 'error');
      return;
    }

    setSelectedFiles(pdfFiles);
    internalShowToast(`Found ${pdfFiles.length} PDF files`, 'success');
    setShowOverride(false);
    
    // Ensure universities are loaded before extracting
    const performExtraction = async () => {
      let unis = universities;
      
      // If universities not yet loaded, wait and load them
      if (!unis || unis.length === 0) {
        console.log('⏳ Universities not loaded yet, loading now...');
        try {
          unis = await getUniversitiesForDropdown({ forceRefresh: true });
          console.log('✅ Universities loaded during extraction:', unis);
          setUniversities(unis);
        } catch (error) {
          console.error('❌ Failed to load universities during extraction:', error);
          internalShowToast('Failed to load universities - please try again', 'error');
          return;
        }
      }
      
      // Now extract with loaded universities
      autoExtractMetadata(pdfFiles[0], unis);
    };
    
    performExtraction();
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
      internalShowToast('No PDF files found', 'error');
      return;
    }

    setSelectedFiles(files);
    internalShowToast(`Found ${files.length} PDF files`, 'success');
    setShowOverride(false);
    
    // Ensure universities are loaded before extracting
    const performExtraction = async () => {
      let unis = universities;
      
      // If universities not yet loaded, wait and load them
      if (!unis || unis.length === 0) {
        console.log('⏳ Universities not loaded yet, loading now...');
        try {
          unis = await getUniversitiesForDropdown({ forceRefresh: true });
          console.log('✅ Universities loaded during extraction:', unis);
          setUniversities(unis);
        } catch (error) {
          console.error('❌ Failed to load universities during extraction:', error);
          internalShowToast('Failed to load universities - please try again', 'error');
          return;
        }
      }
      
      // Now extract with loaded universities
      autoExtractMetadata(files[0], unis);
    };
    
    performExtraction();
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      internalShowToast('No files selected', 'error');
      return;
    }

    setUploading(true);
    setPaused(false);
    uploadAbortRef.current = false;
    pauseRef.current = false;
    setUploadProgress({ current: 0, total: selectedFiles.length });
    setUploadedCount(0);
    setFailedCount(0);
    setDuplicatesCount(0);

    let uploaded = 0;
    let failed = 0;
    let duplicates = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      // Check if upload was aborted
      if (uploadAbortRef.current) {
        setUploading(false);
        internalShowToast('Upload cancelled', 'info');
        break;
      }

      // Check if paused and wait
      while (pauseRef.current && !uploadAbortRef.current) {
        // Save state while paused
        savePastPapersUploadState(selectedFiles, { current: i, total: selectedFiles.length }, uploaded, failed, duplicates);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });
      
      // Save initial progress
      savePastPapersUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates);
      
      let metadata = null; // Declare here so it's accessible in catch block

      try {
        // Extract metadata from filename
        // Expected formats:
        // 1. UNITCODE_UnitName_2023_1_Main.pdf (underscore-separated)
        // 2. CODE NUMBER MONTH YEAR.pdf (space-separated) e.g., "CHEM 212 JUNE 2019.pdf"
        const fileNameWithoutExt = file.name.replace('.pdf', '').trim();
        
        // Try underscore-separated format first
        let parts = fileNameWithoutExt.split('_');
        let unit_code = '';
        let unit_name = '';
        let year = '';
        let semester = '';
        let exam_type = '';
        
        console.log('📋 Parsing filename:', fileNameWithoutExt, 'Parts:', parts, 'Parts length:', parts.length);
        
        if (parts.length >= 2) {
          // Standard format: CODE_Name_Year_Sem_Type
          unit_code = parts[0] || '';
          unit_name = parts[1] || '';
          year = parts[2] || '';
          semester = parts[3] || '';
          exam_type = parts[4] || '';
          console.log('✅ Using underscore format - code:', unit_code, 'name:', unit_name, 'year:', year);
        } else {
          // Fallback: try to extract from space-separated filename: "CODE NUMBER MONTH YEAR" or "PREFIX CODE NUMBER MONTH YEAR"
          console.log('🔄 Trying space-separated parsing...');
          try {
            // Extract year first (most reliable) - look for 4-digit year
            const yearMatch = fileNameWithoutExt.match(/\b(19|20)\d{2}\b/);
            year = yearMatch ? yearMatch[0] : '';
            console.log('📅 Extracted year:', year);
            
            // Try to extract course code and numbers (handles DIP EDFO 0112, AGBM 0220, SOCI 104, etc.)
            // Matches: "DIP EDFO 0112", "AGBM 0220", "SOCI 104", "CODE123", etc.
            
            // First, try pattern with potential prefix: "WORD WORD DIGITS" or "WORD DIGITS"
            let codeMatch = fileNameWithoutExt.match(/\b([A-Z]{2,4})\s+(\d{3,4})\b/i);
            
            if (codeMatch) {
              // Found single code with numbers: "EDFO 0112"
              const letters = codeMatch[1];
              const numbers = codeMatch[2];
              
              unit_name = letters;
              unit_code = numbers;
              console.log('🔤 Extracted - Name:', unit_name, 'Code:', unit_code, 'from:', codeMatch[0]);
            } else {
              // Try pattern with prefix: "DIP EDFO" where EDFO is the real code
              codeMatch = fileNameWithoutExt.match(/\b([A-Z]{3})\s+([A-Z]{2,4})\s+(\d{3,4})\b/i);
              if (codeMatch) {
                // codeMatch[1] = prefix (e.g., "DIP")
                // codeMatch[2] = unit code letters (e.g., "EDFO")
                // codeMatch[3] = unit code numbers (e.g., "0112")
                const letters = codeMatch[2];
                const numbers = codeMatch[3];
                
                unit_name = letters;
                unit_code = numbers;
                console.log('🔤 Extracted with prefix - Prefix:', codeMatch[1], 'Name:', unit_name, 'Code:', unit_code, 'from:', codeMatch[0]);
              } else {
                // Last resort: just use the whole filename
                unit_name = fileNameWithoutExt;
                console.log('⚠️ Could not extract code, using filename as name:', unit_name);
              }
            }
          } catch (e) {
            console.warn('⚠️ Error parsing filename:', e);
            unit_name = fileNameWithoutExt;
          }
        }
        
        console.log('📊 Final parsed metadata:', { unit_code, unit_name, year, semester, exam_type });
        
        // EGERTON UNIVERSITY AUTO-DETECTION FOR PAPERS
        // If we have Egerton unit codes, automatically set Egerton University
        let selectedUniversity = university || null;
        
        // If no university selected, try to detect from unit code pattern
        if (!selectedUniversity) {
          // Check if this looks like an Egerton unit code
          const egerton_codes = new Set([
            'AGEC', 'AGBM', 'ANSC', 'APHY', 'CROP', 'HORT', 'SOIL', 'LPBP', 'DAIR', 'FOST', 'AENG', 'ENTM', 'AGRI',
            'ECON', 'BECO', 'STAT', 'LITL', 'ENGL', 'KISW', 'LINS', 'FREN', 'GERM', 'CRSS', 'SOCI', 'PSCS', 'PHIL', 'HIST', 'RELI', 'ANTH', 'LIBS', 'COMM',
            'BACT', 'BFIN', 'BOPM', 'BBIS', 'BMGT', 'BBAM', 'BCOM', 'PROC', 'ENTR', 'HRM', 'MARK',
            'AGED', 'ACDS', 'ADSN', 'CDEV', 'CIEM', 'BUST', 'EPSC', 'EDFO', 'EDUC', 'MENT', 'PSYC', 'GUID', 'COUN', 'ECD', 'SPEC',
            'AGEN', 'CEEN', 'ECEN', 'IEEN', 'MEEN', 'WREN', 'BENG', 'CENG', 'SENG', 'EENG', 'PENG', 'TENG', 'MENG', 'COMP', 'ICT', 'CSCI', 'DATA', 'SOFT', 'NETS',
            'ENVS', 'GEOG', 'NRES', 'FRST', 'DRLM', 'WILD', 'ECOT', 'WEM', 'LAND', 'ENVI', 'ENMS', 'CLEE', 'WRES', 'FRES', 'SWCO', 'CONS', 'NARE',
            'ANAT', 'PHYS', 'PATH', 'NURS', 'NUTR', 'COMH', 'REPH', 'PEDI', 'IMED', 'SURG', 'CLIN', 'EPID', 'MICB', 'MED', 'MEDS', 'PHAR', 'PHARM', 'CHEM', 'DENT', 'DRES', 'PUHE',
            'LAW', 'LLB', 'CLAW', 'PLAW', 'ILWA', 'LAWI', 'LAWS',
            'BIOL', 'ZOO', 'BOT', 'BCMB', 'ORGA', 'INOR', 'PHCH', 'MECH', 'ELEC', 'OPTI', 'BIO', 'ZOOL', 'ECOL', 'GENT', 'ALGE', 'CALC', 'GEOL', 'MING', 'GEOM',
            'VAPH', 'VMTP', 'VPMP', 'VETA', 'PARA', 'ANAV', 'VMED', 'VETS', 'VSUR', 'DVSO', 'VPAT', 'VPHE', 'DVET', 'VANA', 'VPHY'
          ]);
          
          const unitPrefix = unit_name.replace(/\d+/g, '').toUpperCase().trim();
          if (egerton_codes.has(unitPrefix)) {
            console.log('✅ Detected Egerton University from unit code:', unitPrefix);
            // Find Egerton University ID in the universities list
            const egerton = universities.find(u => u.name?.toLowerCase().includes('egerton'));
            if (egerton) {
              selectedUniversity = egerton.id;
              console.log('✅ Auto-set Egerton University ID:', selectedUniversity);
            }
          }
        }
        
        // Fallback: try extracted metadata university
        if (!selectedUniversity && extractedMetadata?.university) {
          selectedUniversity = findMatchingUniversity(extractedMetadata.university, universities);
          if (selectedUniversity) {
            console.log('✅ Using extracted university:', selectedUniversity);
          }
        }
        
        // Egerton-specific unit code to faculty mapping
        // ======================================================
        // EGERTON UNIVERSITY 2026 - VERIFIED UNIT CODES
        // 161 Verified Codes Across 10 Faculties
        // ======================================================
        const egerton_unit_mapping = {
          // ========== 1. FACULTY OF AGRICULTURE (FoA) - 13 codes ==========
          'AGEC': 'Agriculture', 'AGBM': 'Agriculture',
          'ANSC': 'Agriculture', 'APHY': 'Agriculture',
          'CROP': 'Agriculture', 'HORT': 'Agriculture',
          'SOIL': 'Agriculture', 'LPBP': 'Agriculture',
          'DAIR': 'Agriculture', 'FOST': 'Agriculture',
          'AENG': 'Agriculture', 'ENTM': 'Agriculture',
          'AGRI': 'Agriculture',
          
          // ========== 2. FACULTY OF ARTS & SOCIAL SCIENCES (FASS) - 18 codes ==========
          'ECON': 'FASS', 'BECO': 'FASS',
          'STAT': 'FASS', 'LITL': 'FASS',
          'ENGL': 'FASS', 'KISW': 'FASS',
          'LINS': 'FASS', 'FREN': 'FASS',
          'GERM': 'FASS', 'CRSS': 'FASS',
          'SOCI': 'FASS', 'PSCS': 'FASS',
          'PHIL': 'FASS', 'HIST': 'FASS',
          'RELI': 'FASS', 'ANTH': 'FASS',
          'LIBS': 'FASS', 'COMM': 'FASS',
          
          // ========== 3. FACULTY OF COMMERCE (FoC) - 11 codes ==========
          'BACT': 'Commerce', 'BFIN': 'Commerce',
          'BOPM': 'Commerce', 'BBIS': 'Commerce',
          'BMGT': 'Commerce', 'BBAM': 'Commerce',
          'BCOM': 'Commerce', 'PROC': 'Commerce',
          'ENTR': 'Commerce', 'HRM': 'Commerce',
          'MARK': 'Commerce',
          
          // ========== 4. FACULTY OF EDUCATION & COMMUNITY DEVELOPMENT STUDIES (FEDCOS) - 15 codes ==========
          'AGED': 'FEDCOS',
          'ACDS': 'FEDCOS',
          'ADSN': 'FEDCOS',
          'CDEV': 'FEDCOS',
          'CIEM': 'FEDCOS',
          'BUST': 'FEDCOS',
          'EPSC': 'FEDCOS',
          'EDFO': 'FEDCOS',
          'EDUC': 'FEDCOS',
          'MENT': 'FEDCOS',
          'PSYC': 'FEDCOS',
          'GUID': 'FEDCOS',
          'COUN': 'FEDCOS',
          'ECD': 'FEDCOS',
          'SPEC': 'FEDCOS',
          
          // ========== 5. FACULTY OF ENGINEERING & TECHNOLOGY (FET) - 20 codes ==========
          'AGEN': 'FET',
          'CEEN': 'FET',
          'ECEN': 'FET',
          'IEEN': 'FET',
          'MEEN': 'FET',
          'WREN': 'FET',
          'BENG': 'FET',
          'CENG': 'FET',
          'SENG': 'FET',
          'EENG': 'FET',
          'PENG': 'FET',
          'TENG': 'FET',
          'MENG': 'FET',
          'COMP': 'FET',
          'ICT': 'FET',
          'CSCI': 'FET',
          'DATA': 'FET',
          'SOFT': 'FET',
          'NETS': 'FET',
          
          // ========== 6. FACULTY OF ENVIRONMENT & RESOURCES DEVELOPMENT (FERD) - 17 codes ==========
          'ENVS': 'FERD',
          'GEOG': 'FERD',
          'NRES': 'FERD',
          'FRST': 'FERD',
          'DRLM': 'FERD',
          'WILD': 'FERD',
          'ECOT': 'FERD',
          'WEM': 'FERD',
          'LAND': 'FERD',
          'ENVI': 'FERD',
          'ENMS': 'FERD',
          'CLEE': 'FERD',
          'WRES': 'FERD',
          'FRES': 'FERD',
          'SWCO': 'FERD',
          'CONS': 'FERD',
          'NARE': 'FERD',
          
          // ========== 7. FACULTY OF HEALTH SCIENCES (FHS) - 21 codes ==========
          'ANAT': 'Health Sciences', 'PHYS': 'Health Sciences',
          'PATH': 'Health Sciences', 'NURS': 'Health Sciences',
          'NUTR': 'Health Sciences', 'COMH': 'Health Sciences',
          'REPH': 'Health Sciences', 'PEDI': 'Health Sciences',
          'IMED': 'Health Sciences', 'SURG': 'Health Sciences',
          'CLIN': 'Health Sciences', 'EPID': 'Health Sciences',
          'MICB': 'Health Sciences', 'MED': 'Health Sciences',
          'MEDS': 'Health Sciences', 'PHAR': 'Health Sciences',
          'PHARM': 'Health Sciences', 'CHEM': 'Health Sciences',
          'DENT': 'Health Sciences', 'DRES': 'Health Sciences',
          'PUHE': 'Health Sciences',
          
          // ========== 8. FACULTY OF LAW (FoL) - 7 codes ==========
          'LAW': 'Law', 'LLB': 'Law',
          'CLAW': 'Law', 'PLAW': 'Law',
          'ILWA': 'Law', 'LAWI': 'Law',
          'LAWS': 'Law',
          
          // ========== 9. FACULTY OF SCIENCE (FoS) - 25 codes ==========
          'BIOL': 'Science', 'ZOO': 'Science',
          'BOT': 'Science', 'BCMB': 'Science',
          'CHEM': 'Science', 'COMP': 'Science',
          'MATH': 'Science', 'STAT': 'Science',
          'PHYS': 'Science', 'MET': 'Science',
          'ORGA': 'Science', 'INOR': 'Science',
          'PHCH': 'Science', 'MECH': 'Science',
          'ELEC': 'Science', 'OPTI': 'Science',
          'BIO': 'Science', 'ZOOL': 'Science',
          'ECOL': 'Science', 'GENT': 'Science',
          'ALGE': 'Science', 'CALC': 'Science',
          'GEOL': 'Science', 'MING': 'Science',
          'GEOM': 'Science',
          
          // ========== 10. FACULTY OF VETERINARY MEDICINE & SURGERY (FVMS) - 15 codes ==========
          'VAPH': 'Veterinary Medicine and Surgery',
          'VMTP': 'Veterinary Medicine and Surgery',
          'VPMP': 'Veterinary Medicine and Surgery',
          'VETA': 'Veterinary Medicine and Surgery',
          'PARA': 'Veterinary Medicine and Surgery',
          'ANAV': 'Veterinary Medicine and Surgery',
          'VMED': 'Veterinary Medicine and Surgery',
          'VETS': 'Veterinary Medicine and Surgery',
          'VSUR': 'Veterinary Medicine and Surgery',
          'DVSO': 'Veterinary Medicine and Surgery',
          'VPAT': 'Veterinary Medicine and Surgery',
          'VPHE': 'Veterinary Medicine and Surgery',
          'DVET': 'Veterinary Medicine and Surgery',
          'VANA': 'Veterinary Medicine and Surgery',
          'VPHY': 'Veterinary Medicine and Surgery'
        };

        // EGERTON-ONLY STRICT DETECTION - EXACT MATCH ONLY
        const detectEgertonFaculty = (unitPrefix) => {
          if (!unitPrefix) return null;
          
          // ONLY EXACT MATCH
          const faculty = egerton_unit_mapping[unitPrefix];
          if (faculty) {
            console.log('✅ Egerton verified: "' + unitPrefix + '" → ' + faculty);
            return faculty;
          }
          
          console.log('❌ Unknown Egerton unit code: "' + unitPrefix + '"');
          return null;
        };
        
        // Faculty priority: extracted > Google Search > Semantic detection > code guessing > 'Unknown'
        let selectedFaculty = faculty || extractedMetadata?.faculty;
        
        // Try Google Search if faculty not found from PDF extraction
        if (!selectedFaculty && selectedUniversity && unit_code) {
          try {
            // Get university name from the universities list
            const universityObj = universities.find(u => u.id === selectedUniversity);
            if (universityObj?.name) {
              console.log('🔍 Searching Google for faculty of', unit_code, 'at', universityObj.name);
              const searchResult = await searchUnitFaculty(universityObj.name, unit_code, unit_name);
              
              if (searchResult?.faculty) {
                selectedFaculty = searchResult.faculty;
                console.log('🌐 Found faculty via Google Search:', selectedFaculty);
              } else {
                console.log('ℹ️ Google Search did not find faculty, trying smart Egerton detection');
              }
            }
          } catch (error) {
            console.warn('⚠️ Google Search failed, trying smart Egerton detection:', error);
          }
        }
        
        // Fallback: Try Egerton strict detection (exact match only)
        if (!selectedFaculty && unit_name) {
          const unitPrefix = unit_name.replace(/\d+/g, '').toUpperCase().trim();
          selectedFaculty = detectEgertonFaculty(unitPrefix);
          
          if (!selectedFaculty) {
            console.log('⚠️ Egerton strict mode: Unknown unit code "' + unitPrefix + '", marking for manual review');
          }
        }
        
        // Fallback: Try to guess faculty from unit code/name
        if (!selectedFaculty && unit_name) {
          selectedFaculty = guessFacultyFromUnitCode(unit_code, unit_name);
          if (selectedFaculty) {
            console.log('🎯 Guessed faculty from unit code:', selectedFaculty);
          }
        }
        
        selectedFaculty = selectedFaculty || 'Unknown';
        
        // CRITICAL: Ensure university_id is NEVER null by defaulting to Egerton if undetected
        let finalUniversity = selectedUniversity;
        if (!finalUniversity && universities.length > 0) {
          // Default to Egerton University if no university detected
          const egerton = universities.find(u => u.name?.toLowerCase().includes('egerton'));
          if (egerton) {
            finalUniversity = egerton.id;
            console.log('⚠️ No university detected, defaulting to Egerton:', egerton.id);
          } else {
            // If Egerton not found, use the first university in the list
            finalUniversity = universities[0]?.id;
            console.log('⚠️ No university detected, using first available:', universities[0]?.name, finalUniversity);
          }
        }
        
        metadata = {
          university_id: finalUniversity || null,
          faculty: selectedFaculty,
          unit_code: unit_code || extractedMetadata?.unitCode || '',
          unit_name: unit_name || extractedMetadata?.unitName || '',
          year: (year && !isNaN(year)) ? Number(year) : (extractedMetadata?.year || new Date().getFullYear()),
          semester: semester || extractedMetadata?.semester || '',
          exam_type: exam_type || extractedMetadata?.examType || 'Main',
          uploaded_by: userProfile?.id || userProfile?.uid || null
        };

        console.log('📤 Uploading with metadata:', { 
          fileName: file.name, 
          universityId: metadata.university_id,
          faculty: metadata.faculty,
          unitCode: metadata.unit_code,
          unitName: metadata.unit_name,
          year: metadata.year,
          semester: metadata.semester,
          examType: metadata.exam_type
        });

        // Use the proper API function instead of direct fetch
        // This ensures data is saved with correct field names to the database
        console.log('📤 Using createPastPaper API to upload:', {
          fileName: file.name,
          metadata: {
            title: `${metadata.unit_code} - ${metadata.unit_name}`,
            university_id: metadata.university_id,
            faculty: metadata.faculty,
            unit_code: metadata.unit_code,
            unit_name: metadata.unit_name,
            year: metadata.year,
            semester: metadata.semester,
            exam_type: metadata.exam_type
          }
        });

        // CHECK FOR DUPLICATES BEFORE UPLOADING
        console.log('🔍 Checking for duplicate papers...');
        const duplicateCheck = await checkDuplicatePastPaper({
          universityId: metadata.university_id,
          faculty: metadata.faculty,
          unitCode: metadata.unit_code,
          unitName: metadata.unit_name,
          year: metadata.year
        });

        if (duplicateCheck.exists) {
          console.log('⚠️ DUPLICATE DETECTED - Paper already exists!', duplicateCheck.paper);
          
          // Log duplicate to history
          await logUploadHistory({
            fileName: file.name,
            status: 'duplicate',
            paperTitle: `${metadata.unit_code} - ${metadata.unit_name}`,
            universityId: metadata.university_id,
            faculty: metadata.faculty,
            unitCode: metadata.unit_code,
            unitName: metadata.unit_name,
            year: metadata.year,
            uploadedBy: userProfile?.id,
            isDuplicate: true
          });
          
          duplicates++;
          setDuplicatesCount(duplicates);
          internalShowToast(`⏭️ Skipped "${file.name}" - Paper already uploaded (${duplicateCheck.paper.unit_code} ${duplicateCheck.paper.unit_name} ${duplicateCheck.paper.year})`, 'warning');
          continue; // Skip to next file
        }

        console.log('✅ No duplicate found, proceeding with upload...');

        const uploadFunction = asSubmission ? createPastPaperSubmission : createPastPaper;
        const pastPaperRecord = await uploadFunction({
          metadata: {
            title: `${metadata.unit_code} - ${metadata.unit_name}`,
            university_id: metadata.university_id,
            faculty: metadata.faculty,
            unit_code: metadata.unit_code,
            unit_name: metadata.unit_name,
            year: metadata.year,
            semester: metadata.semester,
            exam_type: metadata.exam_type
          },
          pdfFile: file
        });

        console.log(`✅ Uploaded successfully:`, { fileName: file.name, pastPaperId: pastPaperRecord?.id });

        // Log successful upload to history
        await logUploadHistory({
          fileName: file.name,
          status: 'success',
          paperTitle: `${metadata.unit_code} - ${metadata.unit_name}`,
          universityId: metadata.university_id,
          faculty: metadata.faculty,
          unitCode: metadata.unit_code,
          unitName: metadata.unit_name,
          year: metadata.year,
          uploadedBy: userProfile?.id
        });

        uploaded++;
        setUploadedCount(uploaded);
        console.log(`✅ Uploaded: ${file.name}`);
        
        // Save progress to localStorage
        savePastPapersUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates);
        
        // Clear past papers cache so newly uploaded papers appear immediately
        try { clearPastPapersCache(); } catch (e) {}
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        console.error('Error details:', { 
          message: error?.message, 
          code: error?.code,
          stack: error?.stack
        });

        // Log failed upload to history
        await logUploadHistory({
          fileName: file.name,
          status: 'failed',
          paperTitle: `${metadata.unit_code} - ${metadata.unit_name}`,
          universityId: metadata.university_id,
          faculty: metadata.faculty,
          unitCode: metadata.unit_code,
          unitName: metadata.unit_name,
          year: metadata.year,
          uploadedBy: userProfile?.id,
          errorMessage: error?.message || 'Unknown error'
        }).catch(err => console.error('Failed to log error history:', err));

        failed++;
        setFailedCount(failed);
        
        // Save progress to localStorage even on failure
        savePastPapersUploadState(selectedFiles, { current: i + 1, total: selectedFiles.length }, uploaded, failed, duplicates);
      }
    }

    setUploading(false);
    
    // Clear localStorage when upload completes
    clearPastPapersUploadState();
    
    // Final cache clear to ensure all new papers are visible
    try { clearPastPapersCache(); } catch (e) {}
    
    let message = `Upload complete: ${uploaded} successful, ${duplicates} duplicates skipped, ${failed} failed`;
    if (failed > 0) {
      message += ' ❌ Check browser console for error details';
    }
    const messageType = failed === 0 ? 'success' : (duplicates > 0 ? 'warning' : 'error');
    internalShowToast(message, messageType);
    
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      setUniversity('');
      setFaculty('');
      setExtractedMetadata(null);
      setShowOverride(false);
    }, 2000);
  };

  const handlePausePastPapers = () => {
    console.log('⏸️ [PAST PAPERS PAUSE] User clicked pause button');
    console.log('📋 [PAST PAPERS PAUSE] Current state: uploaded=' + uploadedCount + ', failed=' + failedCount + ', progress=' + JSON.stringify(uploadProgress));
    pauseRef.current = true;
    setPaused(true);
    
    // CRITICAL: Save state immediately when pause is clicked
    console.log('💾 [PAST PAPERS PAUSE] Forcing save of upload state to localStorage');
    savePastPapersUploadState(selectedFiles, uploadProgress, uploadedCount, failedCount, duplicatesCount, true, true);
    
    internalShowToast('Upload paused', 'info');
  };

  const handleResumePastPapers = async () => {
    console.log('▶️ [PAST PAPERS RESUME] User clicked resume button');
    console.log('🎯 [PAST PAPERS RESUME] Starting upload from index:', resumeIndexRef.current);
    
    pauseRef.current = false;
    setPaused(false);
    
    // CRITICAL: Call uploadFiles() again to continue from saved index
    if (selectedFiles && selectedFiles.length > 0) {
      console.log('🚀 [PAST PAPERS RESUME] Calling uploadFiles() to continue');
      await uploadFiles();
    }
    
    internalShowToast('Upload resumed', 'info');
  };

  const handleCancelPastPapers = () => {
    uploadAbortRef.current = true;
    pauseRef.current = false;
    setUploading(false);
    setPaused(false);
    internalShowToast('Upload cancelled', 'info');
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadProgress({ current: 0, total: 0 });
    setUploadedCount(0);
    setFailedCount(0);
    setUniversity('');
    setFaculty('');
    setExtractedMetadata(null);
    setShowOverride(false);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // Check if we have a paused upload in localStorage (for immediate UI rendering before state updates)
  const savedPastPapersState = (() => {
    try {
      const saved = localStorage.getItem('pastPapersUploadState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.fileNames && state.fileNames.length > 0 && (state.paused || state.uploading)) {
          console.log('⚡ [PAST PAPERS QUICK CHECK] Paused upload detected: ' + state.fileNames.length + ' files');
          return state;
        }
      }
    } catch (e) {
      console.error('⚡ [PAST PAPERS QUICK CHECK] Error:', e);
    }
    return null;
  })();

  const progressPercent = (uploadProgress.total || savedPastPapersState?.total || 0) > 0 ? ((uploadProgress.current || savedPastPapersState?.currentIndex + 1 || 0) / (uploadProgress.total || savedPastPapersState?.total || 0)) * 100 : 0;
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#e9edef', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Bulk Upload Past Papers from Folder
        </h2>
        <p style={{ color: '#8696a0', fontSize: '13px', margin: '0' }}>
          Select a folder to upload multiple past papers with automatic metadata extraction
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
      {selectedFiles.length === 0 && !canResumePastPapers ? (
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
            Choose a folder with past paper PDF files
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
      ) : canResumePastPapers && selectedFiles.length === 0 ? (
        // Resume Previous Upload Section
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
                Files ({(resumeStatePastPapers || savedPastPapersState)?.fileNames?.length || 0}) • resuming...
              </div>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {(resumeStatePastPapers || savedPastPapersState) && (resumeStatePastPapers || savedPastPapersState).fileNames ? (
                (resumeStatePastPapers || savedPastPapersState).fileNames.map((fileName, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: '1px solid #1f2c33',
                      color: '#8696a0',
                      fontSize: '12px'
                    }}
                  >
                    <FiFile size={14} style={{ marginRight: '8px', color: '#00a884' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileName}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Progress */}
          {(uploading || savedPastPapersState) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: '#8696a0',
                fontSize: '12px'
              }}>
                <span>Progress: {uploadProgress.current || (savedPastPapersState?.currentIndex + 1) || 0} / {uploadProgress.total || savedPastPapersState?.total || 0}</span>
                <span>✓ {uploadedCount || savedPastPapersState?.uploaded || 0} | ⏭️ {duplicatesCount || savedPastPapersState?.duplicates || 0} | ✗ {failedCount || savedPastPapersState?.failed || 0}</span>
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

          {/* Resume Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleResumePastPapers}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#00a884',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FiPlay size={14} />
              Resume Previous Upload
            </button>
            <button
              onClick={handleCancelPastPapers}
              style={{
                padding: '10px 16px',
                background: '#374151',
                color: '#e9edef',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear
            </button>
          </div>
        </>
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
                Files ({selectedFiles.length > 0 ? selectedFiles.length : ((resumeStatePastPapers || savedPastPapersState)?.fileNames?.length || 0)}) • {selectedFiles.length > 0 ? totalSize.toFixed(1) : 'resuming...'} MB
              </div>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: '1px solid #1f2c33',
                      color: '#8696a0',
                      fontSize: '12px'
                    }}
                  >
                    <FiFile size={14} style={{ marginRight: '8px', color: '#00a884' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ marginLeft: '8px', color: '#374151' }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ))
              ) : (resumeStatePastPapers || savedPastPapersState) && (resumeStatePastPapers || savedPastPapersState).fileNames ? (
                (resumeStatePastPapers || savedPastPapersState).fileNames.map((fileName, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: '1px solid #1f2c33',
                      color: '#8696a0',
                      fontSize: '12px'
                    }}
                  >
                    <FiFile size={14} style={{ marginRight: '8px', color: '#00a884' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileName}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Progress */}
          {(uploading || savedPastPapersState) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: '#8696a0',
                fontSize: '12px'
              }}>
                <span>Progress: {uploadProgress.current || (savedPastPapersState?.currentIndex + 1) || 0} / {uploadProgress.total || savedPastPapersState?.total || 0}</span>
                <span>✓ {uploadedCount || savedPastPapersState?.uploaded || 0} | ⏭️ {duplicatesCount || savedPastPapersState?.duplicates || 0} | ✗ {failedCount || savedPastPapersState?.failed || 0}</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#1f2c33',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: '#00a884',
                  transition: 'width 0.3s'
                }} />
              </div>
              {uploadedCount > 0 && (
                <div style={{
                  marginTop: '8px',
                  color: '#00a884',
                  fontSize: '12px'
                }}>
                  ✓ {uploadedCount} uploaded
                </div>
              )}
              {failedCount > 0 && (
                <div style={{
                  marginTop: '4px',
                  color: '#ea4335',
                  fontSize: '12px'
                }}>
                  ✗ {failedCount} failed
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {!uploading && !savedPastPapersState && (
              <>
                <button
                  onClick={uploadFiles}
                  disabled={selectedFiles.length === 0}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: selectedFiles.length === 0 ? '#374151' : '#00a884',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                >
                  🚀 Upload {selectedFiles.length} Files
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: '10px 16px',
                    background: '#374151',
                    color: '#e9edef',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </>
            )}
            {(uploading || savedPastPapersState) && (
              <>
                <button
                  disabled={true}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: uploading ? '#00a88466' : '#374151',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: uploading ? 0.6 : 1
                  }}
                >
                  <FiRefreshCw style={{ animation: paused ? 'none' : 'spin 1s linear infinite' }} />
                  {paused ? 'Paused' : 'Uploading...'}
                </button>
                {!paused ? (
                  <button
                    onClick={handlePausePastPapers}
                    style={{
                      padding: '10px 16px',
                      background: '#f1b233',
                      color: '#1f2c33',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiPause size={14} />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumePastPapers}
                    style={{
                      padding: '10px 16px',
                      background: '#00a884',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FiPlay size={14} />
                    Resume
                  </button>
                )}
                <button
                  onClick={handleCancelPastPapers}
                  style={{
                    padding: '10px 16px',
                    background: '#ea4335',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiX size={14} />
                  Cancel
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        background: '#1f2c33',
        border: '1px solid #374151',
        borderRadius: '6px',
        color: '#8696a0',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <strong style={{ color: '#e9edef' }}>🤖 Fully Automatic Extraction:</strong>
        <br />
        ✅ <strong>No manual selection needed!</strong> Just select folder and upload
        <br />
        ✓ University & Faculty automatically extracted from PDF text
        <br />
        ✓ Unit Code, Year, Semester automatically extracted from filename: <code style={{ background: '#0b141a', padding: '2px 4px', borderRadius: '3px' }}>UNITCODE_Name_2023_1_Main.pdf</code>
        <br />
        ✓ If PDF extraction fails, filename extraction is used as fallback
        <br />
        <br />
        <strong>Best Results:</strong> Include "University Name" and "Faculty Name" on the first page of your PDF
      </div>
    </div>
  );
};

// Main TabContainer Component
const AutoUpload = ({ userProfile, asSubmission = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'pastpapers'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const tabStyles = `
    .autoupload-tabs-container {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 2px solid #374151;
    }
    .autoupload-tab-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: transparent;
      border: none;
      color: #8696a0;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      transition: all 0.3s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
    }
    .autoupload-tab-button:hover {
      color: #e9edef;
      background: rgba(0, 168, 132, 0.05);
    }
    .autoupload-tab-button.active {
      color: #00a884;
      border-bottom-color: #00a884;
    }
  `;

  return (
    <>
      <style>{tabStyles}</style>
      
      <div className="panel">
        {/* Tab Buttons and History Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="autoupload-tabs-container">
            <button
              className={`autoupload-tab-button ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              <FiBook size={18} />
              Books Auto Upload
            </button>
            <button
              className={`autoupload-tab-button ${activeTab === 'pastpapers' ? 'active' : ''}`}
              onClick={() => setActiveTab('pastpapers')}
            >
              <FiFileText size={18} />
              Past Papers Auto Upload
            </button>
          </div>
          <button
            onClick={() => navigate('/books/admin/upload-history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#0a1419',
              color: '#e9edef',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#121f28';
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#0a1419';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.4)';
            }}
          >
            <FiClock size={16} />
            History
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '20px' }}>
          {activeTab === 'books' && (
            <BooksAutoUploadContent userProfile={userProfile} asSubmission={asSubmission} showToast={showToast} />
          )}
          {activeTab === 'pastpapers' && (
            <PastPapersAutoUploadContent userProfile={userProfile} asSubmission={asSubmission} showToast={showToast} />
          )}
        </div>
      </div>

      {/* Global Toast */}
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
          zIndex: 10001,
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
    </>
  );
};

export default AutoUpload;
