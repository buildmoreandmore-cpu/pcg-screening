'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

function getServiceClient() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()
  return createSupabaseClient(supabaseUrl, serviceKey)
}

export async function updatePreferences({ name }: { name: string }) {
  const clientUser = await requireAuth()
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('client_users')
    .update({ name })
    .eq('id', clientUser.id)

  return { error: error?.message }
}

export async function acceptFcra() {
  const clientUser = await requireAuth()
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('clients')
    .update({ fcra_accepted_at: new Date().toISOString() })
    .eq('id', clientUser.client_id)

  return { error: error?.message }
}
