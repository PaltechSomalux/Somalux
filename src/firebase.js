// Cloud service has been removed. Using Supabase instead.
// This file is kept for backwards compatibility but all references
// should be migrated to use the backend API or Supabase directly.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wuwlnawtuhjoubfkdtgc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNDQyNDksImV4cCI6MTczODgyNDI0OX0.gmlvDM6pDyPj0_xMJHoXOQN_3F4p2J6-8vLdXkJEBxY';

// Export Supabase client for any components that need it
export const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholder exports for compatibility (not using anymore)
export const db = null;
export const auth = null;
export const provider = null;
export const messaging = null;
export const storage = null;
