import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  SectionType,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Footnote,
  CommentRangeStart,
  CommentRangeEnd,
  CommentReference,
} from 'docx';
import { saveAs } from 'file-saver';
import './PdfToWord.css';
import * as pdfjs from 'pdfjs-dist/webpack';

export const PdfToWord = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const normalizeText = (text) => {
    return text
      .normalize('NFKD') // Decompose Unicode characters
      .replace(/[\u0300-\u036F]/g, '') // Remove diacritics
      .replace(/[^\x20-\x7Eα-ωΑ-Ω€$¥±×÷]/g, ''); // Keep common symbols
  };

  const extractTextAndStylesFromPdf = async (pdfBytes) => {
    const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
    const sections = [];
    let potentialWatermark = null;
    let headerText = null;
    let footerText = null;
    const metadata = await pdf.getMetadata();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const annotations = await page.getAnnotations();
      const viewport = page.getViewport({ scale: 1.0 });
      const pageHeight = viewport.height;
      const pageWidth = viewport.width;

      // Extract color and style information
      const operatorList = await page.getOperatorList();
      const colorMap = new Map();
      operatorList.fnArray.forEach((fn, idx) => {
        if (fn === pdfjs.OPS.setFillColor || fn === pdfjs.OPS.setFillRGBColor) {
          const args = operatorList.argsArray[idx];
          if (args && args.length >= 3) {
            const [r, g, b] = args.map(v => Math.round(v * 255));
            colorMap.set(idx, { r, g, b });
          }
        }
      });

      // Detect headers/footers (simplified: top/bottom 10% of page)
      const headerItems = textContent.items.filter(item => item.transform[5] > pageHeight * 0.9);
      const footerItems = textContent.items.filter(item => item.transform[5] < pageHeight * 0.1);
      if (headerItems.length > 0) {
        headerText = headerItems.map(item => item.str).join(' ');
      }
      if (footerItems.length > 0) {
        footerText = footerItems.map(item => item.str).join(' ') + ` Page ${i}`;
      }

      // Detect tables (heuristic: text items aligned in columns)
      const tableRows = [];
      const textItemsByY = textContent.items.reduce((acc, item) => {
        const y = item.transform[5];
        if (!acc[y]) acc[y] = [];
        acc[y].push(item);
        return acc;
      }, {});
      Object.values(textItemsByY).forEach(rowItems => {
        if (rowItems.length > 1) { // Assume multiple items in a row indicate a table
          const cells = rowItems.map(item => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.str })] })],
            width: { size: pageWidth / rowItems.length, type: WidthType.AUTO },
          }));
          tableRows.push(new TableRow({ children: cells }));
        }
      });
      const table = tableRows.length > 0 ? new Table({ rows: tableRows }) : null;

      // Extract text with styling
      const paragraphs = [];
      let currentParagraph = [];
      let lastY = null;
      let footnotes = [];
      let comments = [];

      textContent.items.forEach((item, index) => {
        const { str, transform, fontName, height: fontSize } = item;
        const [, , , , x, y] = transform;
        const cleanText = normalizeText(str);

        // Detect watermark (large, centered text)
        if (fontSize > 20 && x > pageWidth * 0.3 && x < pageWidth * 0.7) {
          if (!potentialWatermark || potentialWatermark.text === cleanText) {
            potentialWatermark = { text: cleanText, fontSize, fontName };
          }
        }

        // Detect superscript/subscript
        const isSuperScript = y > lastY && lastY !== null && Math.abs(y - lastY) < fontSize * 0.5;
        const isSubScript = y < lastY && lastY !== null && Math.abs(lastY - y) < fontSize * 0.5;

        // Detect paragraph breaks
        if (lastY !== null && Math.abs(y - lastY) > fontSize * 1.5) {
          if (currentParagraph.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: currentParagraph,
                spacing: { after: Math.round(fontSize * 20) },
                indent: { left: x * 20 },
                alignment: x < pageWidth * 0.1 ? AlignmentType.LEFT : x > pageWidth * 0.4 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
              })
            );
            currentParagraph = [];
          }
        }

        // Apply styles and color
        const isBold = fontName?.toLowerCase().includes('bold');
        const isItalic = fontName?.toLowerCase().includes('italic');
        const color = colorMap.get(index) || { r: 0, g: 0, b: 0 };
        const hexColor = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;

        currentParagraph.push(
          new TextRun({
            text: cleanText,
            size: fontSize * 2,
            bold: isBold,
            italics: isItalic,
            font: fontName || 'Arial',
            color: hexColor,
            superScript: isSuperScript,
            subScript: isSubScript,
            highlight: colorMap.get(index) ? 'yellow' : undefined,
          })
        );

        lastY = y;
      });

      // Push last paragraph
      if (currentParagraph.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: currentParagraph,
            spacing: { after: Math.round(lastY * 20) },
            alignment: AlignmentType.LEFT,
          })
        );
      }

      // Handle annotations (e.g., footnotes, comments)
      annotations.forEach((ann, idx) => {
        if (ann.subtype === 'Link' && ann.url) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ann.url,
                  style: 'Hyperlink',
                }),
              ],
            })
          );
        } else if (ann.subtype === 'Popup' || ann.subtype === 'Text') {
          comments.push({
            id: idx + 1,
            content: ann.contents || 'Comment',
          });
          paragraphs.push(
            new Paragraph({
              children: [
                new CommentRangeStart(idx + 1),
                new TextRun({ text: ann.title || 'Note' }),
                new CommentReference(idx + 1),
                new CommentRangeEnd(idx + 1),
              ],
            })
          );
        }
      });

      // Section content
      const sectionChildren = [
        new Paragraph({
          text: `Page ${i}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),
        ...paragraphs,
        ...(table ? [table] : []),
      ];

      if (i < pdf.numPages) {
        sectionChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }

      sections.push({
        properties: {
          page: {
            size: { width: pageWidth * 20, height: pageHeight * 20 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
          type: i === 1 ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE,
        },
        headers: {
          default: new Header({
            children: [
              ...(potentialWatermark
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: potentialWatermark.text,
                          size: potentialWatermark.fontSize * 2,
                          font: potentialWatermark.fontName || 'Arial',
                          color: '999999',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ]
                : []),
              ...(headerText
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: headerText })],
                      alignment: AlignmentType.RIGHT,
                    }),
                  ]
                : []),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              ...(footerText
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: footerText })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ]
                : []),
            ],
          }),
        },
        children: sectionChildren,
        footnotes: footnotes.reduce((acc, note, idx) => {
          acc[idx + 1] = { children: [new Paragraph({ text: note.content })] };
          return acc;
        }, {}),
        comments,
      });
    }

    return { sections, metadata };
  };

  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);
    setFileName('');

    try {
      const file = acceptedFiles[0];
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Please select a valid PDF file');
      }

      setFileName(file.name);
      const pdfBytes = await file.arrayBuffer();

      // Extract text, styles, and metadata
      const { sections, metadata } = await extractTextAndStylesFromPdf(pdfBytes);

      // Create Word document
      const doc = new Document({
        creator: metadata.info?.Author || 'Unknown',
        title: metadata.info?.Title || file.name,
        keywords: metadata.info?.Keywords || '',
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Converted from: ${file.name}`,
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ],
          },
          ...sections,
        ],
      });

      // Save the document
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${file.name.replace('.pdf', '')}.docx`);
      setStatus('Conversion successful!');
    } catch (err) {
      setError(`Conversion failed: ${err.message}`);
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

      {fileName && <p className="file-info">Processing: {fileName}</p>}
      {status && <p className="status success">{status}</p>}
      {error && <p className="status error">{error}</p>}
    </div>
  );
};