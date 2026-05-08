import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'
import { dispatchAgentEvent } from '@/lib/agent-webhook'
import { expandActiveComponents } from '@/lib/screening-components'

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
    active_components: expandActiveComponents(c.screening_components || {}),
    internal_notes: c.internal_notes,
    status_notes: c.status_notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }

  return NextResponse.json({ screening, status_history: history ?? [] })
}

/**
 * PATCH /api/agent/screenings/:id — update screening status/details
 *
 * This is a screening-oriented view of the candidates table.
 * Accepts screening-specific fields and maps them to candidate columns.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('candidates')
    .select('id, status, first_name, last_name, tracking_code')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Map screening fields to candidate columns
  const fieldMap: Record<string, string> = {
    status: 'status',
    payment_status: 'payment_status',
    sla_flagged: 'sla_flagged',
    started_at: 'screening_started_at',
    completed_at: 'screening_completed_at',
    report_url: 'report_url',
    report_sent_at: 'report_sent_at',
    report_sent_by: 'report_sent_by',
    components: 'screening_components',
    search_jurisdictions: 'search_jurisdictions',
    internal_notes: 'internal_notes',
    status_notes: 'status_notes',
  }

  const updates: Record<string, unknown> = {}
  for (const [input, column] of Object.entries(fieldMap)) {
    if (input in body) updates[column] = body[input]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: c, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(id, name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log status change
  const newStatus = body.status as string | undefined
  if (newStatus && newStatus !== existing.status) {
    await supabase.from('status_history').insert({
      candidate_id: id,
      previous_status: existing.status,
      new_status: newStatus,
      notes: body.status_notes || body.notes || 'Updated via agent API',
      changed_by: 'Parker (Agent API)',
    })

    if (newStatus === 'completed') {
      dispatchAgentEvent('screening.completed', `Screening completed for ${existing.first_name} ${existing.last_name}`, {
        candidateId: id, trackingCode: existing.tracking_code,
        name: `${existing.first_name} ${existing.last_name}`,
      })
    } else {
      dispatchAgentEvent('candidate.status_changed', `Screening ${existing.tracking_code}: ${existing.status} → ${newStatus}`, {
        candidateId: id, trackingCode: existing.tracking_code,
        previousStatus: existing.status, newStatus,
      })
    }
  }

  // Return screening-shaped response
  const screening = {
    id: c.id,
    candidate_id: c.id,
    tracking_code: c.tracking_code,
    client_id: c.client_id,
    client: c.client,
    candidate: {
      first_name: c.first_name, last_name: c.last_name,
      email: c.email, phone: c.phone,
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
    components: c.screening_components,
    active_components: expandActiveComponents(c.screening_components || {}),
    search_jurisdictions: c.search_jurisdictions,
    internal_notes: c.internal_notes,
    status_notes: c.status_notes,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }

  return NextResponse.json({ screening })
}
