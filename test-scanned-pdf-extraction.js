/**
 * Test extraction from scanned PDFs
 * Simulates OCR output and tests against the 4 key fields:
 * Unit Name, Unit Code, Year, Semester
 */

// Mock implementation of parsePastPaperDetails for testing
function parsePastPaperDetails(text) {
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

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // UNIT CODE extraction
  const unitCodePatterns = [
    { regex: /\b[A-Z]{2,4}\s+(\d{2,4})\b/, priority: 100 },
    { regex: /\b[A-Z]{2,4}\s*[\-–]\s*(\d{2,4})\b/, priority: 95 },
    { regex: /\b[A-Z]{2,4}(\d{2,4})\b/, priority: 90 },
    // New pattern: handle cases like "BIOLOGY 301" or "Physics 101"
    { regex: /\b[A-Za-z]+\s+(\d{2,4})\b/, priority: 85 },
    { regex: /^(\d{2,4})$/m, priority: 60 },
  ];

  for (const { regex, priority } of unitCodePatterns) {
    const match = text.match(regex);
    if (match) {
      const unitCode = match[1];
      if (/^\d{2,4}$/.test(unitCode)) {
        details.unit_code = unitCode;
        details.confidence.unit_code = 0.9 + (priority / 1000);
        break;
      }
    }
  }

  // UNIT NAME extraction
  const nameCandidates = [];

  if (details.unit_code) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(details.unit_code)) {
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.length < 3 || /^\d+$/.test(nextLine) || /^\d{2,4}$/.test(nextLine)) continue;
          if (/^(EXAMINATION|EXAM|QUESTION|DATE|TIME|DURATION|MARKS|SEMESTER|YEAR|FACULTY|SCHOOL|FIRST|SECOND|THIRD|MAIN|SUPPLEMENTARY|INSTRUCTIONS)/i.test(nextLine)) continue;
          if (/\d{2,}/.test(nextLine)) continue;
          nameCandidates.push({ text: nextLine, score: 95, source: 'after-code' });
          break;
        }
      }
    }
  }

  // Subject keywords
  const subjectKeywords = ['STUDIES', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATHEMATICS', 'ENGLISH', 'HISTORY',
                           'GEOGRAPHY', 'ECONOMICS', 'PSYCHOLOGY', 'SOCIOLOGY', 'PATHOLOGY', 'ZOOLOGY', 'BOTANY',
                           'MEDICINE', 'NURSING', 'ANATOMY', 'LAW', 'BUSINESS', 'ARTS', 'SCIENCE', 'TECHNOLOGY'];

  for (const line of lines) {
    for (const keyword of subjectKeywords) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(line) && !(/\d{2,}/.test(line)) && line.length < 150) {
        nameCandidates.push({ text: line, score: 85, source: 'keyword-match' });
        break;
      }
    }
  }

  if (nameCandidates.length > 0) {
    nameCandidates.sort((a, b) => b.score - a.score);
    const best = nameCandidates[0];
    details.unit_name = best.text;
    details.confidence.unit_name = Math.min(best.score / 100, 0.95);
  }

  // YEAR extraction
  const yearPatterns = [
    { regex: /(?:YEAR|EXAMINATION YEAR|EXAM YEAR)\s*[:\-]?\s*(20\d{2}|19\d{2})/i, priority: 100 },
    { regex: /^(20\d{2}|19\d{2})\s*$/m, priority: 95 },
    { regex: /(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(20\d{2}|19\d{2})/i, priority: 90 },
    { regex: /(20\d{2}|19\d{2})/, priority: 70 }
  ];

  for (const { regex, priority } of yearPatterns) {
    const match = text.match(regex);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 1990 && year <= new Date().getFullYear() + 1) {
        details.year = year;
        details.confidence.year = 0.9 + (priority / 1000);
        break;
      }
    }
  }

  // SEMESTER extraction
  const semesterPatterns = [
    { regex: /(?:SEMESTER|SEM)\s*[:\-]?\s*([1-3])/i, priority: 100 },
    { regex: /\b(?:SEMESTER|SEM)\s*[:\-]?\s*(I{1,3})\b/i, priority: 95 },
    { regex: /\b(FIRST|SECOND|THIRD)\s+SEMESTER\b/i, priority: 90 },
    { regex: /^SEMESTER\s*[:\-]?\s*([1-3])$/im, priority: 85 },
  ];

  for (const { regex, priority } of semesterPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      let semValue = match[1].toUpperCase();
      if (semValue === 'I') semValue = '1';
      else if (semValue === 'II') semValue = '2';
      else if (semValue === 'III') semValue = '3';
      else if (semValue === 'FIRST') semValue = '1';
      else if (semValue === 'SECOND') semValue = '2';
      else if (semValue === 'THIRD') semValue = '3';

      if (/^[1-3]$/.test(semValue)) {
        details.semester = semValue;
        details.confidence.semester = 0.85 + (priority / 1000);
        break;
      }
    }
  }

  return details;
}

