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

    // Extract text from first 3 pages (increased from 2 to get more context)
    let fullText = '';
    const pagesToRead = Math.min(3, pdfDoc.numPages);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      // Preserve more structure - join with spaces but add newlines for layout
      const textItems = textContent.items.map(item => item.str);
      let pageText = '';
      
      let currentLine = '';
      for (const item of textItems) {
        // If item is empty or just whitespace, it might signal a line break
        if (item.trim()) {
          currentLine += item + ' ';
        } else if (currentLine.trim()) {
          // Line break detected
          pageText += currentLine.trim() + '\n';
          currentLine = '';
        }
      }
      
      // Add any remaining text
      if (currentLine.trim()) {
        pageText += currentLine.trim() + '\n';
      }
      
      // Add separator between pages
      fullText += pageText + '\n\n';
    }

    return parseMetadataFromText(fullText, pdfFile.name);
  } catch (error) {
    console.warn('PDF extraction failed, falling back to filename parsing:', error);
    return parseMetadataFromFilename(pdfFile.name);
  }
}

/**
 * Parse metadata from extracted text - PDF ONLY, NO FILENAME FALLBACK
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

  // Log raw PDF content for debugging
  console.log('📄 RAW PDF TEXT (first 500 chars):', text.substring(0, 500));
  console.log('📄 TOTAL PDF TEXT LENGTH:', text.length, 'chars');

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
  // More flexible pattern to catch variations like "CS 101", "CS-101", "CS101", etc.
  const codePatterns = [
    /\b([A-Z]{2,6}\s*[-]?\s*\d{3,4})\b/,
    /\b([A-Z]{2,6}\d{3,4})\b/,
    /\b([A-Z]+\d{3,4})\b/
  ];
  
  for (const pattern of codePatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.unitCode = match[1].replace(/\s+/g, '').replace('-', '');
      break;
    }
  }

  // Extract Unit Name (the full course/unit name) - FROM PDF ONLY
  // CRITICAL: Much more aggressive extraction with multiple fallback patterns
  // The unit name MUST come from PDF content, never from filename
  
  // First, collect ALL lines from text - don't filter too early, we'll validate later
  const allLines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0); // Keep even short lines for context
  
  console.log(`\n🔍 UNIT NAME EXTRACTION - Scanning ${allLines.length} lines`);
  console.log('🔝 First 20 lines of PDF:');
  allLines.slice(0, 20).forEach((line, idx) => console.log(`  [${idx}] "${line}"`));
  
  // Build a comprehensive list of patterns with scores
  const candidateNames = [];
  
  // SECTION 1: EXPLICIT PATTERNS - highest confidence
  const highPriorityPatterns = [
    { regex: /(?:COURSE|UNIT|SUBJECT|MODULE|PAPER)\s*(?:TITLE|NAME)?[:\s]+([A-Z][A-Za-z0-9\s&,\-()./]{3,150}?)(?:\n|$|EXAMINATION|EXAM|CODE|DURATION|DATE)/i, score: 100, name: 'explicit-label' },
    { regex: /(?:[A-Z]{2,6}\s*[-]?\s*\d{3,4})\s*[:\/\-]\s*([A-Z][A-Za-z0-9\s&,\-()./]{3,150}?)(?:\n|$|EXAMINATION|EXAM)/i, score: 95, name: 'code-after' },
    { regex: /(?:CODE|COURSE|UNIT)[:\s]+[A-Z0-9\-\s]*\n\s*([A-Z][A-Za-z\s&,\-()./]{4,150}?)(?:\n|$)/i, score: 90, name: 'code-line' }
  ];
  
  for (const { regex, score, name } of highPriorityPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      let extracted = match[1].trim()
        .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '')
        .replace(/\d{1,2}:\d{2}/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      if (extracted.length >= 3 && extracted.length <= 200 && /[A-Za-z]/.test(extracted)) {
        candidateNames.push({ text: extracted, score, source: name });
        console.log(`✅ PATTERN MATCH [${name}] (${score}): "${extracted}"`);
      }
    }
  }
  
  // SECTION 2: SCAN ALL LINES - aggressive line-by-line search
  console.log('\n📋 Scanning all lines for course-like content...');
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const prevLine = i > 0 ? allLines[i-1] : '';
    
    // Skip obvious non-course lines
    if (/^(EXAMINATION|EXAM|QUESTION|SECTION|INSTRUCTIONS|DATE|TIME|DURATION|MARKS|PAPER|ANSWER|MAIN|SUPPLEMENTARY|FOR OFFICIAL|Page|Confidential|Total|TOTAL|marks?|MARKS|Semester|SEM|UNIVERSITY|FACULTY|SCHOOL|INSTITUTE|DEPARTMENT|COLLEGE)$/i.test(line)) {
      continue;
    }
    
    if (/^\d+$/.test(line)) continue; // Pure numbers
    if (/^[A-Z0-9\-\.]+$/.test(line) && line.length < 10) continue; // Code-like
    if (line.length < 3) continue; // Too short
    
    // STRATEGY 1: Line directly after unit code (VERY HIGH CONFIDENCE)
    if (metadata.unitCode && prevLine.toUpperCase().includes(metadata.unitCode.toUpperCase())) {
      if (/[A-Za-z]/.test(line) && !(/^[A-Z0-9]+$/.test(line) && line.length < 10)) {
        candidateNames.push({ text: line, score: 92, source: 'direct-after-code', lineNum: i });
        console.log(`✅ [after-code at line ${i}] (92): "${line}"`);
      }
    }
    
    // STRATEGY 2: Multi-word capitalized lines (GOOD INDICATOR)
    if (/^[A-Z]/.test(line) && line.split(/\s+/).length >= 2 && line.length >= 5 && line.length <= 200) {
      if (!/^(SECTION|INSTRUCTIONS|QUESTION|ATTEMPT|ANSWER|EXAMINATION|FOR|CONFIDENTIAL)/i.test(line)) {
        candidateNames.push({ text: line, score: 75, source: 'cap-multiword', lineNum: i });
      }
    }
    
    // STRATEGY 3: Lines with mixture of letters and spaces (probably course names)
    if (/[A-Za-z\s]{4,}/.test(line) && line.split(/\s+/).length >= 2 && /[a-z]/.test(line) && line.length >= 5 && line.length <= 200) {
      if (!/^(EXAMINATION|EXAM|DATE|TIME|DURATION|MARKS|QUESTION|SECTION|PAPER|INSTRUCTIONS|ANSWER|MAIN|SUPPLEMENTARY)$/i.test(line)) {
        candidateNames.push({ text: line, score: 60, source: 'mixed-case', lineNum: i });
      }
    }
  }
  
  console.log(`\n📊 Total candidates found: ${candidateNames.length}`);
  if (candidateNames.length > 0) {
    const topCandidates = candidateNames
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(c => `"${c.text}" (${c.score})`);
    console.log(`🔝 Top 10 candidates:\n  ${topCandidates.join('\n  ')}`);
  }
  
  // SECTION 3: SELECT BEST CANDIDATE
  if (candidateNames.length > 0) {
    // Sort by score (descending), then by length preference
    candidateNames.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Prefer medium-length names (30-100 chars)
      const aLenScore = Math.abs(a.text.length - 60);
      const bLenScore = Math.abs(b.text.length - 60);
      return aLenScore - bLenScore;
    });
    
    console.log('\n✅ VALIDATION: Checking candidates in order...');
    for (const candidate of candidateNames) {
      const text = candidate.text;
      console.log(`  Checking: "${text}" (score: ${candidate.score})...`);
      
      // Final validation: reject only if obviously invalid
      if (/^\d+$/.test(text)) {
        console.log(`    ❌ REJECT: Pure numbers`);
        continue;
      }
      if (/^(EXAMINATION|EXAM|COURSE|UNIT|DATE|TIME|SEMESTER|SEM|DOCUMENT|SECTION|QUESTION|MAIN|SUPPLEMENTARY|FOR|CONFIDENTIAL|PAGE|FACULTY|SCHOOL|INSTITUTE|UNIVERSITY|DEPARTMENT|COLLEGE)$/i.test(text)) {
        console.log(`    ❌ REJECT: Generic metadata term`);
        continue;
      }
      if (/^[A-Z0-9\-]+$/.test(text) && text.length < 10) {
        console.log(`    ❌ REJECT: Code-like string`);
        continue;
      }
      if (text.length < 3) {
        console.log(`    ❌ REJECT: Too short`);
        continue;
      }
      
      // Accept this candidate!
      metadata.unitName = text;
      console.log(`\n✅✅✅ SELECTED UNIT NAME: "${text}" (score: ${candidate.score}, source: ${candidate.source})`);
      break;
    }
  }
  
  // If still no unit name found, log it clearly
  if (!metadata.unitName) {
    console.warn(`\n⚠️⚠️⚠️ UNIT NAME NOT FOUND - No valid candidates passed validation`);
    console.warn(`Available candidates were: ${candidateNames.map(c => c.text).join(', ')}`);
  }

  // Extract Year (4 digits, prioritize years in reasonable range 1980-2050)
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches) {
    // Filter for reasonable exam years and prefer more recent ones
    for (const yearStr of yearMatches.reverse()) {
      const year = parseInt(yearStr);
      if (year >= 1980 && year <= 2050) {
        metadata.year = year;
        break;
      }
    }
  }
  
  // Fallback: if no 4-digit year found, look for 2-digit years preceded by certain contexts
  if (!metadata.year) {
    const twoDigitYearMatch = text.match(/(?:Year|year|YEAR|Date|date|DATE)[:\s]+['\`]?(\d{2})(?:\s|['\`]|$)/);
    if (twoDigitYearMatch) {
      const twoDigit = parseInt(twoDigitYearMatch[1]);
      // Assume 00-30 is 2000s, 31-99 is 1900s
      metadata.year = twoDigit <= 30 ? 2000 + twoDigit : 1900 + twoDigit;
    }
  }

  // Extract Semester - more robust patterns
  const semesterPatterns = [
    { pattern: /SEMESTER\s*:?\s*([1-3])/i, group: 1 },
    { pattern: /SEM\s*:?\s*([1-3])/i, group: 1 },
    { pattern: /(FIRST|SECOND|THIRD)\s+SEMESTER/i, test: (match) => {
        if (match[1].toUpperCase() === 'FIRST') return '1';
        if (match[1].toUpperCase() === 'SECOND') return '2';
        if (match[1].toUpperCase() === 'THIRD') return '3';
        return null;
      }
    }
  ];

  for (const { pattern, group, test } of semesterPatterns) {
    const match = text.match(pattern);
    if (match) {
      metadata.semester = test ? test(match) : match[group];
      if (metadata.semester) break;
    }
  }

  // Extract Exam Type - more comprehensive patterns
  const examTypePatterns = [
    { pattern: /\b(MAIN|MAINEXAMINATION)\b/i, type: 'Main' },
    { pattern: /\b(SUPPLEMENTARY|SUPPLEMENTAL|SUPP)\b/i, type: 'Supplementary' },
    { pattern: /\b(CAT|CONTINUOUS\s*ASSESSMENT|CONTINUOUS\s*ASSESSMENT\s*TEST)\b/i, type: 'CAT' },
    { pattern: /\b(MOCK|MOCKEXAMINATION)\b/i, type: 'Mock' },
    { pattern: /\b(MIDTERM|MID\s*TERM)\b/i, type: 'Midterm' },
    { pattern: /EXAMINATION\s+TYPE[:\s]+([\w\s]+?)(?:\n|$)/i, type: null, group: 1 }
  ];

  for (const { pattern, type, group } of examTypePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (group) {
        // Custom group processing
        const extracted = match[group].trim().replace(/\s+/g, ' ');
        // Capitalize each word
        metadata.examType = extracted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else {
        metadata.examType = type;
      }
      break;
    }
  }

  // ⚠️ IMPORTANT: PDF-ONLY EXTRACTION - NO FILENAME FALLBACK
  // The system should extract EVERYTHING from PDF content only
  // Do NOT use filename for any metadata
  console.log('📊 PDF Extraction Complete. Extracted metadata:', {
    unitCode: metadata.unitCode,
    unitName: metadata.unitName,
    year: metadata.year,
    semester: metadata.semester,
    examType: metadata.examType
  });

  // If unit name is empty or just looks like a code, try harder to extract from PDF
  if (!metadata.unitName) {
    console.log('🔍 Unit name not found with primary patterns, attempting aggressive extraction...');
    
    // Get all substantial lines from the text
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    // AGGRESSIVE STRATEGY 1: Context-based extraction around unit code
    if (metadata.unitCode) {
      let foundCodeIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toUpperCase().includes(metadata.unitCode.toUpperCase())) {
          foundCodeIdx = i;
          break;
        }
      }
      
      if (foundCodeIdx >= 0) {
        // Scan the next 10 lines for the course name
        const searchRange = Math.min(10, lines.length - foundCodeIdx - 1);
        for (let offset = 1; offset <= searchRange; offset++) {
          const line = lines[foundCodeIdx + offset];
          
          // Skip metadata/section headers
          if (/^(EXAMINATION|EXAM|QUESTION|SECTION|INSTRUCTIONS|DATE|TIME|DURATION|MARKS|SEMESTER|ANSWER|ATTEMPT|ANSWER|SECTION|INSTRUCTIONS|FOR OFFICIAL|CONFIDENTIAL|Page)/i.test(line)) continue;
          
          // Skip pure numbers
          if (/^\d+$/.test(line)) continue;
          
          // Skip code-like strings
          if (/^[A-Z0-9]+$/.test(line) && line.length < 10) continue;
          
          // Skip very short lines (likely not course name)
          if (line.length < 4) continue;
          
          // This could be the course name
          if (/[A-Za-z]/.test(line)) {
            metadata.unitName = line;
            console.log('✅ Extracted unit name (strategy 1 - code context):', metadata.unitName);
            break;
          }
        }
      }
    }
    
    // AGGRESSIVE STRATEGY 2: Scan for any substantial title-case multi-word phrase
    if (!metadata.unitName) {
      for (const line of lines) {
        // Must have multiple words or be reasonably long
        const words = line.split(/\s+/);
        if (words.length < 2 && line.length < 8) continue;
        
        // Skip metadata lines
        if (/^(EXAMINATION|EXAM|DATE|TIME|DURATION|MARKS|QUESTION|SECTION|PAPER|INSTRUCTIONS|ANSWER|MAIN|SUPPLEMENTARY|FOR|CONFIDENTIAL|Page|\d+|[A-Z0-9]+)$/i.test(line)) continue;
        
        // Skip if it's just the unit code
        if (metadata.unitCode && line.toUpperCase().includes(metadata.unitCode.toUpperCase()) && line.length < 20) continue;
        
        // Accept if it looks like a course name (has letters, reasonable length, not all caps code)
        if (/[A-Za-z]/.test(line) && line.length > 3 && line.length < 200 && !(/^[A-Z0-9]+$/.test(line) && line.length < 10)) {
          metadata.unitName = line;
          console.log('✅ Extracted unit name (strategy 2 - scan):', metadata.unitName);
          break;
        }
      }
    }
    
    // AGGRESSIVE STRATEGY 3: Look for any capitalized sequence that's not metadata
    if (!metadata.unitName) {
      const textLines = text.split('\n');
      for (const line of textLines) {
        const trimmed = line.trim();
        
        // Must have content
        if (trimmed.length < 4) continue;
        
        // Skip pure metadata indicators
        if (/(EXAMINATION|EXAM|QUESTIONS|INSTRUCTIONS|TIME|DATE|DURATION|MARKS|Page|For official|Confidential|ANSWER)/i.test(trimmed)) continue;
        
        // Prefer lines that start with capital and have multiple words
        if (/^[A-Z]/.test(trimmed) && trimmed.includes(' ') && !(/^[A-Z0-9\-]+$/.test(trimmed))) {
          // Clean up any trailing non-letter characters
          let cleaned = trimmed.replace(/[\d\(\)\[\]]+\s*$/, '').trim();
          
          if (cleaned.length > 3 && /[A-Za-z]/.test(cleaned) && cleaned.length < 200) {
            metadata.unitName = cleaned;
            console.log('✅ Extracted unit name (strategy 3 - capitalized):', metadata.unitName);
            break;
          }
        }
      }
    }
  }

  // If unit name is just a code (numeric only or all caps code), clear it and try again
  if (metadata.unitName && /^[A-Z0-9]+$/.test(metadata.unitName) && metadata.unitName.length < 10) {
    console.warn('⚠️ Unit name looks like a code, clearing and retrying:', metadata.unitName);
    metadata.unitName = null;
    
    // Final desperate attempt: get ANY substantial text from the PDF
    if (!metadata.unitName) {
      const textLines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5 && l.length < 200 && /[A-Za-z]/.test(l) && !/^(EXAMINATION|EXAM|DATE|TIME|PAGE|FOR|CONFIDENTIAL|ANSWER|QUESTION|SECTION|INSTRUCTIONS|\d+|[A-Z0-9]+)$/i.test(l));
      
      if (textLines.length > 0) {
        // Pick the line that's most likely to be a course name (multi-word, mixed case)
        for (const line of textLines) {
          if (line.includes(' ') && !(/^[A-Z0-9\-]+$/.test(line))) {
            metadata.unitName = line;
            console.log('✅ Extracted unit name (final fallback):', metadata.unitName);
            break;
          }
        }
        
        // If still nothing, just take first substantial line
        if (!metadata.unitName && textLines.length > 0) {
          metadata.unitName = textLines[0];
          console.log('✅ Extracted unit name (last resort):', metadata.unitName);
        }
      }
    }
  }

  // Log final extraction status
  if (!metadata.unitName) {
    console.warn('⚠️ Unable to extract unit name from PDF');
  } else if (metadata.source === 'filename') {
    console.info('ℹ️ Using filename as fallback (PDF extraction may have failed)');
  }

  return metadata;
}

/**
 * Parse metadata from filename
 * Supports multiple formats:
 * - UNITCODE_UnitName_2023_1_Main.pdf
 * - UNITCODEYEARSEMESTER.pdf (compact format)
 * - UCU101_Management_2023_1.pdf
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
  
  // Try standard delimited format first: CODE_NAME_YEAR_SEM_TYPE
  if (fileNameWithoutExt.includes('_')) {
    const parts = fileNameWithoutExt.split('_');
    if (parts.length >= 2) {
      metadata.unitCode = parts[0] || null;
      metadata.unitName = parts[1] || null;
      if (parts.length >= 3) metadata.year = parts[2] ? parseInt(parts[2]) : null;
      if (parts.length >= 4) metadata.semester = parts[3] || null;
      if (parts.length >= 5) metadata.examType = parts[4] || 'Main';
    }
  } else {
    // Try compact format: codes followed by numbers
    // E.g., "UCU10320171201" -> code=UCU101, year=2017, semester=1, etc.
    const match = fileNameWithoutExt.match(/^([A-Z]+\d{3,4})(\d{4})(\d)(\d{2})$/);
    if (match) {
      metadata.unitCode = match[1];
      metadata.year = parseInt(match[2]);
      metadata.semester = match[3];
      // Don't set unitName from this format as it doesn't contain it
    }
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

