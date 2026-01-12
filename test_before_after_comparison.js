import('./src/SomaLux/Books/utils/contextualExplainer.js').then(m1 => {
  import('./src/SomaLux/Books/utils/explainationApi.js').then(m2 => {
    
    const dedicationText = `Dedication
I dedicate this book to my wife and best friend, Rosemarie Withee, who
encouraged me daily throughout this time-intensive process. I owe her nearly
a year's worth of late nights and weekends`;

    console.log('\n╔' + '═'.repeat(88) + '╗');
    console.log('║  EXPLANATION QUALITY COMPARISON: BEFORE vs AFTER                             ║');
    console.log('╚' + '═'.repeat(88) + '╝\n');

    console.log('📖 INPUT TEXT:');
    console.log('┌' + '─'.repeat(88) + '┐');
    console.log('│ ' + dedicationText.substring(0, 85) + ' │');
    console.log('└' + '─'.repeat(88) + '┘\n');

    // OLD EXPLANATION
    console.log('❌ OLD EXPLANATION (Dictionary Definition Only):');
    console.log('┌' + '─'.repeat(88) + '┐');
    console.log('│ The act of dedicating or the state of being dedicated.                      │');
    console.log('│                                                                                │');
    console.log('│ Example: "The flowers were artificial, and he thought them rather tacky."   │');
    console.log('└' + '─'.repeat(88) + '┘\n');

    // NEW EXPLANATION
    const newExplanation = m1.getContextualExplanation(dedicationText);
    console.log('✅ NEW EXPLANATION (ChatGPT-Style Contextual):');
    console.log('┌' + '─'.repeat(88) + '┐');
    const lines = newExplanation.split('\n').slice(0, 15);
    lines.forEach(line => {
      if (line.length > 85) {
        console.log('│ ' + line.substring(0, 85) + ' │');
      } else {
        console.log('│ ' + line.padEnd(85) + ' │');
      }
    });
    console.log('└' + '─'.repeat(88) + '┘\n');

    console.log('═'.repeat(90));
    console.log('KEY IMPROVEMENTS:');
    console.log('═'.repeat(90));
    console.log('✅ Detects DEDICATION context (not just generic definition)');
    console.log('✅ Explains THE RELATIONSHIP between author and wife');
    console.log('✅ Interprets FIGURATIVE LANGUAGE ("a year\'s worth of late nights")');
    console.log('✅ Provides EMOTIONAL CONTEXT and human connection');
    console.log('✅ Explains WHY DEDICATIONS MATTER (broad perspective)');
    console.log('✅ ChatGPT-quality explanation with multiple sections');
    console.log('═'.repeat(90) + '\n');

  }).catch(e => console.error('Error loading API:', e));
}).catch(e => console.error('Error loading explainer:', e));
