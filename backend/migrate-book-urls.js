/**
 * Migration: Convert file_url from storage paths to full public URLs
 * This runs once to fix all existing books
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzk3MCwiZXhwIjoyMDgwOTg5OTcwfQ.4ijIcjDjtKrsAB8iaGKNhkWwffhXpPTZtJcssl3fqO0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function migrateBooksURLs() {
  try {
    console.log('🔍 Fetching all books...');
    const { data: allBooks, error: fetchError } = await supabase
      .from('books')
      .select('id, title, file_url');
    
    if (fetchError) throw fetchError;
    if (!allBooks || allBooks.length === 0) {
      console.log('✅ No books to migrate');
      return;
    }

    console.log(`📚 Found ${allBooks.length} books. Analyzing URLs...`);
    
    const booksToUpdate = allBooks.filter(book => {
      if (!book.file_url) return false;
      // Only update if it's NOT already a full URL
      return !book.file_url.startsWith('https://');
    });

    if (booksToUpdate.length === 0) {
      console.log('✅ All books already have full URLs');
      return;
    }

    console.log(`\n📝 ${booksToUpdate.length} books need URL conversion:`);
    console.log('━'.repeat(80));

    // Process in batches of 10
    const batchSize = 10;
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < booksToUpdate.length; i += batchSize) {
      const batch = booksToUpdate.slice(i, i + batchSize);
      console.log(`\n📋 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(booksToUpdate.length / batchSize)}`);

      const updatePromises = batch.map(async (book) => {
        try {
          // Convert path to full public URL
          const storagePath = book.file_url.trim();
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/elib-books/${storagePath}`;
          
          const { error } = await supabase
            .from('books')
            .update({ file_url: publicUrl })
            .eq('id', book.id);

          if (error) {
            console.log(`   ❌ ${book.title}: ${error.message}`);
            return false;
          } else {
            console.log(`   ✅ ${book.title}`);
            return true;
          }
        } catch (e) {
          console.log(`   ❌ ${book.title}: ${e.message}`);
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

migrateBooksURLs();
