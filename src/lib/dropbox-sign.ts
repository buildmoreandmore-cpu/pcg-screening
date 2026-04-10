/**
 * Dropbox Sign (formerly HelloSign) integration.
 *
 * Used to send FCRA disclosure & authorization documents to candidates for
 * signature. Falls back gracefully when env vars are not configured — callers
 * should check `isDropboxSignConfigured()` and use the canvas signature path
 * when this returns false.
 *
 * Webhook handler that updates candidates.consent_status / consent_document_url
 * when a signature request completes lives at:
 *   src/app/api/webhook/dropbox-sign/route.ts
 *
 * Env vars (all required for the integration to be active):
 *   DROPBOX_SIGN_API_KEY      — REST API key from Dropbox Sign settings
 *   DROPBOX_SIGN_CLIENT_ID    — App / client ID from Dropbox Sign settings
 *   DROPBOX_SIGN_TEMPLATE_ID  — ID of the FCRA disclosure template
 */

const API_BASE = 'https://api.hellosign.com/v3'

export function isDropboxSignConfigured(): boolean {
  return Boolean(
    process.env.DROPBOX_SIGN_API_KEY &&
      process.env.DROPBOX_SIGN_CLIENT_ID &&
      process.env.DROPBOX_SIGN_TEMPLATE_ID
  )
}

function authHeader() {
  const apiKey = process.env.DROPBOX_SIGN_API_KEY
  if (!apiKey) throw new Error('DROPBOX_SIGN_API_KEY not set')
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
}

export interface SignatureRequestResult {
  signatureRequestId: string
  signUrl: string
  signatureId: string
}

/**
 * Create an embedded signature request from the configured FCRA template.
 *
 * Returns an embed URL that can be opened in an iframe via the Dropbox Sign
 * embedded SDK on the candidate side.
 */
export async function createEmbeddedSignatureRequest({
  candidateEmail,
  candidateName,
  candidateId,
}: {
  candidateEmail: string
  candidateName: string
  candidateId: string
}): Promise<SignatureRequestResult> {
  if (!isDropboxSignConfigured()) {
    throw new Error('Dropbox Sign is not configured')
  }

  const templateId = process.env.DROPBOX_SIGN_TEMPLATE_ID!
  const clientId = process.env.DROPBOX_SIGN_CLIENT_ID!

  const body = new URLSearchParams()
  body.append('client_id', clientId)
  body.append('template_ids[0]', templateId)
  body.append('subject', 'PCG Screening — Authorization & Consent')
  body.append(
    'message',
    'Please review and sign the FCRA disclosure to authorize your background screening.'
  )
  body.append('signers[0][role]', 'Candidate')
  body.append('signers[0][name]', candidateName)
  body.append('signers[0][email_address]', candidateEmail)
  body.append('metadata[candidate_id]', candidateId)
  body.append('test_mode', process.env.DROPBOX_SIGN_TEST_MODE === '1' ? '1' : '0')

  const createRes = await fetch(`${API_BASE}/signature_request/create_embedded_with_template`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!createRes.ok) {
    const text = await createRes.text()
    throw new Error(`Dropbox Sign create_embedded failed: ${createRes.status} ${text}`)
  }

  const createJson = await createRes.json()
  const signatureRequestId: string | undefined =
    createJson?.signature_request?.signature_request_id
  const signatureId: string | undefined =
    createJson?.signature_request?.signatures?.[0]?.signature_id

  if (!signatureRequestId || !signatureId) {
    throw new Error('Dropbox Sign response missing signature_request_id or signature_id')
  }

  // Fetch the embed sign URL
  const signUrlRes = await fetch(`${API_BASE}/embedded/sign_url/${signatureId}`, {
    headers: { Authorization: authHeader() },
  })

  if (!signUrlRes.ok) {
    const text = await signUrlRes.text()
    throw new Error(`Dropbox Sign sign_url failed: ${signUrlRes.status} ${text}`)
  }

  const signUrlJson = await signUrlRes.json()
  const signUrl: string | undefined = signUrlJson?.embedded?.sign_url

  if (!signUrl) {
    throw new Error('Dropbox Sign response missing embedded.sign_url')
  }

  return { signatureRequestId, signUrl, signatureId }
}
