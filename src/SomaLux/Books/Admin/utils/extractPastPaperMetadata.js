import * as pdfjsLib from 'pdfjs-dist';

/**
 * Extract metadata from past paper PDF
 * Reads first page and extracts: university, faculty, unit code, year, exam type
 */
export async function extractPastPaperMetadata(pdfFile) {
  try {
    // Set up PDF.js worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract text from first 2 pages
    let fullText = '';
    const pagesToRead = Math.min(2, pdfDoc.numPages);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return parseMetadataFromText(fullText, pdfFile.name);
  } catch (error) {
    console.warn('PDF extraction failed, falling back to filename parsing:', error);
    return parseMetadataFromFilename(pdfFile.name);
  }
}

/**
 * Parse metadata from extracted text
 */
function parseMetadataFromText(text, filename) {
  const metadata = {
    university: null,
    faculty: null,
    unitCode: null,
    unitName: null,
    year: null,
    semester: null,
    examType: null,
    source: 'text'
  };

  // Convert to uppercase for pattern matching
  const upperText = text.toUpperCase();

  // Extract University - look for common patterns
  const universityPatterns = [
    /UNIVERSITY\s+OF\s+([A-Z\s]+?)(?:\n|EXAMINATION|EXAM|PAPER|FACULTY|SCHOOL|DEPARTMENT|$)/i,
    /([A-Z\s]+?)\s+UNIVERSITY(?:\n|\s|EXAMINATION|EXAM|FACULTY|SCHOOL|DEPARTMENT|$)/i,
  ];

  for (const pattern of universityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Clean up extracted text
      if (extracted.length > 3) { // Avoid very short matches
        metadata.university = extracted;
        break;
      }
    }
  }

  // Extract Faculty/School - more flexible patterns - ENHANCED
  const facultyPatterns = [
    /FACULTY\s+OF\s+([A-Z\s&,]+?)(?:\n|EXAMINATION|EXAM|PAPER|COURSE|UNIT|$)/i,
    /SCHOOL\s+OF\s+([A-Z\s&,]+?)(?:\n|EXAMINATION|EXAM|PAPER|COURSE|UNIT|$)/i,
    /DEPARTMENT\s+OF\s+([A-Z\s&,]+?)(?:\n|EXAMINATION|EXAM|PAPER|COURSE|UNIT|$)/i,
    /COLLEGE\s+OF\s+([A-Z\s&,]+?)(?:\n|EXAMINATION|EXAM|PAPER|COURSE|UNIT|$)/i,
    /(?:FACULTY|SCHOOL|DEPARTMENT|COLLEGE):\s*([A-Z\s&,]+?)(?:\n|EXAMINATION|EXAM)/i,
    // Pattern: look for subject/faculty after university name
    /(?:UNIVERSITY.*?\n)((?:[A-Z][A-Z\s&,]+?))\s*(?:EXAMINATION|EXAM|$)/i
  ];

  for (const pattern of facultyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Clean up extracted text - remove common artifacts
      let cleaned = extracted
        .replace(/\d+/g, '') // Remove numbers
        .replace(/\s{2,}/g, ' ') // Normalize whitespace
        .trim();
      
      // Only accept if it looks like a faculty name (not too short, not too long)
      if (cleaned.length > 3 && cleaned.length < 100 && !cleaned.match(/^(AND|OR|THE|A|EXAMINATION|EXAM)$/i)) {
        metadata.faculty = cleaned;
        break;
      }
    }
  }

  // Extract Unit Code (usually 4-6 letters followed by 2-3 digits)
  const codeMatch = text.match(/([A-Z]{2,6}\s*\d{3,4})/);
  if (codeMatch) {
    metadata.unitCode = codeMatch[1].replace(/\s+/g, '');
  }

  // Extract Unit Name (usually follows the code)
  const nameMatch = text.match(/(?:[A-Z]{2,6}\s*\d{3,4})[:\s]+([A-Z][A-Za-z\s&,\-]+?)(?:\n|EXAMINATION|EXAM|COURSE CODE)/i);
  if (nameMatch) {
    metadata.unitName = nameMatch[1].trim();
  }

  // Extract Year (4 digits)
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[0]);
  }

  // Extract Semester
  const semesterMatch = text.match(/SEMESTER\s*:?\s*([1-3])/i) || 
                        text.match(/FIRST SEMESTER/i) ||
                        text.match(/SECOND SEMESTER/i) ||
                        text.match(/THIRD SEMESTER/i);
  if (semesterMatch) {
    if (semesterMatch[0].includes('FIRST')) metadata.semester = '1';
    else if (semesterMatch[0].includes('SECOND')) metadata.semester = '2';
    else if (semesterMatch[0].includes('THIRD')) metadata.semester = '3';
    else metadata.semester = semesterMatch[1];
  }

  // Extract Exam Type
  const examTypePatterns = [
    /(?:MAIN|SUPPLEMENTARY|SUPPLEMENTAL|CAT|CONTINUOUS ASSESSMENT|MOCK|MIDTERM)/i
  ];

  for (const pattern of examTypePatterns) {
    const match = text.match(pattern);
    if (match) {
      const typeStr = match[0].toUpperCase();
      if (typeStr.includes('MAIN')) metadata.examType = 'Main';
      else if (typeStr.includes('SUPPLEMENTARY') || typeStr.includes('SUPPLEMENTAL')) metadata.examType = 'Supplementary';
      else if (typeStr.includes('CAT') || typeStr.includes('CONTINUOUS')) metadata.examType = 'CAT';
      else if (typeStr.includes('MOCK')) metadata.examType = 'Mock';
      break;
    }
  }

  // Fall back to filename if extraction failed
  if (!metadata.unitCode || !metadata.year) {
    const fallback = parseMetadataFromFilename(filename);
    metadata.unitCode = metadata.unitCode || fallback.unitCode;
    metadata.unitName = metadata.unitName || fallback.unitName;
    metadata.year = metadata.year || fallback.year;
    metadata.semester = metadata.semester || fallback.semester;
    metadata.examType = metadata.examType || fallback.examType;
  }

  return metadata;
}

