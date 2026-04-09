import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

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
