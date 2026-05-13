import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import type { ReportAttachment } from '@/lib/report-types'

export const dynamic = 'force-dynamic'

/**
 * Portal-side report attachment download. Verifies the attachment belongs
 * to a candidate owned by this employer before signing the URL.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const clientUser = await requireAuth()
  const { id, attachmentId } = await params

  const supabase = createAdminClient()
  const { data: candidate } = await supabase
    .from('candidates')
    .select('report_attachments, status, client_id')
    .eq('id', id)
    .eq('client_id', clientUser.client_id)
    .maybeSingle()

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }
  if (candidate.status !== 'completed') {
    return NextResponse.json(
      { error: 'Attachments not available until screening is complete.' },
      { status: 403 }
    )
  }

  const attachments: ReportAttachment[] = candidate.report_attachments || []
  const att = attachments.find((a) => a.id === attachmentId)
  if (!att) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('screening-reports')
    .createSignedUrl(att.storagePath, 60 * 5)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message || 'Failed to sign URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
