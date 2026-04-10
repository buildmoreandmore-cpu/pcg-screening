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

/**
 * Self-capture for the one-time "How did you find PCG?" portal modal.
 * Only writes if the field is currently empty (admin's value wins if they
 * already entered one on the create-client form).
 */
export async function saveClientReferralSource({
  referralSource,
  referralSourceOther,
}: {
  referralSource: string
  referralSourceOther?: string
}) {
  const clientUser = await requireAuth()
  if (!referralSource) return { error: 'Please pick an option.' }

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('clients')
    .update({
      referral_source: referralSource,
      referral_source_other: referralSource === 'other' ? referralSourceOther || null : null,
      referral_source_captured_at: new Date().toISOString(),
      referral_source_captured_by: 'employer_self',
    })
    .eq('id', clientUser.client_id)
    .is('referral_source', null)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function changePasswordAction({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}) {
  const clientUser = await requireAuth()
  if (newPassword.length < 8) return { error: 'New password must be at least 8 characters' }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/\\n/g, '').trim()

  // Verify current password via a fresh anon client (no persisted session)
  const verifier = createSupabaseClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { error: signInErr } = await verifier.auth.signInWithPassword({
    email: clientUser.email,
    password: currentPassword,
  })
  if (signInErr) return { error: 'Current password is incorrect' }

  // Update password via service-key admin API
  const service = getServiceClient()
  if (!clientUser.auth_user_id) return { error: 'No auth user linked to this account' }

  const { error: updateErr } = await service.auth.admin.updateUserById(clientUser.auth_user_id, {
    password: newPassword,
  })
  if (updateErr) return { error: updateErr.message }

  return {}
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
