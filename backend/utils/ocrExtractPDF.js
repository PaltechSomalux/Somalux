import 'dotenv/config';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

/**
 * Extract text from a single PDF page using OCR
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {number} pageNum - Page number to extract (1-indexed)
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDFPage(pdfBuffer, pageNum = 1) {
  try {
    console.log(`🔍 [OCR] Extracting text from page ${pageNum}...`);
    
    // Load PDF document
    const pdfDoc = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    
    if (pageNum > pdfDoc.numPages) {
      console.warn(`⚠️ [OCR] Page ${pageNum} exceeds document pages (${pdfDoc.numPages})`);
      return '';
    }
    
    // Get the page
    const page = await pdfDoc.getPage(pageNum);
    
    // Set rendering scale
    const scale = 2;
    const viewport = page.getViewport({ scale });
    
    // Create canvas for rendering
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to image buffer
    const imageBuffer = canvas.toBuffer('image/png');
    
    // Run OCR on the image
    console.log(`🧠 [OCR] Running Tesseract OCR on page ${pageNum}...`);
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing') {
          console.log(`   OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log(`✅ [OCR] Extracted ${text.length} characters from page ${pageNum}`);
    return text;
  } catch (error) {
    console.error(`❌ [OCR] Failed to extract page ${pageNum}:`, error.message);
    throw error;
  }
}

/**
 * Extract structured past paper details from OCR text
 * @param {string} text - Raw text from OCR
 * @returns {object} Extracted details
 */
export function parsePastPaperDetails(text) {
  const details = {
    unit_code: null,
    unit_name: null,
    faculty: null,
    year: null,
    semester: null,
    exam_type: 'Main',
    confidence: {}
  };

  // Common exam type patterns
  const examTypePatterns = [
    { pattern: /supplementary|supp|re-exam/i, value: 'Supplementary' },
    { pattern: /cat|continuous assessment|test/i, value: 'CAT' },
    { pattern: /mock|practice|sample/i, value: 'Mock' },
    { pattern: /main|final|end.*exam/i, value: 'Main' }
  ];

  // Semester patterns
  const semesterPatterns = [
    { pattern: /semester\s*[:\-]?\s*1|first|sem\s*1/i, value: '1' },
    { pattern: /semester\s*[:\-]?\s*2|second|sem\s*2/i, value: '2' },
    { pattern: /semester\s*[:\-]?\s*3|third|sem\s*3/i, value: '3' }
  ];

  // Extract exam type
  for (const { pattern, value } of examTypePatterns) {
    if (pattern.test(text)) {
      details.exam_type = value;
      details.confidence.exam_type = 0.8;
      break;
    }
  }

  // Extract semester
  for (const { pattern, value } of semesterPatterns) {
    if (pattern.test(text)) {
      details.semester = value;
      details.confidence.semester = 0.7;
      break;
    }
  }

  // Extract year (4-digit numbers)
  const yearMatch = text.match(/(?:20|19)\d{2}|\b\d{4}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      details.year = year;
      details.confidence.year = 0.9;
    }
  }

  // Extract unit code (usually alphanumeric, 4-10 chars, may contain spaces)
  // Pattern: "CODE 101", "BIO101", "CHEM-201", etc.
  const unitCodeMatch = text.match(/\b([A-Z]{2,4}\s*\d{2,4})\b/i);
  if (unitCodeMatch) {
    details.unit_code = unitCodeMatch[1].replace(/\s+/g, ' ').trim();
    details.confidence.unit_code = 0.85;
  }

  // Extract unit name (first long line that looks like a title)
  const lines = text.split('\n').filter(l => l.trim().length > 5);
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that are 15-100 chars, start with capital, likely to be titles
    if (trimmed.length > 15 && trimmed.length < 100 && /^[A-Z]/.test(trimmed)) {
      // Skip lines that look like instructions or metadata
      if (!/^(INSTRUCTIONS|NAME|REG\.|STUDENT|DATE|TIME|DURATION)/i.test(trimmed)) {
        details.unit_name = trimmed;
        details.confidence.unit_name = 0.6; // Lower confidence for names
        break;
      }
    }
  }

  // Extract faculty/department (often appears after "department:", "school:", etc.)
  const facultyMatch = text.match(/(?:department|faculty|school|subject)\s*[:\-]?\s*([A-Za-z\s&]+?)(?:\n|$)/i);
  if (facultyMatch) {
    details.faculty = facultyMatch[1].trim();
    details.confidence.faculty = 0.75;
  }

  return details;
}

