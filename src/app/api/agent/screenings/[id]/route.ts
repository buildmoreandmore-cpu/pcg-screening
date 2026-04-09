import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const supabase = createAdminClient()

  const { data: c, error } = await supabase
    .from('candidates')
    .select('*, client:clients(id, name, slug, contact_email, contact_phone)')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: history } = await supabase
    .from('status_history')
    .select('previous_status, new_status, notes, changed_by, created_at')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })

  const screening = {
    id: c.id,
    candidate_id: c.id,
    tracking_code: c.tracking_code,
    client_id: c.client_id,
    client: c.client,
    candidate: {
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      dob: c.dob,
      ssn_last4: c.ssn_last4,
      address: c.address,
    },
    package_name: c.package_name,
    package_price: c.package_price,
    status: c.status,
    payment_status: c.payment_status,
    consent_status: c.consent_status,
    sla_flagged: c.sla_flagged,
    started_at: c.screening_started_at,
    completed_at: c.screening_completed_at,
    report_url: c.report_url,
    report_sent_at: c.report_sent_at,
    report_sent_by: c.report_sent_by,
    search_jurisdictions: c.search_jurisdictions,
    components: c.screening_components,
    internal_notes: c.internal_notes,
    status_notes: c.status_notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }

  return NextResponse.json({ screening, status_history: history ?? [] })
}
