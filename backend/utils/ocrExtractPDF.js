import 'dotenv/config';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Extract text directly from PDF using PDF.js (works with searchable PDFs)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {number} pageNum - Page number to extract (1-indexed)
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDFPageDirect(pdfBuffer, pageNum = 1) {
  try {
    console.log(`📖 [PDF.js] Extracting text from page ${pageNum}...`);
    
    // Load PDF document
    const pdfDoc = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    
    if (pageNum > pdfDoc.numPages) {
      console.warn(`⚠️ [PDF.js] Page ${pageNum} exceeds document pages (${pdfDoc.numPages})`);
      return '';
    }
    
    // Get the page
    const page = await pdfDoc.getPage(pageNum);
    
    // Extract text content from page
    const textContent = await page.getTextContent();
    
    // Combine text items into a single string
    const text = textContent.items
      .map(item => item.str)
      .join(' ');
    
    console.log(`✅ [PDF.js] Extracted ${text.length} characters from page ${pageNum}`);
    return text;
  } catch (error) {
    console.error(`❌ [PDF.js] Failed to extract page ${pageNum}:`, error.message);
    return '';
  }
}

/**
 * Extract text from a single PDF page using OCR (for scanned documents)
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
 * Extract structured past paper details from PDF text
 * @param {string} text - Raw text from PDF
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

  if (!text || text.trim().length === 0) {
    return details;
  }

  // Split into lines for processing
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = text.toUpperCase();

  // ========== EXAM TYPE EXTRACTION ==========
  const examTypePatterns = [
    { pattern: /SUPPLEMENTARY|SUPP|RE[\-\s]?EXAM|MAKEUP|RETAKE/i, value: 'Supplementary' },
    { pattern: /\bCAT\b|CONTINUOUS\s+ASSESSMENT|CAT\s+\d|CONTINUOUS.*TEST/i, value: 'CAT' },
    { pattern: /MOCK|PRACTICE|SAMPLE|TRIAL|DUMMY/i, value: 'Mock' },
    { pattern: /MAIN|FINAL|END[\s\-]?OF[\s\-]?SEMESTER|MAJOR\s+EXAM|ORDINARY/i, value: 'Main' }
  ];

  for (const { pattern, value } of examTypePatterns) {
    if (pattern.test(text)) {
      details.exam_type = value;
      details.confidence.exam_type = 0.9;
      break;
    }
  }

  // ========== YEAR EXTRACTION ==========
  // Look for years in various contexts
  const yearMatches = text.match(/(?:20|19)\d{2}/g);
  if (yearMatches && yearMatches.length > 0) {
    // Find the most likely year (usually the most recent one)
    const validYears = yearMatches
      .map(y => parseInt(y))
      .filter(y => y >= 1990 && y <= new Date().getFullYear() + 1)
      .sort((a, b) => b - a);
    
    if (validYears.length > 0) {
      details.year = validYears[0];
      details.confidence.year = 0.95;
    }
  }

  // ========== SEMESTER EXTRACTION ==========
  const semesterPatterns = [
    { pattern: /SEMESTER\s*[:\-]?\s*1|FIRST|SEM\s*1|\bI\b(?:\s+SEMESTER)?/i, value: '1' },
    { pattern: /SEMESTER\s*[:\-]?\s*2|SECOND|SEM\s*2|\bII\b(?:\s+SEMESTER)?/i, value: '2' },
    { pattern: /SEMESTER\s*[:\-]?\s*3|THIRD|SEM\s*3|\bIII\b(?:\s+SEMESTER)?/i, value: '3' }
  ];

  for (const { pattern, value } of semesterPatterns) {
    if (pattern.test(text)) {
      details.semester = value;
      details.confidence.semester = 0.85;
      break;
    }
  }

  // ========== UNIT CODE EXTRACTION ==========
  // Extract PREFIX (like UCU, APL, EAE) as unit_name and NUMBER as unit_code
  // Pattern examples: "UCU 101: DEVELOPMENT STUDIES", "APL 808", "EAE 301"
  const unitCodePatterns = [
    // Pattern 1: "PREFIX NUMBER: DESCRIPTION" (e.g., "UCU 101: DEVELOPMENT STUDIES")
    /\b([A-Z]{2,4})\s+(\d{2,4})\s*:/,
    
    // Pattern 2: "PREFIX NUMBER - DESCRIPTION"
    /\b([A-Z]{2,4})\s+(\d{2,4})\s*[\-–]/,
    
    // Pattern 3: Just "PREFIX NUMBER"
    /\b([A-Z]{2,4})\s+(\d{2,4})\b/,
    
    // Pattern 4: "PREFIXNUMBER" (no space)
    /\b([A-Z]{2,4})(\d{2,4})\b/
  ];

  for (const pattern of unitCodePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract PREFIX as unit_name (e.g., "UCU", "APL")
      details.unit_name = match[1].toUpperCase(); // Just the prefix
      details.confidence.unit_name = 0.95; // Very high confidence
      
      // Extract NUMBER as unit_code (e.g., "101", "808")
      details.unit_code = match[2]; // Just the number
      details.confidence.unit_code = 0.95; // Very high confidence
      break;
    }
  }

  // ========== FACULTY/DEPARTMENT EXTRACTION ==========
  const facultyPatterns = [
    /(?:faculty|department|school)\s*(?:of|:)?\s*([A-Za-z\s&\-]+?)(?:\n|,|;|$)/i,
    /(?:faculty|department|school)\s*[:\-]?\s*([A-Za-z\s&\-]+?)(?:$)/im
  ];

  for (const pattern of facultyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let faculty = match[1].trim();
      // Clean up - remove common artifacts
      faculty = faculty.replace(/^(of|the|a)\s+/i, '');
      faculty = faculty.replace(/^faculty\s+/i, ''); // Remove "faculty" prefix
      
      // Only accept if it's a meaningful faculty name
      // Reject generic words and phrases that are not real faculties
      const rejectPatterns = /^(UNIVERSITY|EXAMINATION|VIRTUAL|DIGITAL|OPEN|LEARNING|SCHOOL|EDUCATION|ACADEMIC|VIRTUAL AND OPEN LEARNING|DIGITAL SCHOOL|OF VIRTUAL)$/i;
      // Also reject if contains too many common words (indicates it's a description, not a faculty)
      const commonWordCount = (faculty.match(/\b(VIRTUAL|DIGITAL|OPEN|LEARNING|SCHOOL|EDUCATION)\b/gi) || []).length;
      
      if (faculty.length > 5 && faculty.length < 80 && !rejectPatterns.test(faculty) && commonWordCount <= 1 && /[A-Za-z]{5,}/.test(faculty)) {
        details.faculty = faculty;
        details.confidence.faculty = 0.8;
        break;
      }
    }
  }

  // ========== UNIT NAME EXTRACTION ==========
  // IMPORTANT: unit_name should ONLY be the PREFIX (e.g., "UCU", "APL")
  // extracted from the "PREFIX NUMBER" pattern earlier
  // Do NOT try to extract course names from PDF content, as they are often questions/instructions
  // Only try if unit_name is still not set
  if (!details.unit_name) {
    console.warn(`⚠️ [PARSE] Could not extract PREFIX NUMBER from text, unit_name will be empty`);
  }

  return details;
}

/**
 * Main function to extract past paper details from PDF (tries direct text extraction first, then OCR)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original filename for fallback
 * @returns {Promise<object>} Extracted details
 */
