import('./src/SomaLux/Books/utils/contextualExplainer.js').then(m => {
  const text = `Dedication
I dedicate this book to my wife and best friend, Rosemarie Withee, who
encouraged me daily throughout this time-intensive process. I owe her nearly
a year's worth of late nights and weekends`;

  console.log('INPUT:\n' + text);
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('IMPROVED EXPLANATION:\n');
  console.log(m.getContextualExplanation(text));
}).catch(e => console.error(e));