// ============= TEST CASES =============
// Based on user's table data: KAS 101 Zoology 2021, HSU 100 Pathology 2022

const testCases = [
  {
    name: 'KAS 101 Zoology 2021',
    ocrText: `
      UNIVERSITY OF NAIROBI
      
      KAS 101
      ZOOLOGY
      
      EXAMINATION YEAR: 2021
      SEMESTER: 2
      MAIN EXAMINATION
      
      Question 1: [starts exam questions]
    `,
    expected: {
      unit_code: '101',
      unit_name: 'ZOOLOGY',
      year: 2021,
      semester: '2'
    }
  },
  {
    name: 'HSU 100 Pathology 2022',
    ocrText: `
      UNIVERSITY OF NAIROBI
      
      HSU - 100
      PATHOLOGY
      
      Year: 2022
      Semester 2
      Main Examination
      
      INSTRUCTIONS TO CANDIDATES
    `,
    expected: {
      unit_code: '100',
      unit_name: 'PATHOLOGY',
      year: 2022,
      semester: '2'
    }
  },
  {
    name: 'BIO 301 2020 Semester 1',
    ocrText: `
      BIOLOGY 301
      
      FIRST SEMESTER EXAMINATION
      2020
      
      BOTANY
      
      Duration: 3 hours
    `,
    expected: {
      unit_code: '301',
      unit_name: 'BOTANY',
      year: 2020,
      semester: '1'
    }
  },
  {
    name: 'CHEM205 Chemistry 2023 Semester 3',
    ocrText: `
      CHEM205
      ORGANIC CHEMISTRY
      
      EXAMINATION: 2023
      SEMESTER III
      SUPPLEMENTARY EXAM
      
      Section A: [questions]
    `,
    expected: {
      unit_code: '205',
      unit_name: 'ORGANIC CHEMISTRY',
      year: 2023,
      semester: '3'
    }
  }
];

// ============= RUN TESTS =============
console.log('🧪 SCANNED PDF EXTRACTION TEST');
console.log('===============================================================================');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📋 Test: ${testCase.name}`);
  
  const result = parsePastPaperDetails(testCase.ocrText);
  
  // Check each field
  const fields = ['unit_code', 'unit_name', 'year', 'semester'];
  let testPassed = true;
  
  for (const field of fields) {
    const expected = testCase.expected[field];
    const actual = result[field];
    const match = actual === expected;
    
    if (!match) {
      testPassed = false;
      console.log(`   ❌ ${field}: expected "${expected}", got "${actual}"`);
    } else {
      console.log(`   ✅ ${field}: "${actual}"`);
    }
  }
  
  if (testPassed) {
    console.log(`✅ PASSED`);
    passed++;
  } else {
    console.log(`❌ FAILED`);
    failed++;
  }
}

console.log('\n===============================================================================');
console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All scanned PDF extraction tests passed!');
} else {
  console.log(`⚠️ ${failed} test(s) failed - review extraction patterns`);
}
