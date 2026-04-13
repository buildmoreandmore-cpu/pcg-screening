import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const supabase = createAdminClient()

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*, client:clients(id, name, slug, contact_email, contact_phone)')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: history } = await supabase
    .from('status_history')
    .select('previous_status, new_status, notes, changed_by, created_at')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ candidate, status_history: history ?? [] })
}

/**
 * PATCH /api/agent/candidates/:id — update candidate status/details
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

  // Fetch current record to track status changes
  const { data: existing } = await supabase
    .from('candidates')
    .select('id, status, first_name, last_name, tracking_code')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Whitelist of updatable fields
  const allowed = [
    'first_name', 'last_name', 'email', 'phone', 'dob', 'address',
    'package_name', 'package_price', 'status', 'payment_status',
    'consent_status', 'sla_flagged', 'internal_notes', 'status_notes',
    'screening_started_at', 'screening_completed_at',
    'report_url', 'report_sent_at', 'report_sent_by',
    'screening_components', 'search_jurisdictions',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: candidate, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', id)
    .select('*, client:clients(id, name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log status change in history + dispatch webhook
  const newStatus = updates.status as string | undefined
  if (newStatus && newStatus !== existing.status) {
    await supabase.from('status_history').insert({
      candidate_id: id,
      previous_status: existing.status,
      new_status: newStatus,
      notes: body.status_notes || body.notes || `Updated via agent API`,
      changed_by: 'Parker (Agent API)',
    })

    if (newStatus === 'completed') {
      dispatchAgentEvent('screening.completed', `Screening completed for ${existing.first_name} ${existing.last_name}`, {
        candidateId: id,
        trackingCode: existing.tracking_code,
        name: `${existing.first_name} ${existing.last_name}`,
      })
    } else {
      dispatchAgentEvent('candidate.status_changed', `${existing.first_name} ${existing.last_name} status: ${existing.status} → ${newStatus}`, {
        candidateId: id,
        trackingCode: existing.tracking_code,
        previousStatus: existing.status,
        newStatus,
      })
    }
  }

  return NextResponse.json({ candidate })
}
