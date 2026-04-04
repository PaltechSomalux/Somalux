import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTM5NzAsImV4cCI6MjA4MDk4OTk3MH0.fYzq5xT7ym02Ck1_WyoOHtt-QsRArj1CYqPBYLQula4';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || fallbackUrl;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || fallbackKey;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase key starts with:', String(supabaseKey).slice(0, 16));

export const supabase = createClient(String(supabaseUrl), String(supabaseKey), {
  auth: {
    // Enable session persistence - keep user logged in across page reloads
    persistSession: true,
    // Store session in localStorage (survives page refresh)
    storage: window.localStorage,
    // Auto-refresh session if it expires
    autoRefreshToken: true,
    // Detect session changes across tabs
    detectSessionInUrl: true,
    // Keep-alive interval (ms) - refresh token before expiry
    keepAliveInterval: 60000, // 60 seconds
  },
});

