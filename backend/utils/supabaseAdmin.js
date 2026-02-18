// Supabase Admin Client Utility
// Provides a lazy-initialized Supabase admin client

import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('⚠️ Supabase service role not configured');
      return null;
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return supabaseAdmin;
}
