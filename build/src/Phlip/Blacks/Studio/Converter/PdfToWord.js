import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import './PdfToWord.css';
import axios from 'axios';

export const PdfToWord = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    setStatus('');
    setError(null);
    setFileName('');
    const f = acceptedFiles[0] || null;
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setFileName(f.name);
    } else if (f) {
      setError('Please select a valid PDF file');
    }
  };

  const handleConvert = async () => {
    setStatus('Processing...');
    setError(null);
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:5000/convert-pdf-to-word', formData, {
        responseType: 'blob',
      });
      const outputFileName = file.name.replace(/\.pdf$/i, '.docx');
      saveAs(response.data, outputFileName);
      setStatus('Conversion successful!');
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
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="converter-container">
      <h4>PDF to Word</h4>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF here...</p>
        ) : (
          <p>Drag & drop a PDF file, or click to select</p>
        )}
      </div>

      {fileName && <p className="file-info">Selected: {fileName}</p>}
      <div style={{ marginTop: 12 }}>
        <button onClick={handleConvert} disabled={!file}>Convert</button>
      </div>
      {status && <p className="status success">{status}</p>}
      {error && <p className="status error">{error}</p>}
    </div>
  );
};