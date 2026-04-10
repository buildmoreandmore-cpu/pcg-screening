import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = body?.event

    if (!event) {
      // Dropbox Sign callback test
      return NextResponse.json({ message: 'Hello API Event Received' })
    }

    const eventType = event.event_type
    const signatureRequest = event.signature_request

    const supabase = getSupabase()

    if (
      (eventType === 'signature_request_signed' || eventType === 'signature_request_all_signed') &&
      signatureRequest &&
      supabase
    ) {
      const signatureRequestId = signatureRequest.signature_request_id

      // Update candidates table
      if (signatureRequestId) {
        // Try to fetch signed PDF download URL (best-effort)
        let signedDocUrl: string | null = null
        try {
          const apiKey = process.env.DROPBOX_SIGN_API_KEY
          if (apiKey) {
            const fileRes = await fetch(
              `https://api.hellosign.com/v3/signature_request/files/${signatureRequestId}?file_type=pdf&get_url=1`,
              {
                headers: {
                  Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
                },
              }
            )
            if (fileRes.ok) {
              const fileJson = await fileRes.json()
              signedDocUrl = fileJson?.file_url ?? null
            }
          }
        } catch (err) {
          console.warn('[dropbox-sign webhook] failed to fetch file_url:', err)
        }

        await supabase
          .from('candidates')
          .update({
            consent_status: 'signed',
            consent_signed_at: new Date().toISOString(),
            consent_document_url: signedDocUrl,
          })
          .eq('dropbox_sign_request_id', signatureRequestId)

        // Also update submissions table for backwards compatibility
        await supabase
          .from('submissions')
          .update({ consent_status: 'signed' })
          .eq('signature_request_id', signatureRequestId)
      }
    }

    if (eventType === 'signature_request_declined' && signatureRequest && supabase) {
      const signatureRequestId = signatureRequest.signature_request_id

      if (signatureRequestId) {
        await supabase
          .from('candidates')
          .update({ consent_status: 'declined' })
          .eq('dropbox_sign_request_id', signatureRequestId)
      }
    }

    // Dropbox Sign expects this exact response
    return NextResponse.json({ message: 'Hello API Event Received' })
  } catch (error) {
    console.error('Dropbox Sign webhook error:', error)
    return NextResponse.json({ message: 'Hello API Event Received' })
  }
}
