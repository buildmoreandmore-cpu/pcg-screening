import { createClient } from '@supabase/supabase-js'

export function createCredentialingClient() {
  const url = (process.env.CREDENTIALING_SUPABASE_URL || '').replace(/\\n/g, '').trim()
  const key = (process.env.CREDENTIALING_SUPABASE_ANON_KEY || '').replace(/\\n/g, '').trim()
  return createClient(url, key)
}
