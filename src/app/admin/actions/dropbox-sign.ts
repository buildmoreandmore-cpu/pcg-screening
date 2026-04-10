'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import {
  isDropboxSignConfigured,
  createEmbeddedSignatureRequest,
} from '@/lib/dropbox-sign'

/**
 * Send a formal Dropbox Sign FCRA disclosure to a candidate.
 *
 * The candidate's existing consent (canvas signature captured at intake)
 * remains intact. This sends an additional formal e-sign request whose
 * signed PDF URL will be persisted via the Dropbox Sign webhook.
 *
 * Hidden in the UI when DROPBOX_SIGN_* env vars aren't set.
 */
export async function sendDropboxSignRequest({ candidateId }: { candidateId: string }) {
  await requireAdmin()

  if (!isDropboxSignConfigured()) {
    return { error: 'Dropbox Sign is not configured. Add DROPBOX_SIGN_API_KEY, DROPBOX_SIGN_CLIENT_ID, DROPBOX_SIGN_TEMPLATE_ID.' }
  }

  const supabase = createAdminClient()

  const { data: candidate, error: fetchErr } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, email')
    .eq('id', candidateId)
    .single()

  if (fetchErr || !candidate) {
    return { error: 'Candidate not found.' }
  }

  if (!candidate.email) {
    return { error: 'Candidate has no email address.' }
  }

  try {
    const result = await createEmbeddedSignatureRequest({
      candidateEmail: candidate.email,
      candidateName: `${candidate.first_name} ${candidate.last_name}`.trim(),
      candidateId: candidate.id,
    })

    await supabase
      .from('candidates')
      .update({
        dropbox_sign_request_id: result.signatureRequestId,
      })
      .eq('id', candidate.id)

    revalidatePath(`/admin/candidates/${candidateId}`)
    return { signatureRequestId: result.signatureRequestId }
  } catch (err: any) {
    console.error('[sendDropboxSignRequest]', err)
    return { error: err?.message || 'Failed to create signature request.' }
  }
}
