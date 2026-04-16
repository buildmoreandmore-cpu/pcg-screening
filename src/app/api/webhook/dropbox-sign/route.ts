import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendNotification } from '@/lib/notifications'

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

        const { data: updated } = await supabase
          .from('candidates')
          .update({
            consent_status: 'signed',
            consent_signed_at: new Date().toISOString(),
            consent_document_url: signedDocUrl,
          })
          .eq('dropbox_sign_request_id', signatureRequestId)
          .select('id, first_name, last_name, client_id, client:clients(notification_email)')
          .single()

        // Notify client that consent has been signed
        if (updated?.client_id) {
          const candidateName = `${updated.first_name} ${updated.last_name}`
          const notifyEmail = (updated.client as any)?.notification_email || 'accounts@pcgscreening.com'
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net'

          sendNotification({
            clientId: updated.client_id,
            audience: 'client',
            event: 'consent_signed',
            to: notifyEmail,
            subject: `Consent Signed — ${candidateName}`,
            html: `<p>The consent form for <strong>${candidateName}</strong> has been signed.</p><p style="text-align:center;"><a href="${siteUrl}/portal/candidates/${updated.id}" style="display:inline-block;background:#1f2f4a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">View Candidate</a></p>`,
          })

          sendNotification({
            clientId: updated.client_id,
            audience: 'pcg_admin',
            event: 'consent_signed',
            to: 'accounts@pcgscreening.com',
            subject: `Consent Signed — ${candidateName}`,
            html: `<p><strong>${candidateName}</strong>'s consent has been signed via Dropbox Sign.</p><p><a href="${siteUrl}/admin/candidates/${updated.id}">View in dashboard</a></p>`,
          })
        }

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
