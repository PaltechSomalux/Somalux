/**
 * Test extraction from scanned PDFs - v2
 * Unit Name = PREFIX (SCE, KAS, HSU)
 * Unit Code = DIGITS (116, 101, 100)
 * Year = Examination year
 * Semester = Semester number
 */

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

  // UNIT CODE & UNIT NAME extraction
  const codeNamePatterns = [
    { regex: /\b([A-Z]{2,4})\s+(\d{2,4})\b/, priority: 100 },
    { regex: /\b([A-Z]{2,4})\s*[\-–]\s*(\d{2,4})\b/, priority: 95 },
    { regex: /\b([A-Z]{2,4})(\d{2,4})\b/, priority: 90 },
    { regex: /\b([A-Za-z]+)\s+(\d{2,4})\b/, priority: 85 },
  ];

  for (const { regex, priority } of codeNamePatterns) {
    const match = text.match(regex);
    if (match) {
      const prefix = match[1];
      const number = match[2];
      
      if (/^\d{2,4}$/.test(number)) {
        details.unit_name = prefix;
        details.unit_code = number;
        details.confidence.unit_code = 0.9 + (priority / 1000);
        details.confidence.unit_name = 0.9 + (priority / 1000);
        break;
      }
    }
  }

  // YEAR extraction - smarter logic for year ranges
  // Look for date context first (e.g., "26th March, 2012")
  let dateContextYear = null;
  const dateMatch = text.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+(20\d{2}|19\d{2})/i);
  if (dateMatch) {
    dateContextYear = parseInt(dateMatch[1]);
  }

  if (dateContextYear && dateContextYear >= 1990 && dateContextYear <= new Date().getFullYear() + 1) {
    details.year = dateContextYear;
    details.confidence.year = 0.95;
  } else {
    // Fallback: extract all years and pick the most reasonable one
    const yearMatches = text.match(/(20\d{2}|19\d{2})/g);
    if (yearMatches) {
      // Get unique years
      const uniqueYears = [...new Set(yearMatches.map(y => parseInt(y)))].filter(y => y >= 1990 && y <= new Date().getFullYear() + 1);
      if (uniqueYears.length > 0) {
        // If multiple years, pick the one closest to current date (assuming exams are recent)
        const now = new Date().getFullYear();
        uniqueYears.sort((a, b) => Math.abs(b - now) - Math.abs(a - now));
        details.year = uniqueYears[0];
        details.confidence.year = 0.9;
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
const testCases = [
  {
    name: 'SCE 116 - 2010 First Semester',
    ocrText: `
      KENYATTA UNIVERSITY
      UNIVERSITY EXAMINATIONS 2010/2011
      FIRST SEMESTER EXAMINATION FOR THE DEGREE OF BACHELOR OF
      SCIENCE IN COMPUTER ENGINEERING
      SCE 116
      ENGINEERING DRAWINGS AND DESIGN II
      
      DATE: FRIDAY 26th NOVEMBER 2010
      TIME: 11.00 A.M. - 1.00 P.M.
      
      INSTRUCTIONS
      This paper contains FIVE (5) questions
    `,
    expected: {
      unit_name: 'SCE',
      unit_code: '116',
      year: 2010,
      semester: '1'
    }
  },
  {
    name: 'KAS 101 - 2021 Semester 2',
    ocrText: `
      KENYATTA UNIVERSITY
      EXAMINATION 2021
      
      KAS 101
      ZOOLOGY
      
      SECOND SEMESTER
      EXAMINATION DATE: 25th MAY 2021
      TIME: 2.00 P.M. - 4.00 P.M.
    `,
    expected: {
      unit_name: 'KAS',
      unit_code: '101',
      year: 2021,
      semester: '2'
    }
  },
  {
    name: 'HSU 100 - 2022 Semester 2',
    ocrText: `
      UNIVERSITY EXAMINATION
      HSU - 100
      PATHOLOGY
      
      Year: 2022
      Semester II
      Main Examination
      
      Duration: 3 hours
    `,
    expected: {
      unit_name: 'HSU',
      unit_code: '100',
      year: 2022,
      semester: '2'
    }
  },
  {
    name: 'BIO 301 - 2020 Semester 1',
    ocrText: `
      UNIVERSITY EXAMINATION 2020
      
      BIO 301
      BOTANY
      
      FIRST SEMESTER EXAMINATION
      
      Date: 10th November 2020
      Duration: 3 hours
    `,
    expected: {
      unit_name: 'BIO',
      unit_code: '301',
      year: 2020,
      semester: '1'
    }
  },
  {
    name: 'SCO 231 - 2023 Semester 2',
    ocrText: `
      KENYATTA UNIVERSITY
      EXAMINATION FOR THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER
      SCIENCE AND BACHELOR OF SCIENCE IN MATHEMATICS AND
      COMPUTER SCIENCE
      
      SCO 231: OPERATING SYSTEMS
      
      2ND SEMESTER 2023/2024
      TIME: 2 HOURS
      
      INSTRUCTIONS: Answer ALL the FOUR Questions.
      
      QUESTION ONE
      a) Suppose that we have free segments with sizes: 6,17,25,14 and 19.
    `,
    expected: {
      unit_name: 'SCO',
      unit_code: '231',
      year: 2023,
      semester: '2'
    }
  },
  {
    name: 'SIT 300 - 2012 Semester 2',
    ocrText: `
      KENYATTA UNIVERSITY
      KIST CAMPUS
      UNIVERSITY EXAMINATIONS 2011/2012
      SECOND SEMESTER EXAMINATION FOR THE DEGREE OF BACHELOR
      OF INFORMATION TECHNOLOGY
      
      SIT 300: COMPONENT PROGRAMMING
      
      DATE: Monday, 26th March, 2012         TIME: 2.00 p.m. - 4.00 p.m.
      
      INSTRUCTIONS: Attempt question ONE and any other TWO questions.
      
      QUESTION 1
      a) Define the term Component Programming (2 marks)
      b) Explain three major features of Components (6 marks)
      c) State two component technologies used in Java programming language (2 marks)
    `,
    expected: {
      unit_name: 'SIT',
      unit_code: '300',
      year: 2012,
      semester: '2'
    }
  }
];

// ============= RUN TESTS =============
console.log('🧪 SCANNED PDF EXTRACTION TEST (v2)');
console.log('===============================================================================');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📋 Test: ${testCase.name}`);
  
  const result = parsePastPaperDetails(testCase.ocrText);
  
  const fields = ['unit_name', 'unit_code', 'year', 'semester'];
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
