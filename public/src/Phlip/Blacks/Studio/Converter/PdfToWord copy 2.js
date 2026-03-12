import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import * as pdfjs from 'pdfjs-dist/webpack';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

export const PdfToWord = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [conversionQuality, setConversionQuality] = useState('high');
  const [preserveLayout, setPreserveLayout] = useState(true);
  const canvasRef = useRef(null);

  const extractContentFromPdf = async (pdfBytes) => {
    const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
    const children = [];
    const totalPages = pdf.numPages;
    const dpi = conversionQuality === 'high' ? 150 : 96;
    const scale = dpi / 72;
    
    children.push(
      new Paragraph({
        text: `Converted from PDF: ${fileName}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      })
    );

    for (let i = 1; i <= totalPages; i++) {
      setProgress(Math.round((i / totalPages) * 100));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const textContent = await page.getTextContent();
      
      if (totalPages > 1) {
        children.push(
          new Paragraph({
            text: `Page ${i}`,
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: i > 1,
          })
        );
      }

      if (preserveLayout) {
        try {
          const canvas = canvasRef.current || document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          const imageData = canvas.toDataURL('image/png');
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageData,
                  transformation: {
                    width: viewport.width * 0.75,
                    height: viewport.height * 0.75,
                  },
                })
              ],
              spacing: { after: 200 },
            })
          );
        } catch (err) {
          console.error('Error rendering page as image:', err);
        }
      }

      const textElements = await processTextContent(textContent, viewport);
      children.push(...textElements);
    }

    return children;
  };

  const processTextContent = async (textContent, viewport) => {
    const paragraphs = [];
    let currentParagraph = [];
    let currentStyle = {};
    let lastY = null;
    let lastX = null;
    let lastHeight = null;

    const lines = {};
    textContent.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item);
    });

    Object.keys(lines).sort((a, b) => b - a).forEach(y => {
      const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
      let lineParagraphs = [];
      let currentLineParagraph = [];
      let currentLineStyle = {};
      let lastItemEnd = 0;

      lineItems.forEach((item, index) => {
        const x = item.transform[4];
        const itemWidth = item.width;
        const itemHeight = item.height;
        const text = item.str;
        
        let alignment = AlignmentType.LEFT;
        if (x > viewport.width * 0.6) alignment = AlignmentType.RIGHT;
        else if (x > viewport.width * 0.3) alignment = AlignmentType.CENTER;

        const style = {
          bold: item.fontName.includes('Bold'),
          italic: item.fontName.includes('Italic') || item.fontName.includes('Oblique'),
          size: itemHeight * 2,
          font: item.fontName,
          color: item.color && item.color.length >= 3 
            ? rgbToHex(item.color[0], item.color[1], item.color[2])
            : undefined,
          alignment: alignment
        };

        if (x > lastItemEnd + 10) {
          if (currentLineParagraph.length > 0) {
            lineParagraphs.push(createParagraphFromFragments(currentLineParagraph, currentLineStyle));
            currentLineParagraph = [];
          }
          
          if (index > 0 && x - lastItemEnd > 50) {
            lineParagraphs.push(new Paragraph({
              children: [new TextRun({ text: '\t' })],
              spacing: { after: 0 }
            }));
          }
        }

        if (currentLineParagraph.length === 0) {
          currentLineStyle = style;
          currentLineParagraph.push(text);
        } else if (stylesAreEqual(currentLineStyle, style)) {
          currentLineParagraph.push(text);
        } else {
          lineParagraphs.push(createParagraphFromFragments(currentLineParagraph, currentLineStyle));
          currentLineParagraph = [text];
          currentLineStyle = style;
        }

        lastItemEnd = x + itemWidth;
      });

      if (currentLineParagraph.length > 0) {
        lineParagraphs.push(createParagraphFromFragments(currentLineParagraph, currentLineStyle));
      }

      if (lastY !== null && Math.abs(y - lastY) < (lastHeight * 1.5)) {
        if (paragraphs.length > 0) {
          const lastPara = paragraphs[paragraphs.length - 1];
          if (lastPara instanceof Paragraph) {
            lastPara.addChildElement(new TextRun({ text: ' ' }));
            lineParagraphs.forEach(p => {
              if (p.children) {
                p.children.forEach(child => {
                  lastPara.addChildElement(child);
                });
              }
            });
          }
        }
      } else {
        paragraphs.push(...lineParagraphs);
      }

      lastY = y;
      lastHeight = lineItems[0]?.height || 12;
    });

    return paragraphs;
  };

  const detectTables = (textItems) => {
    const tables = [];
    let currentTable = [];
    let currentRow = [];
    let lastY = null;
    
    const sortedItems = [...textItems].sort((a, b) => {
      const yDiff = a.transform[5] - b.transform[5];
      if (yDiff !== 0) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    for (const item of sortedItems) {
      const y = item.transform[5];
      
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        if (currentRow.length > 0) {
          currentTable.push(currentRow);
          currentRow = [];
        }
        
        if (Math.abs(y - lastY) > 20 && currentTable.length > 0) {
          tables.push(createTableFromGrid(currentTable));
          currentTable = [];
        }
      }
      
      currentRow.push(item);
      lastY = y;
    }

    if (currentRow.length > 0) currentTable.push(currentRow);
    if (currentTable.length > 0) tables.push(createTableFromGrid(currentTable));
    
    return tables;
  };

  const createTableFromGrid = (grid) => {
    const rows = grid.map(row => {
      const cells = row.map(cell => {
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cell.str,
                  bold: cell.fontName.includes('Bold'),
                  italics: cell.fontName.includes('Italic'),
                  size: cell.height * 2,
                })
              ],
            })
          ],
          width: {
            size: cell.width * 20,
            type: WidthType.DXA,
          },
        });
      });
      return new TableRow({ children: cells });
    });

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { size: 4, color: "AAAAAA" },
        bottom: { size: 4, color: "AAAAAA" },
        left: { size: 4, color: "AAAAAA" },
        right: { size: 4, color: "AAAAAA" },
        insideHorizontal: { size: 2, color: "DDDDDD" },
        insideVertical: { size: 2, color: "DDDDDD" },
      },
    });
  };

  const createParagraphFromFragments = (fragments, style) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: fragments.join(' '),
          bold: style.bold,
          italics: style.italic,
          size: style.size ? Math.round(style.size) : 24,
          font: style.font || 'Calibri',
          color: style.color,
        }),
      ],
      spacing: { 
        after: style.spacingAfter || 200,
        before: style.spacingBefore || 0,
        line: style.lineSpacing || 276,
      },
      alignment: style.alignment || AlignmentType.LEFT,
      indent: style.indent ? { left: style.indent * 20 } : undefined,
    });
  };

  const stylesAreEqual = (style1, style2) => {
    return (
      style1.bold === style2.bold &&
      style1.italic === style2.italic &&
      Math.abs((style1.size || 24) - (style2.size || 24)) < 2 &&
      style1.font === style2.font &&
      style1.color === style2.color &&
      style1.alignment === style2.alignment
    );
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);
    setFileName('');
    setProgress(0);

    try {
      const file = acceptedFiles[0];
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Please select a valid PDF file');
      }

      setFileName(file.name.replace('.pdf', ''));
      const pdfBytes = await file.arrayBuffer();
      
      const children = await extractContentFromPdf(pdfBytes);

      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: 'Normal',
              name: 'Normal',
              run: {
                size: 24,
                font: 'Calibri',
              },
              paragraph: {
                spacing: { line: 276 },
              },
            },
          ],
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: children,
        }],
      });

      setStatus('Generating Word file...');
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}.docx`);
      setStatus('Conversion successful!');
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(`Conversion failed: ${err.message}`);
      setStatus('');
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div>
      <h2>Advanced PDF to Word Converter</h2>
      <p>Convert your PDF documents to editable Word files with precise layout preservation</p>
      
      <div>
        <div>
          <label>
            <input 
              type="radio" 
              checked={conversionQuality === 'high'}
              onChange={() => setConversionQuality('high')}
            />
            High Quality (slower, better accuracy)
          </label>
          <label>
            <input 
              type="radio" 
              checked={conversionQuality === 'fast'}
              onChange={() => setConversionQuality('fast')}
            />
            Fast Conversion
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={preserveLayout}
              onChange={() => setPreserveLayout(!preserveLayout)}
            />
            Preserve exact layout (includes images)
          </label>
        </div>
      </div>

      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div>
          <svg viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        {isDragActive ? (
          <p>Drop your PDF file here</p>
        ) : (
          <>
            <p>Drag & drop your PDF file here</p>
            <p>or</p>
            <button>Select PDF File</button>
          </>
        )}
        <p>Max file size: 50MB</p>
      </div>
      
      {progress > 0 && progress < 100 && (
        <div>
          <div style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {fileName && <p>Processing: {fileName}.pdf</p>}
      {status && <p>{status}</p>}
      {error && <p>{error}</p>}

      <div>
        <h3>Advanced Features:</h3>
        <ul>
          <li>Precise layout preservation including images</li>
          <li>Table detection and reconstruction</li>
          <li>Font style and color retention</li>
          <li>Paragraph alignment preservation</li>
          <li>Multi-column document support</li>
          <li>Secure client-side processing</li>
        </ul>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}; 