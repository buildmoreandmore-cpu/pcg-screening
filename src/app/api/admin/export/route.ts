import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all candidates with client info
    const { data: candidates } = await supabase
      .from('candidates')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false })

    if (!candidates || candidates.length === 0) {
      const csv = 'No data to export'
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="pcg-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // Build CSV
    const headers = [
      'Tracking Code', 'First Name', 'Last Name', 'Email', 'Phone',
      'Package', 'Price', 'Status', 'Payment Status', 'Consent Status',
      'Client', 'Source', 'SLA Flagged',
      'Submitted', 'Started', 'Completed',
    ]

    const rows = candidates.map((c: any) => [
      c.tracking_code || '',
      c.first_name || '',
      c.last_name || '',
      c.email || '',
      c.phone || '',
      c.package_name || '',
      c.package_price || '',
      c.status || '',
      c.payment_status || '',
      c.consent_status || '',
      c.client?.name || c.client_slug || '',
      c.source || '',
      c.sla_flagged ? 'Yes' : 'No',
      c.created_at ? new Date(c.created_at).toISOString() : '',
      c.screening_started_at ? new Date(c.screening_started_at).toISOString() : '',
      c.screening_completed_at ? new Date(c.screening_completed_at).toISOString() : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pcg-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
