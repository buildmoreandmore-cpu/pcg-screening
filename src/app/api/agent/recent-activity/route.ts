import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

interface Activity {
  type: 'candidate.submitted' | 'candidate.status_changed' | 'screening.completed' | 'client.created'
  timestamp: string
  candidate_id?: string
  candidate_name?: string
  client_id?: string
  client_name?: string
  previous_status?: string
  new_status?: string
  notes?: string
  summary: string
}

export async function GET(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const days = Math.max(1, Math.min(Number(searchParams.get('days') || 7), 90))
  const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString()

  const supabase = createAdminClient()

  const [submissionsRes, historyRes, clientsRes] = await Promise.all([
    supabase
      .from('candidates')
      .select('id, first_name, last_name, package_name, status, created_at, client:clients(id, name)')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('status_history')
      .select(
        'candidate_id, previous_status, new_status, notes, changed_by, created_at, candidates(id, first_name, last_name, client:clients(id, name))'
      )
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('clients')
      .select('id, name, slug, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const activity: Activity[] = []

  for (const c of submissionsRes.data ?? []) {
    const client = Array.isArray((c as any).client) ? (c as any).client[0] : (c as any).client
    activity.push({
      type: 'candidate.submitted',
      timestamp: c.created_at as string,
      candidate_id: c.id as string,
      candidate_name: `${c.first_name} ${c.last_name}`,
      client_id: client?.id,
      client_name: client?.name,
      summary: `${c.first_name} ${c.last_name} submitted for ${c.package_name} (${client?.name ?? 'unknown'})`,
    })
  }

  for (const h of historyRes.data ?? []) {
    const cand = Array.isArray((h as any).candidates)
      ? (h as any).candidates[0]
      : (h as any).candidates
    const client = cand?.client
      ? Array.isArray(cand.client) ? cand.client[0] : cand.client
      : null
    const name = cand ? `${cand.first_name} ${cand.last_name}` : 'candidate'
    const isCompletion = h.new_status === 'completed'
    activity.push({
      type: isCompletion ? 'screening.completed' : 'candidate.status_changed',
      timestamp: h.created_at as string,
      candidate_id: (h.candidate_id as string) ?? undefined,
      candidate_name: name,
      client_id: client?.id,
      client_name: client?.name,
      previous_status: h.previous_status as string,
      new_status: h.new_status as string,
      notes: (h.notes as string) ?? undefined,
      summary: isCompletion
        ? `${name} screening completed (${client?.name ?? 'unknown'})`
        : `${name}: ${h.previous_status} → ${h.new_status}`,
    })
  }

  for (const cl of clientsRes.data ?? []) {
    activity.push({
      type: 'client.created',
      timestamp: cl.created_at as string,
      client_id: cl.id as string,
      client_name: cl.name as string,
      summary: `New client onboarded: ${cl.name}`,
    })
  }

  activity.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return NextResponse.json({
    days,
    since: cutoff,
    count: activity.length,
    activity,
  })
}
