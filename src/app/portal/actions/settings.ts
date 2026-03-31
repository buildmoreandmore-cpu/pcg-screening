'use server'

import { createClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

export async function updatePreferences({ name }: { name: string }) {
  const clientUser = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_users')
    .update({ name })
    .eq('id', clientUser.id)

  return { error: error?.message }
}

export async function acceptFcra() {
  const clientUser = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ fcra_accepted_at: new Date().toISOString() })
    .eq('id', clientUser.client_id)

  return { error: error?.message }
}
