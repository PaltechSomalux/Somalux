import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://hoegjepmtegvgnnaohdr.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWdqZXBtdGVndmdubmFvaGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTY3NzEsImV4cCI6MjA3Nzk5Mjc3MX0.uCh8GEV2rplB6QUXEWCNoiPRY9-heNxldNAOJJzQdF8';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || fallbackUrl;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || fallbackKey;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase key starts with:', String(supabaseKey).slice(0, 16));

export const supabase = createClient(String(supabaseUrl), String(supabaseKey));
