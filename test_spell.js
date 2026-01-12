import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(module => {
  const testCases = [
    'ntroduction: Machine Intelligence',
    'inteligence machne',
    '.com makes your',
    'prediction machnes',
    'intriduction to machine learining'
  ];
  
  console.log('\n=== SPELL CORRECTION TEST RESULTS ===\n');
  testCases.forEach(test => {
    const result = module.getIntelligentCorrectedText(test);
    console.log('Input:  ' + test);
    console.log('Output: ' + result.corrected + '\n');
  });
}).catch(err => console.error(err));
