'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Employer-billing state machine for candidates whose screening is paid
 * for by their employer (no Stripe checkout):
 *
 *   employer_billed     →  candidate submitted, employer not yet invoiced
 *   employer_invoiced   →  invoice has been sent (manually or via QuickBooks)
 *   employer_paid       →  employer has paid the invoice
 *
 * Bulk transitions are scoped to a single client_id so admins can mark a
 * whole month for one employer in one click.
 */

export async function markCandidatesInvoiced({
  candidateIds,
}: {
  candidateIds: string[]
}) {
  await requireAdmin()
  if (candidateIds.length === 0) return { error: 'No candidates selected' }
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ payment_status: 'employer_invoiced' })
    .in('id', candidateIds)
    .eq('payment_status', 'employer_billed')

  if (error) return { error: error.message }
  revalidatePath('/admin/billing')
  return { ok: true }
}

export async function markCandidatesPaid({
  candidateIds,
}: {
  candidateIds: string[]
}) {
  await requireAdmin()
  if (candidateIds.length === 0) return { error: 'No candidates selected' }
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ payment_status: 'employer_paid' })
    .in('id', candidateIds)
    .in('payment_status', ['employer_billed', 'employer_invoiced'])

  if (error) return { error: error.message }
  revalidatePath('/admin/billing')
  return { ok: true }
}
