'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { buildCandidateInviteEmail } from '@/lib/email-templates'

/**
 * Returns true when the candidate's record is locked from edits because the
 * downstream payment / consent flow has already happened. Editing after that
 * point would invalidate the FCRA consent audit trail (we'd be changing the
 * name on a document the candidate already signed).
 */
function isLocked(candidate: { payment_status: string | null; consent_status: string | null }) {
  return candidate.payment_status === 'paid' || candidate.consent_status === 'signed'
}

export async function updateCandidate({
  candidateId,
  firstName,
  lastName,
  email,
  phone,
  packageName,
}: {
  candidateId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  packageName: string
}) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  if (!firstName.trim() || !lastName.trim() || !email.trim() || !packageName) {
    return { error: 'First name, last name, email, and package are required.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { error: 'Invalid email address.' }
  }

  // Tenant scoping — never trust the candidateId alone.
  const { data: existing } = await supabase
    .from('candidates')
    .select('id, payment_status, consent_status, status')
    .eq('id', candidateId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!existing) return { error: 'Candidate not found.' }
  if (isLocked(existing)) {
    return {
      error:
        'This candidate has already paid or signed consent. The record is locked to preserve the FCRA audit trail. Cancel and re-invite if a correction is needed.',
    }
  }

  const isCustom = packageName === 'Custom Screening'
  const pkg = client.packages?.find((p: any) => p.name === packageName)
  if (!isCustom && !pkg) return { error: 'Invalid package selected.' }

  const { error: updateError } = await supabase
    .from('candidates')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      package_name: packageName,
      package_price: isCustom ? 0 : pkg?.price || 0,
    })
    .eq('id', candidateId)
    .eq('client_id', client.id)

  if (updateError) {
    console.error('[updateCandidate]', updateError)
    return { error: 'Failed to update candidate.' }
  }

  revalidatePath(`/portal/candidates/${candidateId}`)
  revalidatePath('/portal/candidates')
  return { ok: true }
}

export async function cancelCandidate({ candidateId }: { candidateId: string }) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, payment_status')
    .eq('id', candidateId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!existing) return { error: 'Candidate not found.' }
  if (existing.payment_status === 'paid') {
    return { error: 'Cannot cancel a candidate who has already paid. Contact PCG support for refunds.' }
  }

  const { error: updateError } = await supabase
    .from('candidates')
    .update({ status: 'cancelled' })
    .eq('id', candidateId)
    .eq('client_id', client.id)

  if (updateError) {
    console.error('[cancelCandidate]', updateError)
    return { error: 'Failed to cancel candidate.' }
  }

  revalidatePath(`/portal/candidates/${candidateId}`)
  revalidatePath('/portal/candidates')
  return { ok: true }
}

export async function reactivateCandidate({ candidateId }: { candidateId: string }) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, status')
    .eq('id', candidateId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!existing) return { error: 'Candidate not found.' }
  if (existing.status !== 'cancelled') return { error: 'Only cancelled candidates can be reactivated.' }

  const { error: updateError } = await supabase
    .from('candidates')
    .update({ status: 'submitted' })
    .eq('id', candidateId)
    .eq('client_id', client.id)

  if (updateError) {
    console.error('[reactivateCandidate]', updateError)
    return { error: 'Failed to reactivate candidate.' }
  }

  revalidatePath(`/portal/candidates/${candidateId}`)
  revalidatePath('/portal/candidates')
  return { ok: true }
}

export async function deleteCandidate({ candidateId }: { candidateId: string }) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, payment_status, consent_status')
    .eq('id', candidateId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!existing) return { error: 'Candidate not found.' }
  if (isLocked(existing)) {
    return { error: 'Cannot delete a candidate who has paid or signed consent. Contact PCG support.' }
  }

  const { error: deleteError } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId)
    .eq('client_id', client.id)

  if (deleteError) {
    console.error('[deleteCandidate]', deleteError)
    return { error: 'Failed to delete candidate.' }
  }

  revalidatePath('/portal/candidates')
  return { ok: true, deleted: true }
}

export async function resendCandidateInvite({ candidateId }: { candidateId: string }) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, email, package_name, tracking_code, payment_status, consent_status, status')
    .eq('id', candidateId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!candidate) return { error: 'Candidate not found.' }
  if (candidate.status === 'cancelled') return { error: 'This candidate has been cancelled.' }
  if (isLocked(candidate)) {
    return { error: 'This candidate has already completed payment or consent — no invite to resend.' }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const sent = await sendNotification({
    clientId: client.id,
    audience: 'candidate',
    event: 'intake_link',
    to: candidate.email,
    subject: `Background Screening Request — ${client.name}`,
    html: buildCandidateInviteEmail({
      candidateName: candidate.first_name,
      companyName: client.name,
      packageName: candidate.package_name,
      applyUrl: `${siteUrl}/apply/${client.slug}?invite=${candidate.tracking_code}`,
    }),
  })

  if (!sent) {
    return { error: `Failed to deliver invite email to ${candidate.email}. Verify the address is correct.` }
  }

  return { ok: true, sentTo: candidate.email }
}