export async function extractPastPaperDetailsFromScannedPDF(pdfBuffer, fileName = '') {
  try {
    console.log(`\n📄 [PAST-PAPER-EXTRACT] Processing: ${fileName || 'unknown'}`);
    
    // Load PDF to check page count
    const pdfDoc = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    const pageCount = pdfDoc.numPages;
    console.log(`📖 [PAST-PAPER-EXTRACT] PDF has ${pageCount} pages`);

    // ========== STRATEGY 1: Try direct text extraction (for searchable PDFs) ==========
    console.log(`🔄 [PAST-PAPER-EXTRACT] Attempting direct PDF text extraction...`);
    let extractedText = '';
    
    // Try to extract from first 5 pages (more aggressive)
    for (let page = 1; page <= Math.min(5, pageCount); page++) {
      try {
        const pageText = await extractTextFromPDFPageDirect(pdfBuffer, page);
        if (pageText && pageText.trim().length > 30) { // Lower threshold to 30 chars
          extractedText += ' ' + pageText; // Accumulate text from multiple pages
          console.log(`✅ [PAST-PAPER-EXTRACT] Extracted ${pageText.length} chars from page ${page}`);
          // Continue to get more text from more pages if available
          if (extractedText.length > 500) break; // Stop if we have enough text
        }
      } catch (err) {
        console.warn(`⚠️ [PAST-PAPER-EXTRACT] Could not extract from page ${page}: ${err.message}`);
      }
    }

    // ========== STRATEGY 2: Fall back to OCR if direct extraction failed ==========
    if (!extractedText || extractedText.trim().length < 50) {
      console.log(`⚠️ [PAST-PAPER-EXTRACT] Direct extraction insufficient, trying OCR...`);
      try {
        extractedText = await extractTextFromPDFPage(pdfBuffer, 1);
      } catch (err) {
        console.warn(`⚠️ [PAST-PAPER-EXTRACT] Could not OCR page 1:`, err.message);
      }

      // If first page failed, try second page
      if (!extractedText && pageCount > 1) {
        try {
          console.log(`🔄 [PAST-PAPER-EXTRACT] Trying OCR on page 2...`);
          extractedText = await extractTextFromPDFPage(pdfBuffer, 2);
        } catch (err) {
          console.warn(`⚠️ [PAST-PAPER-EXTRACT] Could not OCR page 2:`, err.message);
        }
      }
    }

    // ========== PARSE EXTRACTED TEXT ==========
    const details = parsePastPaperDetails(extractedText);

    // ========== FALLBACK: Extract from filename ONLY for unit_code if missing ==========
    // IMPORTANT: DO NOT use filename for unit_name - only extract from PDF content
    if ((!details.unit_code) && fileName) {
      console.log(`📝 [PAST-PAPER-EXTRACT] Attempting filename parsing for missing unit_code...`);
      const fileNameDetails = parseFileNameForPastPaper(fileName);
      
      // ONLY merge unit_code from filename, NEVER unit_name
      if (fileNameDetails.unit_code && !details.unit_code) {
        details.unit_code = fileNameDetails.unit_code;
        if (!details.confidence.unit_code) {
          details.confidence.unit_code = 0.6; // Lower confidence for filename parsing
        }
        console.log(`📝 [PAST-PAPER-EXTRACT] Extracted unit_code from filename: ${details.unit_code}`);
      }
      
      // Only extract year from filename if PDF extraction failed
      if (!details.year && fileNameDetails.year) {
        details.year = fileNameDetails.year;
        if (!details.confidence.year) {
          details.confidence.year = 0.5; // Lower confidence
        }
      }
    }

    console.log(`✅ [PAST-PAPER-EXTRACT] Extraction complete:`, {
      unit_code: details.unit_code,
      unit_name: details.unit_name,
      unit_name_length: details.unit_name ? details.unit_name.length : 0,
      unit_name_from: details.unit_name ? 'PDF_CONTENT' : 'NOT_FOUND',
      faculty: details.faculty,
      year: details.year,
      semester: details.semester,
      exam_type: details.exam_type,
      confidence: details.confidence
    });
    
    return details;

  } catch (error) {
    console.error(`❌ [PAST-PAPER-EXTRACT] Failed to extract details:`, error.message);
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
 * Extract PREFIX as unit_name and NUMBER as unit_code
 * Expected formats:
 *   - "UCU101-2018-06-18.pdf"
 *   - "APL808_2019.pdf"
 *   - "EAE301-Introduction-2021.pdf"
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

  // Extract PREFIX and NUMBER (e.g., "UCU" and "101" from "UCU101")
  // Patterns: "UCU 101", "UCU101", "UCU-101"
  const codeMatch = baseName.match(/^([A-Z]{2,4})\s*[\-]?\s*(\d{2,4})/i);
  if (codeMatch) {
    details.unit_name = codeMatch[1].toUpperCase(); // PREFIX (e.g., "UCU")
    details.unit_code = codeMatch[2]; // NUMBER (e.g., "101")
  }

  // Try to extract year
  const yearMatch = baseName.match(/(?:20|19)\d{2}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      details.year = year;
    }
  }

  // Try to extract semester
  const semesterMatch = baseName.match(/[_\-\s]([1-3])(?:[_\-\s]|$)/);
  if (semesterMatch) {
    details.semester = semesterMatch[1];
  }

  // Try to extract exam type
  if (/supplementary|supp/i.test(baseName)) details.exam_type = 'Supplementary';
  else if (/\bcat\b/i.test(baseName)) details.exam_type = 'CAT';
  else if (/mock/i.test(baseName)) details.exam_type = 'Mock';

  return details;
}
