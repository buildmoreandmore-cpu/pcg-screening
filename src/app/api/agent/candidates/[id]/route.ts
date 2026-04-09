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
