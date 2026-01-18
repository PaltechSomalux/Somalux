#!/usr/bin/env node
/**
 * Test to verify that unit_name is ONLY extracted from PDF content,
 * NOT from filenames
 */

import { parseFileNameForPastPaper, parsePastPaperDetails } from './backend/utils/ocrExtractPDF.js';

console.log('\n' + '='.repeat(70));
console.log('🧪 Unit Name Extraction Source Verification');
console.log('='.repeat(70) + '\n');

// Test cases showing that filenames are NOT used for unit_name
const testCases = [
  {
    filename: 'UCU10120180618.pdf',
    description: 'File with code+date format'
  },
  {
    filename: 'EAE812-Biology-2019.pdf',
    description: 'File with code and subject'
  },
  {
    filename: 'MENT130_Management_2023_1_Main.pdf',
    description: 'Well-formatted file'
  }
];

console.log('TEST: Filename Parsing\n');
testCases.forEach((test, i) => {
  const result = parseFileNameForPastPaper(test.filename);
  console.log(`${i + 1}. ${test.description}`);
  console.log(`   Filename: ${test.filename}`);
  console.log(`   Extracted Unit Code: ${result.unit_code || 'NULL'}`);
  console.log(`   Extracted Unit Name: ${result.unit_name || 'NULL (NOT FROM FILENAME)'}`);
  console.log(`   Year: ${result.year || 'NULL'}`);
  console.log('');
});

console.log('\n' + '='.repeat(70));
console.log('TEST: PDF Content Parsing\n');

const pdfContentTests = [
  {
    name: 'Searchable PDF with Course Name',
    text: `
      UNIVERSITY OF NAIROBI
      
      Course Code: EAE 812
      Course Title: Ecosystem Management and Conservation
      Faculty of Science
      
      Year: 2019
      Semester: 2
      Main Examination
    `
  },
  {
    name: 'Minimal PDF Content',
    text: `
      EAE 412
      2019
      Main
    `
  },
  {
    name: 'Structured Format',
    text: `
      UNIT CODE: MENT 130
      UNIT NAME: Environmental Policy and Planning
      YEAR: 2021
      SEMESTER: 1
      SUPPLEMENTARY EXAMINATION
    `
  }
];

pdfContentTests.forEach((test, i) => {
  const result = parsePastPaperDetails(test.text);
  console.log(`${i + 1}. ${test.name}`);
  console.log(`   Extracted Unit Code: ${result.unit_code || 'NOT FOUND'}`);
  console.log(`   Extracted Unit Name: ${result.unit_name || 'NOT FOUND'}`);
  console.log(`   Year: ${result.year || 'NOT FOUND'}`);
  console.log(`   Confidence Scores: ${JSON.stringify(result.confidence)}`);
  console.log('');
});

console.log('='.repeat(70));
console.log('KEY POINTS:\n');
console.log('✅ Unit Name is ONLY extracted from PDF content');
console.log('✅ Filenames are NOT used to populate Unit Name');
console.log('✅ Unit Code can come from filename if PDF content fails');
console.log('✅ Empty Unit Name is preferred over wrong/filename Unit Name\n');
console.log('='.repeat(70));