/**
 * Parse metadata from filename
 * Format: UNITCODE_UnitName_2023_1_Main.pdf
 */
function parseMetadataFromFilename(filename) {
  const metadata = {
    university: null,
    faculty: null,
    unitCode: null,
    unitName: null,
    year: null,
    semester: null,
    examType: null,
    source: 'filename'
  };

  const fileNameWithoutExt = filename.replace('.pdf', '').replace(/\.[a-z]+$/i, '');
  const parts = fileNameWithoutExt.split('_');

  if (parts.length >= 5) {
    metadata.unitCode = parts[0] || null;
    metadata.unitName = parts[1] || null;
    metadata.year = parts[2] ? parseInt(parts[2]) : null;
    metadata.semester = parts[3] || null;
    metadata.examType = parts[4] || 'Main';
  }

  return metadata;
}

/**
 * Find matching university by name (fuzzy match)
 * @param {string} extractedUniversity - Extracted university name
 * @param {Array} universities - List of available universities [{id, name}, ...]
 * @returns {string|null} - Matched university ID or null
 */
export function findMatchingUniversity(extractedUniversity, universities) {
  if (!extractedUniversity || !universities.length) return null;

  const extracted = extractedUniversity.toUpperCase().trim();
  
  // Exact or substring match
  for (const uni of universities) {
    const uniName = uni.name.toUpperCase();
    if (uniName.includes(extracted) || extracted.includes(uniName)) {
      return uni.id;
    }
  }

  // Fuzzy match - count matching words
  const extractedWords = extracted.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const uni of universities) {
    const uniWords = uni.name.toUpperCase().split(/\s+/);
    let matchCount = 0;
    
    for (const word of extractedWords) {
      if (uniWords.some(w => w.includes(word) || word.includes(w))) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(extractedWords.length, uniWords.length);
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = uni.id;
    }
  }

  return bestMatch;
}

