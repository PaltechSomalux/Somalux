/**
 * pdfConfig.js - PDF.js Worker Configuration
 * 
 * CRITICAL: This file MUST be imported FIRST before any PDF operations
 * It initializes the PDF worker at app startup
 */

import { pdfjs } from 'react-pdf';

/**
 * Initialize PDF.js worker with reliable fallback chain
 */
export function initializePDFWorker() {
  // Skip if already configured
  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    console.log('✅ PDF worker already configured');
    return;
  }

  const pdfjsVersion = pdfjs.version;
  console.log('🔄 Initializing PDF worker for version:', pdfjsVersion);

  // Strategy 1: Try to use the worker from pdfjs-dist package
  try {
    const workerPath = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
    console.log('✅ PDF worker configured from package:', workerPath);
    return;
  } catch (e1) {
    console.warn('⚠️ Failed to load worker from package');
  }

  // Strategy 2: Try local public folder (production/build)
  try {
    const localPath = '/pdf.worker.min.mjs';
    // Pre-emptively set it and let the browser validate
    pdfjs.GlobalWorkerOptions.workerSrc = localPath;
    console.log('✅ PDF worker set to local path:', localPath);
    return;
  } catch (e2) {
    console.warn('⚠️ Failed to set local path');
  }

  // Strategy 3: CDN fallback
  try {
    const cdnPath = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = cdnPath;
    console.log('✅ PDF worker configured from CDN:', cdnPath);
    return;
  } catch (e3) {
    console.error('❌ All strategies failed');
    throw new Error('Could not initialize PDF worker');
  }
}

// Initialize immediately
initializePDFWorker();

export default initializePDFWorker;


