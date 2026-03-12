import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import axios from 'axios';


export const WordToPdf = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [file, setFile] = useState(null);

  // Sanitize text to replace unsupported characters
  const sanitizeText = (text) => {
    return text
      .replace(/\u2011/g, '-') // Non-breaking hyphen to regular hyphen
      .replace(/\u2013/g, '-') // En dash to hyphen
      .replace(/\u2014/g, '-') // Em dash to hyphen
      .replace(/\u0009/g, '    ') // Tab character (U+0009) to four spaces
      .replace(/[^\x00-\xFF]/g, ''); // Remove other non-WinAnsi characters as fallback
  };

  // High-fidelity conversion handled by backend (LibreOffice)

  const onDrop = useCallback(async (acceptedFiles) => {
    setStatus('');
    setError(null);
    setFileName('');
    setProgress(0);
    const f = acceptedFiles[0] || null;
    if (f && [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ].includes(f.type)) {
      setFile(f);
      setFileName(f.name);
    } else if (f) {
      setError('Please select a valid Word document (.doc or .docx)');
    }
  }, []);

  const handleConvert = useCallback(async () => {
    setStatus('Processing...');
    setError(null);
    setIsConverting(true);
    setProgress(0);
    try {
      if (!file) {
        throw new Error('No file selected');
      }
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:5000/convert-word-to-pdf', formData, {
        responseType: 'blob',
      });
      saveAs(response.data, `${file.name.replace(/\.[^/.]+$/, '')}.pdf`);
      setStatus('Conversion successful!');
      setProgress(100);
    } catch (err) {
      let msg = err?.message || 'Conversion failed';
      if (err?.response && err.response.data) {
        try {
          const data = err.response.data;
          if (typeof data === 'string') {
            msg = `${msg}`;
          } else if (data.error || data.detail) {
            msg = `${data.error || 'Error'}${data.detail ? `: ${data.detail}` : ''}`;
          }
        } catch {}
      }
      setError(`Conversion failed: ${msg}`);
      setStatus('');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  }, [file]);

  const cancelConversion = () => {
    setIsConverting(false);
    setStatus('');
    setError(null);
    setFileName('');
    setProgress(0);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
  });

  return (
    <div className="converter-container" role="region" aria-label="Word to PDF Converter">
      <h4>Word to PDF Converter</h4>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${error ? 'error' : ''}`}
        role="button"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="Upload Word document" />
        {isDragActive ? (
          <p>Drop the Word document here...</p>
        ) : (
          <p>Drag & drop a .doc or .docx file, or click to select (max 20MB)</p>
        )}
      </div>

      {fileName && (
        <div className="file-info">
          <p>Selected: {fileName}</p>
          {isConverting && (
            <button onClick={cancelConversion} className="cancel-button" aria-label="Cancel conversion">
              Cancel
            </button>
          )}
        </div>
      )}
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={handleConvert} disabled={!file || isConverting}>Convert</button>
      </div>

      {isConverting && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} className="progress-fill" />
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      {status && <p className="status success" role="alert">{status}</p>}
      {error && <p className="status error" role="alert">{error}</p>}
    </div>
  );
};