/**
 * Main function to extract past paper details from scanned PDF
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original filename for fallback
 * @returns {Promise<object>} Extracted details
 */
export async function extractPastPaperDetailsFromScannedPDF(pdfBuffer, fileName = '') {
  try {
    console.log(`\n📄 [PAST-PAPER-OCR] Processing: ${fileName || 'unknown'}`);
    
    // Load PDF to check page count
    const pdfDoc = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    const pageCount = pdfDoc.numPages;
    console.log(`📖 [PAST-PAPER-OCR] PDF has ${pageCount} pages`);

    // Extract text from first page (usually contains title/metadata)
    let extractedText = '';
    try {
      extractedText = await extractTextFromPDFPage(pdfBuffer, 1);
    } catch (err) {
      console.warn(`⚠️ [PAST-PAPER-OCR] Could not OCR page 1:`, err.message);
    }

    // If first page didn't work, try second page
    if (!extractedText && pageCount > 1) {
      try {
        console.log(`🔄 [PAST-PAPER-OCR] Trying page 2...`);
        extractedText = await extractTextFromPDFPage(pdfBuffer, 2);
      } catch (err) {
        console.warn(`⚠️ [PAST-PAPER-OCR] Could not OCR page 2:`, err.message);
      }
    }

    // Parse the extracted text
    const details = parsePastPaperDetails(extractedText);

    // Fallback: extract from filename if OCR failed
    if (!details.unit_code && fileName) {
      const fileNameDetails = parseFileNameForPastPaper(fileName);
      // Merge with OCR results, preferring OCR if available
      Object.keys(fileNameDetails).forEach(key => {
        if (!details[key] && fileNameDetails[key]) {
          details[key] = fileNameDetails[key];
          details.confidence[key] = (details.confidence[key] || 0) + 0.1; // Lower confidence for filename parsing
        }
      });
    }

    console.log(`✅ [PAST-PAPER-OCR] Extraction complete:`, details);
    return details;

  } catch (error) {
    console.error(`❌ [PAST-PAPER-OCR] Failed to extract details:`, error.message);
    // Return empty details with error flag
    return {
      unit_code: null,
      unit_name: null,
      faculty: null,
      year: null,
      semester: null,
      exam_type: 'Main',
      error: error.message,
      confidence: {}
    };
  }
}

/**
 * Parse filename for past paper details (fallback method)
 * Expected formats:
 *   - "MENT130_Management_2023_1_Main.pdf"
 *   - "BIO101-Biology-2022-2.pdf"
 *   - "CHEM 201 Organic Chemistry 2021.pdf"
 */
export function parseFileNameForPastPaper(fileName) {
  const details = {
    unit_code: null,
    unit_name: null,
    faculty: null,
    year: null,
    semester: null,
    exam_type: 'Main'
  };

  // Remove extension
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  // Try to extract unit code (e.g., "MENT130", "BIO 101")
  const unitCodeMatch = baseName.match(/^([A-Z]{2,4}[\s\-]?\d{2,4})/i);
  if (unitCodeMatch) {
    details.unit_code = unitCodeMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Try to extract year
  const yearMatch = baseName.match(/(?:20|19)\d{2}/);
  if (yearMatch) {
    details.year = parseInt(yearMatch[0]);
  }

  // Try to extract semester
  const semesterMatch = baseName.match(/[_\-\s]([1-3])(?:[_\-\s]|$)/);
  if (semesterMatch) {
    details.semester = semesterMatch[1];
  }

  // Try to extract exam type
  if (/supplementary|supp/i.test(baseName)) details.exam_type = 'Supplementary';
  else if (/cat/i.test(baseName)) details.exam_type = 'CAT';
  else if (/mock/i.test(baseName)) details.exam_type = 'Mock';

  // Extract unit name (text between code and year)
  if (details.unit_code && details.year) {
    const pattern = new RegExp(`${details.unit_code}[_\\-\\s]+(.+?)${details.year}`, 'i');
    const match = baseName.match(pattern);
    if (match) {
      details.unit_name = match[1].replace(/[_\-]/g, ' ').trim();
    }
  }

  return details;
}
