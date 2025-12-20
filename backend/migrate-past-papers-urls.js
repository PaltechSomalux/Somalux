/**
 * Migration: Convert past paper file_url from storage paths to full public URLs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzk3MCwiZXhwIjoyMDgwOTg5OTcwfQ.4ijIcjDjtKrsAB8iaGKNhkWwffhXpPTZtJcssl3fqO0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function migratePastPaperURLs() {
  try {
    console.log('🔍 Fetching all past papers...');
    const { data: allPapers, error: fetchError } = await supabase
      .from('past_papers')
      .select('id, title, file_url');
    
    if (fetchError) throw fetchError;
    if (!allPapers || allPapers.length === 0) {
      console.log('✅ No past papers to migrate');
      return;
    }

    console.log(`📚 Found ${allPapers.length} past papers. Analyzing URLs...`);
    
    const papersToUpdate = allPapers.filter(paper => {
      if (!paper.file_url) return false;
      // Only update if it's NOT already a full URL
      return !paper.file_url.startsWith('https://');
    });

    if (papersToUpdate.length === 0) {
      console.log('✅ All past papers already have full URLs');
      return;
    }

    console.log(`\n📝 ${papersToUpdate.length} past papers need URL conversion:`);
    console.log('━'.repeat(80));

    // Process in batches of 10
    const batchSize = 10;
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < papersToUpdate.length; i += batchSize) {
      const batch = papersToUpdate.slice(i, i + batchSize);
      console.log(`\n📋 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(papersToUpdate.length / batchSize)}`);

      const updatePromises = batch.map(async (paper) => {
        try {
          // Convert path to full public URL
          const storagePath = paper.file_url.trim();
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/past-papers/${storagePath}`;
          
          const { error } = await supabase
            .from('past_papers')
            .update({ file_url: publicUrl })
            .eq('id', paper.id);

          if (error) {
            console.log(`   ❌ ${paper.title}: ${error.message}`);
            return false;
          } else {
            console.log(`   ✅ ${paper.title}`);
            return true;
          }
        } catch (e) {
          console.log(`   ❌ ${paper.title}: ${e.message}`);
          return false;
        }
      });

      const results = await Promise.all(updatePromises);
      updated += results.filter(Boolean).length;
      failed += results.filter(r => !r).length;
    }

    console.log('\n' + '━'.repeat(80));
    console.log(`\n✨ Migration Complete!`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${updated + failed}\n`);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

migratePastPaperURLs();