/**
 * Find matching faculty by name
 * @param {string} extractedFaculty - Extracted faculty name
 * @param {Array} faculties - List of available faculties [string, ...]
 * @returns {string|null} - Matched faculty or null
 */
export function findMatchingFaculty(extractedFaculty, faculties) {
  if (!extractedFaculty || !faculties.length) return null;

  const extracted = extractedFaculty.toUpperCase().trim();

  // Exact or substring match
  for (const fac of faculties) {
    const facName = fac.toUpperCase();
    if (facName.includes(extracted) || extracted.includes(facName)) {
      return fac;
    }
  }

  // Fuzzy match
  const extractedWords = extracted.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const fac of faculties) {
    const facWords = fac.toUpperCase().split(/\s+/);
    let matchCount = 0;
    
    for (const word of extractedWords) {
      if (facWords.some(w => w.includes(word) || word.includes(w))) {
        matchCount++;
      }
    }

    const score = matchCount / Math.max(extractedWords.length, facWords.length);
    if (score > bestScore && score > 0.6) {
      bestScore = score;
      bestMatch = fac;
    }
  }

  return bestMatch;
}

/**
 * Intelligently guess faculty/department from unit code
 * Common patterns: CHEM→Chemistry, BIO→Biology, MATH→Mathematics, etc.
 */
export function guessFacultyFromUnitCode(unitCode, unitName) {
  if (!unitCode) return null;
  
  const code = (unitCode || '').toUpperCase();
  const name = (unitName || '').toUpperCase();
  
  // Map common unit code prefixes to faculties
  const codeToFaculty = {
    // Sciences
    'CHEM': 'Chemistry',
    'BIO': 'Biology',
    'PHYS': 'Physics',
    'MATH': 'Mathematics',
    'STAT': 'Statistics',
    'GEO': 'Geology',
    'BOT': 'Botany',
    'ZOO': 'Zoology',
    
    // Engineering
    'ENG': 'Engineering',
    'MECH': 'Mechanical Engineering',
    'ELEC': 'Electrical Engineering',
    'CIVI': 'Civil Engineering',
    'COMP': 'Computer Science/Engineering',
    'ICT': 'Information & Communication Technology',
    'IT': 'Information Technology',
    'CS': 'Computer Science',
    'SE': 'Software Engineering',
    
    // Humanities & Social Sciences
    'ENG': 'English',
    'HIST': 'History',
    'GEOG': 'Geography',
    'SOC': 'Sociology',
    'ECON': 'Economics',
    'POLI': 'Political Science',
    'PSYCH': 'Psychology',
    'PHIL': 'Philosophy',
    'LAW': 'Law',
    
    // Business & Management
    'BUS': 'Business',
    'MGMT': 'Management',
    'ACC': 'Accounting',
    'FIN': 'Finance',
    'MARK': 'Marketing',
    'HR': 'Human Resources',
    
    // Healthcare
    'MED': 'Medicine',
    'NURS': 'Nursing',
    'PHARM': 'Pharmacy',
    'DENT': 'Dentistry',
    
    // Agriculture
    'AGR': 'Agriculture',
    'AGBM': 'Agriculture Business Management',
    
    // Education
    'EDU': 'Education',
    'SOCI': 'Education / Sociology'
  };
  
  // Try exact code prefix match
  for (const [prefix, faculty] of Object.entries(codeToFaculty)) {
    if (code.startsWith(prefix)) {
      return faculty;
    }
  }
  
  // Try matching unit name against faculty keywords
  if (name) {
    for (const [prefix, faculty] of Object.entries(codeToFaculty)) {
      if (name.includes(prefix.toUpperCase())) {
        return faculty;
      }
    }
  }
  
  return null;
}

