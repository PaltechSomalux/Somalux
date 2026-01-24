import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration: Add role column to profiles table...');

    // Execute the ALTER TABLE command
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
      `
    });

    if (error) {
      console.error('Error running migration:', error);
      
      // Try alternative approach - direct SQL execution through schema
      console.log('Trying alternative approach...');
      const result = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (result.error && result.error.message.includes('role')) {
        console.log('Role column is indeed missing');
      }
      
      process.exit(1);
    }

    console.log('Migration completed successfully');
    console.log('Role column added to profiles table');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
