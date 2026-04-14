import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateReportPdf } from '@/lib/report-pdf'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidateId')
  const preview = searchParams.get('preview') === 'true'

  if (!candidateId) {
    return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
  }

  try {
    const pdfBuffer = await generateReportPdf(candidateId)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': preview
          ? 'inline; filename="report.pdf"'
          : `attachment; filename="PCG_Report_${candidateId}.pdf"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
