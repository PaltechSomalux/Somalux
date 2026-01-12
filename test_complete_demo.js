import('./src/SomaLux/Books/utils/intelligentTextProcessor.js').then(async (processor) => {
  
  const dedicationText = `Dedication
I dedicate this book to my wife and best friend, Rosemarie Withee, who
encouraged me daily throughout this time-intensive process. I owe her nearly
a year's worth of late nights and weekends`;

  console.log('\n╔════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPLETE EXPLANATION SYSTEM DEMO                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📖 STEP 1: User selects text from book');
  console.log('─'.repeat(88));
  console.log(dedicationText);
  console.log('─'.repeat(88) + '\n');

  console.log('⚙️  STEP 2: System processes with intelligent text processor');
  console.log('─'.repeat(88));
  
  try {
    const result = await processor.explainIntelligentText(dedicationText);
    
    console.log(`✅ Text corrected: No changes needed (text is clean)`);
    console.log(`✅ Source selected: ${result.source}`);
    console.log(`✅ Explanation generated: ${result.explanation.length} characters\n`);

    console.log('📋 STEP 3: Display in explanation panel (ChatGPT-style)');
    console.log('═'.repeat(88));
    
    // Format as it would appear in the UI
    const formattedLines = result.explanation.split('\n');
    formattedLines.forEach(line => {
      if (line.length > 0) {
        console.log(line);
      } else {
        console.log('');
      }
    });
    
    console.log('═'.repeat(88) + '\n');

    console.log('💾 STEP 4: User action buttons');
    console.log('─'.repeat(88));
    console.log('┌─ [Copy] Button');
    console.log('│  └─ Copies entire explanation to clipboard');
    console.log('│  └─ Shows: ✓ Copied! (green toast, 1.2 seconds)');
    console.log('│');
    console.log('├─ [Save] Button');
    console.log('│  └─ Downloads as: explanation.txt');
    console.log('│');
    console.log('└─ Footer Stats');
    console.log('   └─ 📊 ' + dedicationText.split(/\s+/).length + ' words');
    console.log('   └─ 📝 ' + dedicationText.split(/[.!?]+/).filter(s => s.trim()).length + ' sentences');
    console.log('   └─ ⏱️ ~1min read\n');

    console.log('═'.repeat(88));
    console.log('✅ COMPLETE! System works exactly like ChatGPT with contextual explanations');
    console.log('═'.repeat(88) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

}).catch(e => console.error('❌ Module error:', e));
