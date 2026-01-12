import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(module => {
  const testCases = [
    // Original problem cases
    'ntroduction: Machine Intelligence',
    'inteligence machne',
    'prediction machnes',
    
    // Technical terms with typos
    'algoritm and data structures',
    'artifical neural networks',
    'bussiness analytics solutions',
    'databse management system',
    'optimiztion techniques',
    'algoritmic thinking',
    'compter science fundamentals',
    'softwar engineering practices',
    
    // Common misspellings
    'teh quick brown fox',
    'occured in diferent places',
    'receieve important messages',
    'occassion to learn',
    'wich is better',
    'seperate the concerns',
    
    // Fragmented/truncated text
    'machine. learning. algorithms',
    'data procesing and analysis',
    'web. application. development',
    'cloud computin infrastructure',
    'distributed. systems. design',
    
    // Mixed cases
    'artifical inteligence and machine learining',
    'data science with algoritms',
    'web developement best practises',
    'intriduction to bussiness inteligence',
    
    // Single words with typos
    'inteligent',
    'algoritm',
    'optimizaton',
    'administation',
    'recomendation',
    'implemetation',
    'configration',
    
    // Very short fragments
    'mlk', // Too short to correct
    'ai ml', // Short technical terms
    'api',
    'gui'
  ];
  
  console.log('\n' + '='.repeat(60));
  console.log('COMPREHENSIVE SPELL CORRECTION TEST RESULTS');
  console.log('='.repeat(60) + '\n');
  
  let successCount = 0;
  let totalCount = testCases.length;
  
  testCases.forEach((test, index) => {
    const result = module.getIntelligentCorrectedText(test);
    const changed = result.corrected !== test;
    
    console.log(`[${index + 1}] Input:  "${test}"`);
    console.log(`    Output: "${result.corrected}"`);
    
    if (changed || !result.changes) {
      console.log(`    Status: ${changed ? '✅ CORRECTED' : '✅ CORRECT'}`);
      if (changed) successCount++;
    } else {
      console.log(`    Status: ⚠️ NO CHANGE`);
    }
    console.log();
  });
  
  console.log('='.repeat(60));
  console.log(`SUMMARY: ${successCount}/${totalCount} texts processed/corrected`);
  console.log('='.repeat(60));
  
}).catch(err => console.error('ERROR:', err));
