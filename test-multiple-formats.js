#!/usr/bin/env node
/**
 * Test extraction with real University of Nairobi PDF format
 */

import { parsePastPaperDetails } from './backend/utils/ocrExtractPDF.js';

const testTexts = [
  {
    name: 'EAE Paper (Environmental)',
    text: `
UNIVERSITY OF NAIROBI
EXAMINATION 2019

Faculty of Science

Environmental Assessment and Evaluation
EAE 200

Date: 18th June 2019
Time: 2.00 PM - 4.00 PM
Semester 2

Answer three questions.
    `
  },
  {
    name: 'APL Paper (Applied)',
    text: `
UNIVERSITY OF NAIROBI

Applied Physics Department
Faculty of Science

EXAMINATION 2019, SEMESTER 2

APL 808: ADVANCED OPTICS

Date: 20th June 2019
    `
  },
  {
    name: 'UCU Paper (Development)',
    text: `
KENYATTA UNIVERSITY

UNIVERSITY EXAMINATION 2017/2018

DIGITAL SCHOOL OF VIRTUAL AND OPEN LEARNING

UCU 101: DEVELOPMENT STUDIES

DATE: MONDAY, 18TH JUNE 2018
TIME: 4.30PM-6.30PM
    `
  }
];

console.log('\n' + '='.repeat(80));
console.log('🧪 Testing Extraction with Different PDF Formats');
console.log('='.repeat(80) + '\n');

testTexts.forEach((test, index) => {
  console.log(`📄 Test ${index + 1}: ${test.name}`);
  console.log('-'.repeat(80));
  
  const result = parsePastPaperDetails(test.text);
  
  console.log(`  Unit Code:     ${result.unit_code || '(empty)'}`);
  console.log(`  Unit Name:     ${result.unit_name || '(empty)'}`);
  console.log(`  Faculty:       ${result.faculty || '(empty)'}`);
  console.log(`  Year:          ${result.year || '(empty)'}`);
  console.log(`  Semester:      ${result.semester || '(empty)'}`);
  console.log(`  Exam Type:     ${result.exam_type}`);
  console.log(`  Confidence:    unit_code=${(result.confidence.unit_code * 100 || 0).toFixed(0)}%, unit_name=${(result.confidence.unit_name * 100 || 0).toFixed(0)}%, faculty=${(result.confidence.faculty * 100 || 0).toFixed(0)}%`);
  
  // Check if fields should be populated in database
  const shouldPopulateUnitName = result.unit_name && result.confidence.unit_name >= 0.85;
  const shouldPopulateFaculty = result.faculty && result.confidence.faculty >= 0.7 && !/^(UNIVERSITY|EXAMINATION|VIRTUAL|DIGITAL|OPEN|LEARNING|SCHOOL|EDUCATION|ACADEMIC)$/i.test(result.faculty);
  
  console.log(`  Will save Unit Name: ${shouldPopulateUnitName ? '✅ YES' : '❌ NO (will be empty)'}`);
  console.log(`  Will save Faculty: ${shouldPopulateFaculty ? '✅ YES' : '❌ NO (will be empty)'}`);
  console.log('');
});

console.log('='.repeat(80) + '\n');
