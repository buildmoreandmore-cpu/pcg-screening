import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import type { ReportAttachment } from '@/lib/report-types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/report/attachments/[id]?candidateId=...
 *
 * Looks up the attachment metadata on the candidate's report_attachments
 * JSONB, signs a short-lived URL against the screening-reports bucket,
 * and 302s the admin to it. Keeps storage paths private — the URL is
 * always signed at access time.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin()

  const { id } = await params
  const candidateId = req.nextUrl.searchParams.get('candidateId')
  if (!candidateId) {
    return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('report_attachments')
    .eq('id', candidateId)
    .single()

  if (error || !candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const attachments: ReportAttachment[] = candidate.report_attachments || []
  const att = attachments.find((a) => a.id === id)
  if (!att) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('screening-reports')
    .createSignedUrl(att.storagePath, 60 * 5) // 5 minutes

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message || 'Failed to sign URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
