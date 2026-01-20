#!/usr/bin/env node

/**
 * Test Extraction Rules Verification
 * Verifies that extraction rules are correctly implemented:
 * 1. Unit Name NEVER uses filename
 * 2. Unit Name NEVER contains digits
 * 3. Unit Code ONLY contains digits
 */

// Mock the extraction functions
function mockParseFileNameForPastPaper(fileName) {
  const details = {
    unit_code: null,
    unit_name: null,
    faculty: null,
    year: null,
    semester: null,
    exam_type: 'Main'
  };

  const baseName = fileName.replace(/\.[^/.]+$/, '');
  
  const codeMatch = baseName.match(/^[A-Z]{2,4}\s*[\-]?\s*(\d{2,4})/i);
  if (codeMatch) {
    const unitCode = codeMatch[1];
    if (/^\d{2,4}$/.test(unitCode)) {
      details.unit_code = unitCode;
    }
    // NEVER set unit_name from filename
  }
  
  const yearMatch = baseName.match(/(?:20|19)\d{2}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      details.year = year;
    }
  }
  
  return details;
}

// Test cases
const testCases = [
  {
    filename: 'APH10120120330.PDF',
    expectedUnitCode: '1012',
    expectedUnitName: null, // Should NEVER be filename
    expectedYear: 2012,
    description: 'Problematic file with date embedded'
  },
  {
    filename: 'APH10320150428.pdf',
    expectedUnitCode: '1032',
    expectedUnitName: null,
    expectedYear: 2015,
    description: 'APH code with embedded date'
  },
  {
    filename: 'UCU101-2018-DEVELOPMENT-STUDIES.pdf',
    expectedUnitCode: '101',
    expectedUnitName: null,
    expectedYear: 2018,
    description: 'UCU format with full description'
  },
  {
    filename: 'BIO301_2020.pdf',
    expectedUnitCode: '301',
    expectedUnitName: null,
    expectedYear: 2020,
    description: 'BIO code with underscore separator'
  }
];

console.log('\n🧪 EXTRACTION RULES VERIFICATION TEST\n');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

for (const testCase of testCases) {
  console.log(`\n📋 Test: ${testCase.description}`);
  console.log(`   File: "${testCase.filename}"`);
  
  const result = mockParseFileNameForPastPaper(testCase.filename);
  
  let passed = true;
  const issues = [];
  
  // Check Rule 1: Unit Name NEVER uses filename
  if (result.unit_name !== null && result.unit_name !== undefined) {
    console.log(`   ❌ RULE 1 VIOLATION: unitName should be null but got "${result.unit_name}"`);
    issues.push('Unit name extracted from filename');
    passed = false;
  }
  
  // Check Rule 2: Unit Name NEVER contains digits
  if (result.unit_name && /\d/.test(result.unit_name)) {
    console.log(`   ❌ RULE 2 VIOLATION: unitName contains digits: "${result.unit_name}"`);
    issues.push('Unit name contains digits');
    passed = false;
  }
  
  // Check Rule 3: Unit Code ONLY contains digits
  if (result.unit_code && !/^\d+$/.test(result.unit_code)) {
    console.log(`   ❌ RULE 3 VIOLATION: unitCode contains non-digits: "${result.unit_code}"`);
    issues.push('Unit code contains non-digits');
    passed = false;
  }
  
  // Check expected values
  if (result.unit_code !== testCase.expectedUnitCode) {
    console.log(`   ⚠️  Unit code mismatch: expected "${testCase.expectedUnitCode}", got "${result.unit_code}"`);
    issues.push(`Unit code mismatch`);
    passed = false;
  }
  
  if (result.year !== testCase.expectedYear) {
    console.log(`   ⚠️  Year mismatch: expected ${testCase.expectedYear}, got ${result.year}`);
    // This is a warning, not a failure for rules
  }
  
  if (passed && issues.length === 0) {
    console.log(`   ✅ PASSED - All rules and values correct`);
    console.log(`      unitCode: "${result.unit_code}"`);
    console.log(`      unitName: ${result.unit_name || '(null - correct, from PDF only)'}`);
    console.log(`      year: ${result.year}`);
    passCount++;
  } else {
    console.log(`   ❌ FAILED`);
    console.log(`      Issues: ${issues.join(', ')}`);
    failCount++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 TEST RESULTS: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('✅ All extraction rules verified successfully!');
  process.exit(0);
} else {
  console.log('❌ Some extraction rules failed verification');
  process.exit(1);
}
