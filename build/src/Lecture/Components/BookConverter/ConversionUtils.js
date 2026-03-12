// ConversionUtils.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { PDF_CONSTANTS, HTML_STYLES, MAMMOOTH_STYLE_MAP } from './ConversionUtils.styles';

export const ConversionUtils = {
  async createPdfDoc(file) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(file.name.replace(/\.[^/.]+$/, ""));
    pdfDoc.setCreator('BookConverter');
    pdfDoc.setCreationDate(new Date());
    return pdfDoc;
  },

  async splitHtmlIntoPages(html) {
    const pages = [];
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${PDF_CONSTANTS.A4_WIDTH / 300 * 72}px`;
    tempDiv.style.padding = `${PDF_CONSTANTS.MARGIN / 300 * 72}px`;
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    let currentPage = [];
    let currentHeight = 0;

    Array.from(tempDiv.children).forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const height = (element.offsetHeight + parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom)) * 300 / 72;
      if (currentHeight + height > PDF_CONSTANTS.A4_HEIGHT - PDF_CONSTANTS.MARGIN * 2) {
        pages.push(currentPage.join(''));
        currentPage = [];
        currentHeight = 0;
      }
      currentPage.push(element.outerHTML);
      currentHeight += height;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage.join(''));
    }

    document.body.removeChild(tempDiv);
    return pages;
  },

  async htmlToPdf(html, pdfDoc) {
    const pages = await this.splitHtmlIntoPages(html);

    for (const pageHtml of pages) {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = `${PDF_CONSTANTS.A4_WIDTH / 300 * 72}px`;
      tempDiv.style.padding = `${PDF_CONSTANTS.MARGIN / 300 * 72}px`;
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.innerHTML = pageHtml;
      document.body.appendChild(tempDiv);

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 300 / 72,
          logging: false,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: tempDiv.scrollWidth,
          windowHeight: tempDiv.scrollHeight,
          backgroundColor: '#ffffff',
        });

        const imageData = canvas.toDataURL('image/png', 1.0);
        const imageBytes = await fetch(imageData).then((res) => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);

        const page = pdfDoc.addPage([PDF_CONSTANTS.A4_WIDTH, PDF_CONSTANTS.A4_HEIGHT]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: PDF_CONSTANTS.A4_WIDTH,
          height: PDF_CONSTANTS.A4_HEIGHT,
        });
      } finally {
        document.body.removeChild(tempDiv);
      }
    }
  },

  async convertDocxToPdf(arrayBuffer, pdfDoc) {
    try {
      const result = await mammoth.convertToHtml({
        arrayBuffer,
        styleMap: MAMMOOTH_STYLE_MAP,
        includeDefaultStyleMap: true,
      });

      const styledHtml = `
        ${HTML_STYLES}
        <body>${result.value}</body>
        </html>
      `;

      await this.htmlToPdf(styledHtml, pdfDoc);
      return true;
    } catch (err) {
      console.error('Error converting DOCX to PDF:', err);
      return false;
    }
  },

  async textToPdf(text, pdfDoc) {
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = PDF_CONSTANTS.FONT_SIZE;
    const lineHeight = fontSize * PDF_CONSTANTS.LINE_HEIGHT_MULTIPLIER;
    const maxWidth = PDF_CONSTANTS.A4_WIDTH - PDF_CONSTANTS.MARGIN * 2;
    const maxHeight = PDF_CONSTANTS.A4_HEIGHT - PDF_CONSTANTS.MARGIN * 2;

    let page = pdfDoc.addPage([PDF_CONSTANTS.A4_WIDTH, PDF_CONSTANTS.A4_HEIGHT]);
    let yPosition = PDF_CONSTANTS.A4_HEIGHT - PDF_CONSTANTS.MARGIN;

    const paragraphs = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const para of paragraphs) {
      const lines = font
        .splitTextToSize(para, maxWidth)
        .split('\n')
        .map(line => line.trim());

      for (const line of lines) {
        if (yPosition < PDF_CONSTANTS.MARGIN + lineHeight) {
          page = pdfDoc.addPage([PDF_CONSTANTS.A4_WIDTH, PDF_CONSTANTS.A4_HEIGHT]);
          yPosition = PDF_CONSTANTS.A4_HEIGHT - PDF_CONSTANTS.MARGIN;
        }

        page.drawText(line, {
          x: PDF_CONSTANTS.MARGIN,
          y: yPosition,
          font,
          size: fontSize,
          color: rgb(0, 0, 0),
          lineHeight: lineHeight,
          maxWidth: maxWidth,
        });
        yPosition -= lineHeight;
      }
      yPosition -= lineHeight * 0.5;
    }
  },

  async savePdf(pdfDoc, fileName = 'converted-document.pdf') {
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, fileName);
  }
};