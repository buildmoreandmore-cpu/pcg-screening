import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()
  return createClient(url, key)
}
