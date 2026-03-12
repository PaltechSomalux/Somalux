import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import mammoth from 'mammoth';

export const WordToPdf = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const convertDocxToPdf = async (arrayBuffer) => {
    try {
      // First convert DOCX to HTML using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Then create a simple PDF document from the text
      const { PDFDocument, rgb } = require('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      const fontSize = 12;
      const margin = 50;
      
      page.drawText(text, {
        x: margin,
        y: height - margin - fontSize,
        size: fontSize,
        color: rgb(0, 0, 0),
        lineHeight: fontSize * 1.2,
        maxWidth: width - margin * 2,
      });
      
      return await pdfDoc.save();
    } catch (err) {
      throw new Error('Failed to convert document: ' + err.message);
    }
  };

  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);
    setFileName('');

    try {
      const file = acceptedFiles[0];
      if (!file || !file.name.match(/\.(docx|doc)$/i)) {
        throw new Error('Please select a valid Word document (DOCX or DOC)');
      }

      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert to PDF
      const pdfBytes = await convertDocxToPdf(arrayBuffer);

      // Save the PDF
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf`);
      setStatus('Conversion successful!');
    } catch (err) {
      setError(`Conversion failed: ${err.message}`);
      setStatus('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="converter-container">
      <h4>Word to PDF </h4>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Word document here...</p>
        ) : (
          <p>Drag & drop a DOCX/DOC file, or click to select</p>
        )}
      </div>
      
      {fileName && <p className="file-info">Processing: {fileName}</p>}
      {status && <p className="status success">{status}</p>}
      {error && <p className="status error">{error}</p>}

      
    </div>
  );
};