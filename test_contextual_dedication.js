import('./src/SomaLux/Books/utils/contextualExplainer.js').then(module => {
  
  const dedicationText = `Dedication
I dedicate this book to my wife and best friend, Rosemarie Withee, who
encouraged me daily throughout this time-intensive process. I owe her nearly
a year's worth of late nights and weekends`;

  console.log('\n' + '═'.repeat(90));
  console.log('CONTEXTUAL EXPLANATION TEST - DEDICATION');
  console.log('═'.repeat(90) + '\n');

  console.log('📖 ORIGINAL TEXT:');
  console.log('─'.repeat(90));
  console.log(dedicationText);
  console.log('─'.repeat(90) + '\n');

  const explanation = module.getContextualExplanation(dedicationText);
  
  console.log('✨ CONTEXTUAL EXPLANATION (ChatGPT-Style):');
  console.log('═'.repeat(90));
  console.log(explanation);
  console.log('═'.repeat(90) + '\n');

}).catch(err => console.error('Error:', err));
