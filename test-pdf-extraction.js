const https = require('https');

// Test URL - an item from the collection
const testUrl = 'https://pastpapers.ku.ac.ke/handle/123456789/4552';
const baseUrl = 'https://pastpapers.ku.ac.ke';

console.log('Testing PDF extraction from:', testUrl);
console.log('');

https.get(testUrl, {
  rejectUnauthorized: false,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    console.log('✅ Response received, analyzing HTML...');
    console.log('');
    
    // Find all links
    const linkMatches = data.match(/href=["']([^"']+)["']/g) || [];
    const bitstreamLinks = linkMatches.filter(link => link.includes('bitstream'));
    
    console.log(`Total links found: ${linkMatches.length}`);
    console.log(`Bitstream links found: ${bitstreamLinks.length}`);
    console.log('');
    
    if (bitstreamLinks.length > 0) {
      console.log('📝 Bitstream Links:');
      bitstreamLinks.forEach((link, i) => {
        const url = link.match(/href=["']([^"']+)["']/)[1];
        console.log(`${i + 1}. ${url}`);
      });
    }
    
    // Look for PDF links specifically
    console.log('');
    const pdfLinks = data.match(/href=["']([^"']*\.pdf[^"']*)["']/gi) || [];
    console.log(`PDF links found: ${pdfLinks.length}`);
    
    if (pdfLinks.length > 0) {
      console.log('');
      console.log('📄 PDF Links:');
      pdfLinks.forEach((link, i) => {
        const url = link.match(/href=["']([^"']+)["']/)[1];
        console.log(`${i + 1}. ${url}`);
        
        // Check if absolute or relative
        if (!url.startsWith('http')) {
          const absolute = baseUrl + (url.startsWith('/') ? '' : '/') + url;
          console.log(`   → Absolute: ${absolute}`);
        }
      });
    }
    
    // Look for download buttons
    console.log('');
    const downloadButtons = data.match(/class=["'].*download.*["']/gi) || [];
    console.log(`Download buttons found: ${downloadButtons.length}`);
    
    // Show a sample of the HTML around bitstream
    if (bitstreamLinks.length > 0) {
      console.log('');
      console.log('📋 HTML Context (sample):');
      const bitstreamIndex = data.indexOf('bitstream');
      if (bitstreamIndex > 0) {
        const start = Math.max(0, bitstreamIndex - 200);
        const end = Math.min(data.length, bitstreamIndex + 300);
        console.log(data.substring(start, end).replace(/\n/g, ' '));
      }
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
