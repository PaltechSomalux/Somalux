import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(module => {
  const realWorldCases = [
    // From books/documents
    'The fundametal concepts of machne learning are critical',
    'Artifical Inteligence transformes industy',
    'Bussiness inteligence provides strategic insights',
    'Cloud computin infrastructures are scalable',
    
    // User typos while selecting text
    'Data procesing pipelines optimiztion',
    'Sofware developement best practises',
    'Web aplication architecture patterns',
    'Distrbuted systems design princples',
    
    // Fragmented selections
    'machine learning in buisness analytics',
    'neural networks and deep. learning algorithms',
    'database optimization with indexing stratgies',
    
    // Mixed issues
    'Intriduction: artificial inteligence applications in bussiness',
    'Prediction models using advanced algoritms',
    'Software engineering principles and best practises'
  ];
  
  console.log('\n' + '='.repeat(70));
  console.log('REAL-WORLD TEXT CORRECTION TEST');
  console.log('='.repeat(70) + '\n');
  
  realWorldCases.forEach((text, index) => {
    const result = module.getIntelligentCorrectedText(text);
    const changed = result.corrected !== text;
    
    console.log(`Test ${index + 1}:`);
    console.log(`  ❌ Before: "${text}"`);
    console.log(`  ✅ After:  "${result.corrected}"`);
    console.log(`  Status:  ${changed ? '🔧 CORRECTED' : '✓ ALREADY CORRECT'}\n`);
  });
  
  console.log('='.repeat(70));
  console.log('✅ All real-world test cases processed successfully!');
  console.log('='.repeat(70));
  
}).catch(err => console.error('ERROR:', err));
