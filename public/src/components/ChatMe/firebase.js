// Legacy Firebase file - using Supabase instead
// All Firebase functionality has been replaced with Supabase
import { supabase } from '../../supabase';

// For backwards compatibility, export Supabase references
export const db = null;
export const auth = supabase.auth;
export const provider = null;
export const messaging = null;
export const storage = null;
