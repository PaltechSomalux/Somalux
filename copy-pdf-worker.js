/**
 * Copy PDF.js worker file to build output
 * Run this after `npm run build` or as part of the build process
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destFile = path.join(__dirname, 'public', 'pdf.worker.min.mjs');

try {
  // Copy to public folder (for development and production server)
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ PDF worker copied to public folder');
  
  // Also copy to build folder if it exists (after npm run build)
  const buildDestFile = path.join(__dirname, 'build', 'pdf.worker.min.mjs');
  if (fs.existsSync(path.join(__dirname, 'build'))) {
    fs.copyFileSync(sourceFile, buildDestFile);
    console.log('✅ PDF worker copied to build folder');
  }
} catch (error) {
  console.error('❌ Failed to copy PDF worker:', error.message);
  process.exit(1);
}
