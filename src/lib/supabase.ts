import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (!_supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supabase;
}
