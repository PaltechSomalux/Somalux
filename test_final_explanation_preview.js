import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(async (module) => {
  
  // Simulate real user scenario
  const userSelectedText = `Artificial inteligence and machine learining are transforming bussiness
by enabling predictive analytics and automating complex decision-making processes
across various industries like healthcare, finance, and retail.`;

  console.log('\n' + '═'.repeat(80));
  console.log('FINAL EXPLANATION PANEL PREVIEW (ChatGPT Style)');
  console.log('═'.repeat(80) + '\n');

  console.log('📖 USER SELECTED TEXT:');
  console.log('─'.repeat(80));
  console.log(userSelectedText);
  console.log('─'.repeat(80) + '\n');

  try {
    const result = await module.explainIntelligentText(userSelectedText);
    
    console.log('✅ SYSTEM PROCESSING:');
    console.log(`• Original: "${result.original}"`);
    console.log(`• Corrected: "${result.processed}"`);
    console.log(`• Source: ${result.source}\n`);

    console.log('📋 EXPLANATION PANEL OUTPUT:');
    console.log('═'.repeat(80));
    console.log('\nFormatted Display (as shown in panel):\n');
    console.log(result.explanation);
    console.log('\n' + '═'.repeat(80));
    
    console.log('\n📊 FOOTER STATISTICS:');
    const words = userSelectedText.split(/\s+/).filter(w => w.trim().length > 0);
    const sentences = userSelectedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const readTime = Math.ceil(words.length / 200);
    console.log(`📊 ${words.length} words | 📝 ${sentences.length} sentences | ⏱️ ${readTime}min read\n`);

    console.log('🎯 ACTION BUTTONS:');
    console.log('├─ [Copy] → Shows: ✓ Copied! (green toast, 1.2s)');
    console.log('└─ [Save] → Downloads: explanation.txt\n');

    console.log('═'.repeat(80));
    console.log('✅ EXACTLY LIKE ChatGPT WITH TEXT CORRECTION DISPLAY');
    console.log('═'.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

}).catch(err => console.error('Module Error:', err));
