import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(module => {
  const multiLineTests = [
    // Multi-line text selections (real-world scenarios)
    `Machine learning algorithms can be categorized into supervised and unsupervised learning.
Supervised learning requires labeled training data, while unsupervised learning discovers patterns
in unlabeled data without predefined outcomes.`,
    
    `Artificial inteligence and machine learining are transforming bussiness
by enabling predictive analytics and automating complex decision-making processes
across various industies.`,
    
    `The databse optimization techniques include indexing strategies,
query optimization, and distributed caching to improve performance
and reduce latency in high-volume applications.`,
    
    `Cloud computing infrastructures provide scalable resources on demand.
Organizations can deployapplications without managing physical hardware,
reducing capital expenditure and improving operational efficiency.`,
    
    `Data procesing pipelines involve multiple stages: collection, cleaning, transformation,
analysis, and visualization. Each stage is critical for obtaining meaningful insights
from raw data in big data environments.`,
    
    `Intriduction to web developement: Modern web applications use frameworks like React, Vue, and Angular
to build interactive user intarfaces. Backend tecnologies like Node.js and Python handle
server-side logic and databse operations seamlessly.`
  ];
  
  console.log('\n' + '='.repeat(80));
  console.log('MULTI-LINE TEXT EXPLANATION TEST');
  console.log('='.repeat(80) + '\n');
  
  multiLineTests.forEach((text, idx) => {
    console.log(`\n[TEST ${idx + 1}]`);
    console.log(`Original (${text.length} chars):\n${text.substring(0, 80)}...`);
    
    const result = module.explainIntelligentText(text);
    
    // Simulate async result
    Promise.resolve(result).then(r => {
      if (r.explanation) {
        console.log(`\nProcessed Text: "${r.processed}"`);
        console.log(`Explanation Source: ${r.source}`);
        console.log(`Explanation Preview:\n${r.explanation.substring(0, 150)}...`);
      }
    }).catch(e => {
      console.error('Error processing text:', e.message);
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('Multi-line explanation tests initiated!');
  console.log('='.repeat(80) + '\n');
  
}).catch(err => console.error('ERROR:', err));
