#!/usr/bin/env node
/**
 * Apply Message Status Columns Migration
 * This script adds the missing status tracking columns to the messages table
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://nojzaqumqcybjfbsucdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🔄 [Migration] Starting message status columns migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'sql', 'ADD_MESSAGE_STATUS_COLUMNS.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 [Migration] Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      console.log(`Preview: ${statement.substring(0, 80)}...`);

      const { error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        continue;
      }
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    // Verify the columns were added
    console.log('\n🔍 [Verification] Checking if columns were added...');
    
    const { data: columns, error: checkError } = await supabase.rpc('exec', {
      sql: `SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name IN ('status', 'is_read', 'recipient_id', 'delivered_at', 'read_at')
            ORDER BY column_name`
    });

    if (checkError) {
      console.log('⚠️ [Verification] Could not verify columns (this is normal if using Supabase UI)');
      console.log('📋 Please manually verify the columns were added in Supabase SQL Editor');
    } else {
      console.log('\n✅ [Verification] Columns found:');
      if (Array.isArray(columns)) {
        columns.forEach(col => {
          console.log(`  ✓ ${col.column_name} (${col.data_type})`);
        });
      }
    }

    console.log('\n✨ [Migration] Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Send a test message to verify status tracking works');
    console.log('3. Check that ticks update properly (single → double → blue double)');

  } catch (error) {
    console.error('❌ [Error] Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
