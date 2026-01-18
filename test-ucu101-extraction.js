#!/usr/bin/env node
/**
 * Test extraction with actual UCU 101 PDF content
 */

import { parsePastPaperDetails } from './backend/utils/ocrExtractPDF.js';

const testText = `
KENYATTA UNIVERSITY

UNIVERSITY EXAMINATION 2017/2018

DIGITAL SCHOOL OF VIRTUAL AND OPEN LEARNING

SECOND TRIMESTER EXAMINATION FOR THE DEGREE OF
BACHELOR OF ARTS, BACHELOR OF EDUCATION AND BACHELOR
OF SCIENCE

UCU 101: DEVELOPMENT STUDIES

DATE: MONDAY, 18TH JUNE 2018    TIME: 4.30PM-6.30PM

INSTRUCTIONS:

Answer ANY three questions.
`;

console.log('\n' + '='.repeat(70));
console.log('🧪 Testing with Actual UCU 101 PDF Content');
console.log('='.repeat(70) + '\n');

console.log('📄 Test PDF Content:');
console.log('-'.repeat(70));
console.log(testText.slice(0, 300) + '...\n');

const result = parsePastPaperDetails(testText);

console.log('📊 Extraction Results:');
console.log('-'.repeat(70));
console.log(`✅ Unit Code:     ${result.unit_code || '❌ NOT FOUND'}`);
console.log(`✅ Unit Name:     ${result.unit_name || '❌ NOT FOUND'}`);
console.log(`✅ Year:          ${result.year || '❌ NOT FOUND'}`);
console.log(`✅ Faculty:       ${result.faculty || '(none)'}`);
console.log(`✅ Semester:      ${result.semester || '(none)'}`);
console.log(`✅ Exam Type:     ${result.exam_type}`);
console.log('\n📈 Confidence Scores:');
console.log('-'.repeat(70));
Object.entries(result.confidence).forEach(([key, val]) => {
  console.log(`  ${key}: ${(val * 100).toFixed(0)}%`);
});

console.log('\n' + '='.repeat(70));
if (result.unit_code === '101' && result.unit_name === 'UCU') {
  console.log('✅ SUCCESS! Extraction working correctly!');
} else {
  console.log('❌ ISSUE: Not extracting correctly');
  console.log(`Expected: unit_code='101', unit_name='UCU'`);
  console.log(`Got: unit_code='${result.unit_code}', unit_name='${result.unit_name}'`);
}
console.log('='.repeat(70) + '\n');
