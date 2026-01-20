/**
 * Frontend extraction verification
 * Tests the corrected extraction logic
 */

function parseMetadataFromText(text) {
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

  const upperText = text.toUpperCase();

  // Extract Unit Code & Unit Name from code pattern
  const codePatterns = [
    /\b([A-Z]{2,6})\s*[-]?\s*(\d{2,4})\b/,
    /\b([A-Z]{2,6})(\d{2,4})\b/,
    /\b([A-Za-z]+)\s+(\d{3,4})\b/
  ];
  
  for (const pattern of codePatterns) {
    const match = text.match(pattern);
    if (match) {
      const prefix = match[1];
      const digits = match[2];
      if (/^\d{2,4}$/.test(digits)) {
        metadata.unitName = prefix;
        metadata.unitCode = digits;
        console.log(`✅ Extracted unitName (prefix): "${metadata.unitName}", unitCode (digits): "${metadata.unitCode}"`);
        break;
      }
    }
  }

  // Extract Year
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches) {
    for (const yearStr of yearMatches.reverse()) {
      const year = parseInt(yearStr);
      if (year >= 1980 && year <= 2050) {
        metadata.year = year;
        break;
      }
    }
  }

  // Extract Semester
  const semesterPatterns = [
    /(?:SEMESTER|SEM)\s*[:\-]?\s*([1-3])/i,
    /\b(FIRST|SECOND|THIRD)\s+SEMESTER\b/i,
    /SEMESTER\s*[:\-]?\s*(I{1,3})/i
  ];

  for (const pattern of semesterPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let semValue = match[1].toUpperCase();
      if (semValue === 'I') semValue = '1';
      else if (semValue === 'II') semValue = '2';
      else if (semValue === 'III') semValue = '3';
      else if (semValue === 'FIRST') semValue = '1';
      else if (semValue === 'SECOND') semValue = '2';
      else if (semValue === 'THIRD') semValue = '3';

      if (/^[1-3]$/.test(semValue)) {
        metadata.semester = semValue;
        break;
      }
    }
  }

  return metadata;
}

// Test with the example from the PDF
const pdfText = `
KENYATTA UNIVERSITY
UNIVERSITY EXAMINATIONS 2010/2011
FIRST SEMESTER EXAMINATION FOR THE DEGREE OF BACHELOR OF
SCIENCE IN COMPUTER ENGINEERING
SCE 116
ENGINEERING DRAWINGS AND DESIGN II

DATE: FRIDAY 26th NOVEMBER 2010
TIME: 11.00 A.M. - 1.00 P.M.

INSTRUCTIONS
(1) This paper contains FIVE (5) questions.
(ii) You are required to answer THREE (3) questions only.
(iii) Question one is compulsory.
(iv) Attempt any other two questions.
`;

console.log('🧪 FRONTEND EXTRACTION TEST\n');
const result = parseMetadataFromText(pdfText);

console.log('\n✅ Results:');
console.log(`   unitName: "${result.unitName}"`);
console.log(`   unitCode: "${result.unitCode}"`);
console.log(`   year: ${result.year}`);
console.log(`   semester: "${result.semester}"`);

console.log('\n📊 Expected:');
console.log(`   unitName: "SCE"`);
console.log(`   unitCode: "116"`);
console.log(`   year: 2010`);
console.log(`   semester: "1"`);

const pass = (
  result.unitName === 'SCE' &&
  result.unitCode === '116' &&
  result.year === 2010 &&
  result.semester === '1'
);

console.log(`\n${pass ? '✅ PASSED' : '❌ FAILED'}`);
