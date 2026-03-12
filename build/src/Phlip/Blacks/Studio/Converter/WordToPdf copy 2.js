import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { saveAs } from 'file-saver';


export const WordToPdf = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  // Sanitize text to replace unsupported characters
  const sanitizeText = (text) => {
    return text
      .replace(/\u2011/g, '-') // Non-breaking hyphen to regular hyphen
      .replace(/\u2013/g, '-') // En dash to hyphen
      .replace(/\u2014/g, '-') // Em dash to hyphen
      .replace(/\u0009/g, '    ') // Tab character (U+0009) to four spaces
      .replace(/[^\x00-\xFF]/g, ''); // Remove other non-WinAnsi characters as fallback
  };

  // Extract text and basic formatting from Word document
  const extractContentFromWord = async (file) => {
    try {
      setProgress(10);
      const { value, messages } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      if (messages.length > 0) {
        console.warn('Mammoth conversion warnings:', messages);
      }
      setProgress(40);
      return sanitizeText(value); // Sanitize the extracted HTML content
    } catch (err) {
      console.error('Text extraction failed:', err);
      throw new Error('Failed to extract content from the Word document');
    }
  };

  // Create PDF with basic formatting
  const createPdf = async (htmlContent, originalFileName) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      let page = pdfDoc.addPage([595, 842]); // A4 size

      // Add metadata
      pdfDoc.setTitle(`Converted from: ${originalFileName}`);
      pdfDoc.setAuthor('Word to PDF Converter');
      pdfDoc.setCreationDate(new Date());

      const { width, height } = page.getSize();
      const margin = 50;
      const fontSize = 12;
      const lineHeight = fontSize * 1.2;
      let y = height - margin;

      // Parse HTML content (basic handling for <p>, <strong>, <em>)
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const paragraphs = doc.querySelectorAll('p, strong, em');

      for (const element of paragraphs) {
        const text = sanitizeText(element.textContent.trim()); // Sanitize text again for safety
        if (!text) continue;

        const isBold = element.tagName.toLowerCase() === 'strong';
        const isItalic = element.tagName.toLowerCase() === 'em';

        // Split text into lines that fit within page width
        const words = text.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          if (textWidth > width - margin * 2) {
            try {
              page.drawText(line, {
                x: margin,
                y,
                size: fontSize,
                font: isBold ? boldFont : font,
                color: rgb(0, 0, 0),
              });
            } catch (err) {
              console.warn(`Skipping line due to encoding issue: ${line}`, err);
              setError('Some characters were skipped due to encoding limitations.');
            }
            y -= lineHeight;
            line = word;
            if (y < margin) {
              page = pdfDoc.addPage([595, 842]);
              y = height - margin;
            }
          } else {
            line = testLine;
          }
        }
        if (line) {
          try {
            page.drawText(line, {
              x: margin,
              y,
              size: fontSize,
              font: isBold ? boldFont : font,
              color: rgb(0, 0, 0),
            });
          } catch (err) {
            console.warn(`Skipping line due to encoding issue: ${line}`, err);
            setError('Some characters were skipped due to encoding limitations.');
          }
          y -= lineHeight;
        }
        setProgress(60 + (40 * (Array.from(paragraphs).indexOf(element) / paragraphs.length)));
      }

      return await pdfDoc.save();
    } catch (err) {
      throw new Error(`PDF creation failed: ${err.message}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);
    setFileName('');
    setIsConverting(true);
    setProgress(0);

    try {
      const file = acceptedFiles[0];
      if (!file) {
        throw new Error('No file selected');
      }
      if (![
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ].includes(file.type)) {
        throw new Error('Please select a valid Word document (.doc or .docx)');
      }

      setFileName(file.name);

      // Extract content
      const htmlContent = await extractContentFromWord(file);

      // Create PDF
      const pdfBytes = await createPdf(htmlContent, file.name);

      // Save the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${file.name.replace(/\.[^/.]+$/, '')}.pdf`);
      setStatus('Conversion successful!');
      setProgress(100);
    } catch (err) {
      setError(`Conversion failed: ${err.message}`);
      setStatus('');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  }, []);

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
          <p>Processing: {fileName}</p>
          {isConverting && (
            <button onClick={cancelConversion} className="cancel-button" aria-label="Cancel conversion">
              Cancel
            </button>
          )}
        </div>
      )}
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