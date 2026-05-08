import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'
import { expandActiveComponents } from '@/lib/screening-components'

export const dynamic = 'force-dynamic'

/**
 * Screenings are modeled as the screening-lifecycle view of candidates.
 * Returns only rows where a screening has been initiated (payment_status='paid'
 * or status in in_progress/completed) and exposes screening-specific fields.
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const since = searchParams.get('since')
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

  const supabase = createAdminClient()
  let query = supabase
    .from('candidates')
    .select(
      'id, tracking_code, client_id, client_slug, first_name, last_name, email, package_name, status, sla_flagged, screening_started_at, screening_completed_at, report_url, report_sent_at, search_jurisdictions, screening_components, created_at, updated_at, client:clients(id, name, slug)'
    )
    .in('status', ['in_progress', 'completed', 'cancelled'])
    .order('screening_started_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (since) query = query.gte('screening_started_at', since)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const screenings = (data ?? []).map((c: any) => ({
    id: c.id,
    candidate_id: c.id,
    tracking_code: c.tracking_code,
    client_id: c.client_id,
    client: c.client,
    candidate_name: `${c.first_name} ${c.last_name}`,
    candidate_email: c.email,
    package_name: c.package_name,
    status: c.status,
    sla_flagged: c.sla_flagged,
    started_at: c.screening_started_at,
    completed_at: c.screening_completed_at,
    report_url: c.report_url,
    report_sent_at: c.report_sent_at,
    search_jurisdictions: c.search_jurisdictions,
    components: c.screening_components,
    active_components: expandActiveComponents(c.screening_components || {}),
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))

  return NextResponse.json({ screenings, count: screenings.length })
}
