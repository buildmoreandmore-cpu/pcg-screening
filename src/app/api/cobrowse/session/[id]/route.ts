import { NextRequest, NextResponse } from 'next/server'
import { getClientUser } from '@/lib/auth'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

// PATCH — accept, end, or toggle control on a session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = createAdminClient()

  // Try admin first, then portal user
  const admin = await getAdminUser()
  const clientUser = !admin ? await getClientUser() : null

  if (!admin && !clientUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: session } = await supabase
    .from('cobrowse_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const updates: Record<string, any> = {}

  // Admin accepting session
  if (body.action === 'accept' && admin) {
    updates.status = 'active'
    updates.admin_user_id = admin.id
    updates.started_at = new Date().toISOString()
  }

  // Either party ending session
  if (body.action === 'end') {
    updates.status = 'ended'
    updates.ended_at = new Date().toISOString()
    updates.control_enabled = false
  }

  // Toggle control
  if (body.action === 'enable_control' && admin) {
    updates.control_enabled = true
  }
  if (body.action === 'disable_control') {
    updates.control_enabled = false
  }

  const { error } = await supabase
    .from('cobrowse_sessions')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
