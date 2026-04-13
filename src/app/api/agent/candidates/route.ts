import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

export const dynamic = 'force-dynamic'

function generateTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PCG-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * POST /api/agent/candidates — create a new candidate
 */
export async function POST(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => ({}))
  const {
    client_id, client_slug, first_name, last_name, email, phone,
    package_name, package_price, status, source, notes,
  } = body

  if (!first_name || !last_name || !email) {
    return NextResponse.json(
      { error: 'first_name, last_name, and email are required' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Resolve client
  let resolvedClientId = client_id
  let resolvedClientSlug = client_slug
  if (!resolvedClientId && client_slug) {
    const { data: client } = await supabase
      .from('clients')
      .select('id, slug')
      .eq('slug', client_slug)
      .single()
    if (client) {
      resolvedClientId = client.id
      resolvedClientSlug = client.slug
    }
  }

  // Generate unique tracking code
  let trackingCode = generateTrackingCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('tracking_code', trackingCode)
      .single()
    if (!existing) break
    trackingCode = generateTrackingCode()
  }

  const { data: candidate, error } = await supabase
    .from('candidates')
    .insert({
      tracking_code: trackingCode,
      client_id: resolvedClientId || null,
      client_slug: resolvedClientSlug || null,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      package_name: package_name || null,
      package_price: package_price || 0,
      status: status || 'submitted',
      payment_status: 'pending',
      source: source || 'agent_api',
      internal_notes: notes || null,
    })
    .select('*, client:clients(id, name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  dispatchAgentEvent('candidate.submitted', `New candidate ${first_name} ${last_name} created via agent API`, {
    candidateId: candidate.id,
    trackingCode,
    name: `${first_name} ${last_name}`,
    email,
    packageName: package_name,
  })

  return NextResponse.json({ candidate }, { status: 201 })
}

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
      'id, tracking_code, client_id, client_slug, first_name, last_name, email, phone, package_name, package_price, payment_status, consent_status, status, sla_flagged, screening_started_at, screening_completed_at, last_status_update, created_at, updated_at, client:clients(id, name, slug)'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (since) query = query.gte('created_at', since)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ candidates: data ?? [], count: data?.length ?? 0 })
}
