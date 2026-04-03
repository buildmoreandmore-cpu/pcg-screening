import { NextRequest, NextResponse } from 'next/server'
import { getClientUser } from '@/lib/auth'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

// POST — portal user creates a new cobrowse session
export async function POST() {
  const clientUser = await getClientUser()
  if (!clientUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cobrowse_sessions')
    .insert({
      client_user_id: clientUser.id,
      client_id: clientUser.client_id,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })

  return NextResponse.json({ sessionId: data.id })
}

// GET — admin lists pending/active sessions
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cobrowse_sessions')
    .select('*, client_user:client_users(name, email), client:clients(name)')
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })

  return NextResponse.json({ sessions: data })
}
