import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

export const dynamic = 'force-dynamic'

function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TKT-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * POST /api/agent/support-tickets — log a bug report or issue
 */
export async function POST(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => ({}))
  const {
    subject, description, category, priority,
    reporter_name, reporter_email,
    candidate_id, client_id,
  } = body

  if (!subject) {
    return NextResponse.json(
      { error: 'subject is required' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Generate unique tracking code
  let trackingCode = generateTicketCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('tracking_code', trackingCode)
      .single()
    if (!existing) break
    trackingCode = generateTicketCode()
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      tracking_code: trackingCode,
      subject: subject.trim(),
      description: description || null,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      reporter_name: reporter_name || null,
      reporter_email: reporter_email || null,
      candidate_id: candidate_id || null,
      client_id: client_id || null,
      source: 'agent_api',
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  dispatchAgentEvent('screening.flagged', `Support ticket created: ${subject}`, {
    ticketId: ticket.id,
    trackingCode,
    subject,
    category: category || 'general',
    priority: priority || 'medium',
  })

  return NextResponse.json({ ticket }, { status: 201 })
}

/**
 * GET /api/agent/support-tickets — list tickets
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

  const supabase = createAdminClient()
  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tickets: data ?? [], count: data?.length ?? 0 })
}
