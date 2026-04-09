import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAgentAuth } from '@/lib/agent-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, name, slug, active, contact_name, contact_email, contact_phone, billing_type, packages, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ clients: data ?? [], count: data?.length ?? 0 })
}
