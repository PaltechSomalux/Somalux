import('./src/SomaLux/Books/utils/contextualExplainer.js').then(m => {
  
  const examples = [
    {
      title: 'DEDICATION (Your example)',
      text: `Dedication
I dedicate this book to my wife and best friend, Rosemarie Withee, who
encouraged me daily throughout this time-intensive process. I owe her nearly
a year's worth of late nights and weekends`
    },
    {
      title: 'TECHNICAL TEXT',
      text: `Algorithm design and data structures are fundamental to computer science. 
Understanding how to implement efficient algorithms can significantly improve 
program performance and reduce computational complexity.`
    },
    {
      title: 'STORY/NARRATIVE',
      text: `The old house stood silently on the hill, watching generations pass through its 
doors. Sarah walked through the creaking entrance, memories flooding back from 
her childhood summers spent here with grandmother.`
    }
  ];

  examples.forEach(example => {
    console.log('\n╔' + '═'.repeat(78) + '╗');
    console.log('║ ' + example.title.padEnd(76) + ' ║');
    console.log('╚' + '═'.repeat(78) + '╝\n');
    
    const explanation = m.getContextualExplanation(example.text);
    const lines = explanation.split('\n').slice(0, 12);
    lines.forEach(line => console.log(line));
    console.log('...\n');
  });

}).catch(e => console.error(e));
