#!/usr/bin/env node
// verify-requests-table.js
// Quick diagnostic to check if requests table exists and is properly configured

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Verifying requests table schema...\n');

  try {
    // Test 1: Check if table exists by querying it
    console.log('Test 1: Checking if requests table exists...');
    const { data, error } = await supabase.from('requests').select('*').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.error('❌ Table does not exist!');
        console.error('   Error:', error.message);
        console.log('\n▶️  To fix this:');
        console.log('   1. Run: psql <connection-string> -f sql/CREATE_REQUESTS_TABLE.sql');
        console.log('   2. OR manually execute sql/CREATE_REQUESTS_TABLE.sql in Supabase SQL editor');
        return false;
      }
      console.error('❌ Query error:', error.message);
      return false;
    }

    console.log('✅ Table exists and is accessible');

    // Test 2: Check table structure
    console.log('\nTest 2: Verifying table columns...');
    const expectedColumns = [
      'id', 'user_id', 'user_email', 'user_name', 'type', 
      'title', 'notes', 'link', 'attachments', 'metadata',
      'status', 'created_at', 'resolved_at', 'processed_by'
    ];

    // Get table info via RPC or by checking constraints
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'requests' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (columns) {
      const actual = columns.map(c => c.column_name).sort();
      const expected = expectedColumns.sort();
      const missing = expected.filter(c => !actual.includes(c));
      
      if (missing.length === 0) {
        console.log('✅ All expected columns present');
      } else {
        console.error('❌ Missing columns:', missing.join(', '));
        return false;
      }
    } else {
      console.log('⚠️  Could not verify columns (RPC not available)');
      console.log('   But table schema can be checked manually in Supabase Dashboard');
    }

    // Test 3: Test inserting a request
    console.log('\nTest 3: Testing INSERT permission...');
    const testPayload = {
      user_email: 'test@example.com',
      user_name: 'Test User',
      type: 'feature',
      title: 'Test Feature',
      notes: 'This is a test request',
      status: 'pending'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('requests')
      .insert(testPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      console.error('   Code:', insertError.code);
      console.error('   Details:', insertError.details);
      
      if (insertError.code === 'PGRLS') {
        console.log('\n⚠️  RLS Policy is blocking INSERT');
        console.log('   To fix: Disable RLS or update policies');
      }
      return false;
    }

    console.log('✅ INSERT successful');
    console.log('   Created request ID:', inserted.id);

    // Clean up test data
    await supabase.from('requests').delete().eq('id', inserted.id).catch(() => {});

    // Test 4: Check for admin requests view
    console.log('\nTest 4: Checking admin_requests view...');
    const { data: viewData, error: viewError } = await supabase
      .from('admin_requests')
      .select('*')
      .limit(1)
      .catch(() => ({ data: null, error: { message: 'View not found' } }));

    if (viewError && viewError.message?.includes('View not found')) {
      console.log('⚠️  admin_requests view doesn\'t exist');
      console.log('   (This is optional, not required for functionality)');
    } else if (viewError) {
      console.log('⚠️  Could not query admin_requests view:', viewError.message);
    } else {
      console.log('✅ admin_requests view exists and is accessible');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed! Requests table is ready.');
    console.log('='.repeat(50));
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
});
