import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

export const ImageToPdf = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    setStatus('');
    setError(null);
    const f = acceptedFiles[0] || null;
    setFile(f);
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
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      if (file.type.startsWith('image/')) {
        const imageBytes = await file.arrayBuffer();
        let image;

        if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          throw new Error('Unsupported image format. Use JPG or PNG.');
        }

        const { width, height } = image.scaleToFit(595, 842);
        page.drawImage(image, {
          x: (595 - width) / 2,
          y: (842 - height) / 2,
          width,
          height,
        });
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        page.setFontSize(12);
        page.drawText(text, { x: 50, y: 800, maxWidth: 500 });
      } else {
        throw new Error('Unsupported file type. Use images (JPG/PNG) or text files.');
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'converted-document.pdf');
      setStatus('Converted & Downloaded .');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <div className="converter-container">
      <p>Upload Image</p>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag and drop or click to select Image</p>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleConvert} disabled={!file}>
          Convert
        </button>
      </div>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

