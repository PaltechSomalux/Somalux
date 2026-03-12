import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';


export const ImageConverter = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  // Handle file drop using react-dropzone
  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);

    const file = acceptedFiles[0];
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      // Handle different file types
      if (file.type.startsWith('image/')) {
        // For images: Embed the image in the PDF
        const imageBytes = await file.arrayBuffer();
        let image;

        if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          throw new Error('Unsupported image format. Use JPG or PNG.');
        }

        // Scale image to fit page (A4 size: 595x842 points)
        const { width, height } = image.scaleToFit(595, 842);
        page.drawImage(image, {
          x: (595 - width) / 2,
          y: (842 - height) / 2,
          width,
          height,
        });
      } else if (file.type === 'text/plain') {
        // For text files: Add text content to PDF
        const text = await file.text();
        page.setFontSize(12);
        page.drawText(text, { x: 50, y: 800, maxWidth: 500 });
      } else {
        throw new Error('Unsupported file type. Use images (JPG/PNG) or text files.');
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'converted-document.pdf');
      setStatus('Conversion successful! File downloaded.');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  // Configure react-dropzone
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
      <h2>Document Converter</h2>
      <p>Upload an image (JPG/PNG) or text file to convert to PDF.</p>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag and drop a file here, or click to select a file.</p>
        )}
      </div>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

