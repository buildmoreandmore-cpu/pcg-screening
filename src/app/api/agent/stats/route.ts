import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const head = { count: 'exact' as const, head: true }

  const [
    total,
    submitted,
    inProgress,
    completed,
    cancelled,
    flagged,
    thisWeek,
    thisMonth,
    activeClients,
  ] = await Promise.all([
    supabase.from('candidates').select('id', head),
    supabase.from('candidates').select('id', head).eq('status', 'submitted'),
    supabase.from('candidates').select('id', head).eq('status', 'in_progress'),
    supabase.from('candidates').select('id', head).eq('status', 'completed'),
    supabase.from('candidates').select('id', head).eq('status', 'cancelled'),
    supabase.from('candidates').select('id', head).eq('sla_flagged', true),
    supabase
      .from('candidates')
      .select('id', head)
      .gte('created_at', startOfWeek.toISOString()),
    supabase
      .from('candidates')
      .select('id', head)
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('clients').select('id', head).eq('active', true),
  ])

  return NextResponse.json({
    candidates: {
      total: total.count ?? 0,
      submitted: submitted.count ?? 0,
      in_progress: inProgress.count ?? 0,
      completed: completed.count ?? 0,
      cancelled: cancelled.count ?? 0,
      flagged: flagged.count ?? 0,
    },
    this_week: thisWeek.count ?? 0,
    this_month: thisMonth.count ?? 0,
    active_clients: activeClients.count ?? 0,
    generated_at: now.toISOString(),
  })
}
