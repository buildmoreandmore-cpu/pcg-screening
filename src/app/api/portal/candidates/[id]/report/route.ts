import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateReportPdf } from '@/lib/report-pdf'

export const dynamic = 'force-dynamic'

/**
 * Portal-side report download.
 *
 * Verifies the candidate belongs to the client user's company before
 * returning the PDF, so an employer can only pull reports for their own
 * candidates. Same PDF generator as the admin path.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientUser = await requireAuth()
  const { id } = await params
  const preview = req.nextUrl.searchParams.get('preview') === 'true'

  const supabase = createAdminClient()
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, client_id, status')
    .eq('id', id)
    .eq('client_id', clientUser.client_id)
    .maybeSingle()

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  // Don't expose draft reports to the employer until the screening is
  // actually complete on the admin side.
  if (candidate.status !== 'completed') {
    return NextResponse.json(
      { error: 'Report not yet available — screening is still in progress.' },
      { status: 403 }
    )
  }

  try {
    const pdfBuffer = await generateReportPdf(id)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': preview
          ? 'inline; filename="report.pdf"'
          : `attachment; filename="PCG_Report_${id}.pdf"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
