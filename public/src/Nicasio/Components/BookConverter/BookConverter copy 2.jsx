import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { Packer } from 'docx';
import { Document, Paragraph, TextRun, AlignmentType } from 'docx';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

export const BookConverter = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [conversionDirection, setConversionDirection] = useState('toPdf');
  const [htmlContent, setHtmlContent] = useState('');

  // Function to convert HTML to PDF using html2canvas
  const htmlToPdf = async (html, pdfDoc) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.padding = '20mm';
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });

      const imageData = canvas.toDataURL('image/png');
      const imageBytes = await fetch(imageData).then((res) => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);

      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // DOCX to PDF conversion
  const convertDocxToPdf = async (arrayBuffer, pdfDoc) => {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const styledHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; padding: 20px; }
              h1, h2, h3, h4, h5, h6 { margin-top: 1.2em; margin-bottom: 0.6em; }
              p { margin: 0.5em 0; }
              ul, ol { margin: 0.5em 0; padding-left: 2em; }
              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #f2f2f2; }
              img { max-width: 100%; height: auto; }
              .bold { font-weight: bold; }
              .italic { font-style: italic; }
              .underline { text-decoration: underline; }
            </style>
          </head>
          <body>${result.value}</body>
        </html>
      `;
      await htmlToPdf(styledHtml, pdfDoc);
      return true;
    } catch (err) {
      console.error('Error converting DOCX to PDF:', err);
      return false;
    }
  };

  // Enhanced PDF to DOCX conversion
  const convertPdfToDocx = async (arrayBuffer) => {
    setStatus('Extracting PDF content...');
    try {
      // Load PDF with pdfjs
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const docxChildren = [];

      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Processing page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Group text by y-position
        const paragraphs = {};
        textContent.items.forEach((item) => {
          const y = Math.round(item.transform[5]); // y-position
          if (!paragraphs[y]) paragraphs[y] = [];
          const fontSize = item.height || 12;
          const isBold = item.fontName.toLowerCase().includes('bold');
          const isItalic = item.fontName.toLowerCase().includes('italic');
          paragraphs[y].push({ text: item.str, fontSize, isBold, isItalic });
        });

        // Sort paragraphs by y-position (top to bottom)
        const sortedYs = Object.keys(paragraphs).sort((a, b) => b - a);

        // Add paragraphs to DOCX
        sortedYs.forEach((y) => {
          const paraItems = paragraphs[y];
          const textRuns = paraItems.map(
            (item) =>
              new TextRun({
                text: item.text,
                size: item.fontSize * 2, // Convert to half-points
                bold: item.isBold,
                italics: item.isItalic,
                font: 'Arial', // Default font
              })
          );

          docxChildren.push(
            new Paragraph({
              children: textRuns,
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        });

        // Add page break if not the last page
        if (i < pdf.numPages) {
          docxChildren.push(
            new Paragraph({
              children: [new TextRun({ text: '', break: 1 })],
              pageBreakBefore: true,
            })
          );
        }
      }

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720, // 1 inch in twips
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: docxChildren,
          },
        ],
      });

      setStatus('Generating DOCX file...');
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(blob, 'converted-document.docx');

      setStatus('Word conversion successful! File downloaded.');
      return true;
    } catch (err) {
      console.error('Error converting PDF to DOCX:', err);
      setError(`Error: Failed to convert PDF to Word. ${err.message}`);
      setStatus('');
      return false;
    }
  };

  // Handle file drop
  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);
    setHtmlContent('');

    const file = acceptedFiles[0];
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }

    try {
      if (conversionDirection === 'toPdf') {
        // Convert to PDF
        const pdfDoc = await PDFDocument.create();

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

          const page = pdfDoc.addPage([595, 842]);
          const { width, height } = image.scaleToFit(595, 842);
          page.drawImage(image, {
            x: (595 - width) / 2,
            y: (842 - height) / 2,
            width,
            height,
          });
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          let page = pdfDoc.addPage([595, 842]);
          page.setFontSize(12);

          const paragraphs = text.split('\n');
          let yPosition = 800;

          for (const para of paragraphs) {
            if (yPosition < 50) {
              page = pdfDoc.addPage([595, 842]);
              yPosition = 800;
            }

            page.drawText(para, {
              x: 50,
              y: yPosition,
              maxWidth: 500,
              lineHeight: 15,
            });
            yPosition -= 15;
          }
        } else if (
          file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.endsWith('.docx')
        ) {
          const arrayBuffer = await file.arrayBuffer();
          const success = await convertDocxToPdf(arrayBuffer, pdfDoc);

          if (!success) {
            throw new Error('Failed to convert Word document. Please try another file.');
          }
        } else {
          throw new Error(
            'Unsupported file type for PDF conversion. Use images (JPG/PNG), text files, or Word documents (.docx).'
          );
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, 'converted-document.pdf');
        setStatus('PDF conversion successful! File downloaded.');
      } else {
        // Convert from PDF to Word
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const success = await convertPdfToDocx(arrayBuffer);

          if (!success) {
            throw new Error('Failed to convert PDF to Word document. Please try another file.');
          }
        } else {
          throw new Error('Unsupported file type for Word conversion. Please use PDF files.');
        }
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
      console.error(err);
    }
  };

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: conversionDirection === 'toPdf' ? {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    } : {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  return (
    <div className="converter-container">
      <h2>Enhanced Document Converter</h2>

      <div className="conversion-direction">
        <button
          className={`direction-btn ${conversionDirection === 'toPdf' ? 'active' : ''}`}
          onClick={() => setConversionDirection('toPdf')}
        >
          To PDF
        </button>
        <button
          className={`direction-btn ${conversionDirection === 'toWord' ? 'active' : ''}`}
          onClick={() => setConversionDirection('toWord')}
        >
          To Word
        </button>
      </div>

      {conversionDirection === 'toPdf' ? (
        <>
          <p>Upload an image (JPG/PNG), text file, or Word document (.docx) to convert to PDF.</p>
          <p><small>Word documents will preserve formatting similar to Microsoft Word.</small></p>
        </>
      ) : (
        <>
          <p>Upload a PDF file to convert to Word document (.docx).</p>
          <p><small>Note: Complex PDF layouts may not convert perfectly.</small></p>
        </>
      )}

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

      {htmlContent && (
        <div className="html-preview" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      )}

      <style jsx>{`
        .converter-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .conversion-direction {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .direction-btn {
          padding: 8px 16px;
          margin: 0 10px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .direction-btn.active {
          background: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }
        .dropzone {
          border: 2px dashed #ccc;
          border-radius: 4px;
          padding: 40px;
          margin: 20px 0;
          cursor: pointer;
          transition: all 0.3s;
        }
        .dropzone.active {
          border-color: #4CAF50;
          background-color: #f8f8f8;
        }
        .status {
          color: #4CAF50;
        }
        .error {
          color: #f44336;
        }
        .html-preview {
          display: none;
        }
      `}</style>
    </div>
  );
};

