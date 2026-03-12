// styles.js

// PDF Page Dimensions and Layout Constants
export const PDF_CONSTANTS = {
  A4_WIDTH: 595 * 300 / 72, // A4 width in points at 300 DPI
  A4_HEIGHT: 842 * 300 / 72, // A4 height in points at 300 DPI
  MARGIN: 40 * 300 / 72, // Margin in points at 300 DPI
  FONT_SIZE: 12, // Default font size for text
  LINE_HEIGHT_MULTIPLIER: 1.15, // Line height multiplier
};

// CSS Styles for HTML-to-PDF Conversion
export const HTML_STYLES = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: ${PDF_CONSTANTS.FONT_SIZE}pt;
          line-height: ${PDF_CONSTANTS.LINE_HEIGHT_MULTIPLIER};
          color: #000000;
          padding: ${PDF_CONSTANTS.MARGIN / 300 * 72}px;
          margin: 0;
          text-align: left;
        }
        h1 {
          font-size: 24pt;
          font-weight: bold;
          margin: 0.67em 0;
          line-height: 1.2;
        }
        h2 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0.83em 0;
          line-height: 1.2;
        }
        h3 {
          font-size: 14pt;
          font-weight: bold;
          margin: 1em 0;
          line-height: 1.2;
        }
        p {
          margin: 0 0 0.5em 0;
          font-size: ${PDF_CONSTANTS.FONT_SIZE}pt;
          text-indent: 0;
          line-height: ${PDF_CONSTANTS.LINE_HEIGHT_MULTIPLIER};
        }
        ul, ol {
          margin: 0.5em 0;
          padding-left: 2em;
          list-style-position: outside;
        }
        li {
          margin: 0.3em 0;
          font-size: ${PDF_CONSTANTS.FONT_SIZE}pt;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        th, td {
          border: 1pt solid #000;
          padding: 8px;
          font-size: ${PDF_CONSTANTS.FONT_SIZE}pt;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        strong {
          font-weight: bold;
        }
        em {
          font-style: italic;
        }
        u {
          text-decoration: underline;
        }
        s {
          text-decoration: line-through;
        }
      </style>
    </head>
  </html>
`;

// Mammoth Style Map for DOCX-to-HTML Conversion
export const MAMMOOTH_STYLE_MAP = [
  'p[style-name*="Heading 1"] => h1:fresh',
  'p[style-name*="Heading 2"] => h2:fresh',
  'p[style-name*="Heading 3"] => h3:fresh',
  'b => strong',
  'i => em',
  'u => u',
  'strike => s',
  'p[style-name*="Normal"] => p:fresh',
  'p[style-name*="List"] => li:fresh',
];