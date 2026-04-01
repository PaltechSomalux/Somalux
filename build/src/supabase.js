import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTM5NzAsImV4cCI6MjA4MDk4OTk3MH0.fYzq5xT7ym02Ck1_WyoOHtt-QsRArj1CYqPBYLQula4';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || fallbackUrl;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || fallbackKey;

export const supabase = createClient(String(supabaseUrl), String(supabaseKey), {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    keepAliveInterval: 60000,
  },
});
