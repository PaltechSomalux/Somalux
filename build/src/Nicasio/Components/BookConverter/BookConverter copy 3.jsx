import React, { useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { ConversionUtils } from './ConversionUtils';

export const BookConverter = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = async (acceptedFiles) => {  // Fixed typo here
    setStatus('Processing...');
    setError(null);
    setIsDragActive(false);

    const file = acceptedFiles[0];  // Fixed here to match parameter name
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }

    try {
      const pdfDoc = await ConversionUtils.createPdfDoc(file);

      if (file.type.startsWith('image/')) {
        await ConversionUtils.handleImageConversion(file, pdfDoc);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        await ConversionUtils.textToPdf(text, pdfDoc);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const success = await ConversionUtils.convertDocxToPdf(arrayBuffer, pdfDoc);
        if (!success) {
          throw new Error('Failed to convert Word document. Please try another file.');
        }
      } else {
        throw new Error('Unsupported file type. Use images (JPG/PNG), text files, or Word documents (.docx).');
      }

      await ConversionUtils.savePdf(pdfDoc);
      setStatus('Conversion successful! File downloaded.');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
      console.error(err);
    }
  };

  return (
    <div className="converter-container">
      <h2>Enhanced Document Converter</h2>
      <p>Upload an image (JPG/PNG), text file, or Word document (.docx) to convert to PDF.</p>
      <p><small>Converts with high fidelity, preserving original formatting, fonts, and quality.</small></p>

      <FileDropZone 
        onDrop={onDrop} 
        isDragActive={isDragActive}
        onDragEnter={() => setIsDragActive(true)}
        onDragLeave={() => setIsDragActive(false)}
      />

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      <style jsx>{`
        .converter-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .status {
          color: #4CAF50;
        }
        .error {
          color: #f44336;
        }
      `}</style>
    </div>
  );
};