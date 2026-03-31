import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ announcement: data })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, type, expires_at } = await req.json()

  if (!message || message.length > 200) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Deactivate all existing announcements
  await supabase.from('announcements').update({ active: false }).eq('active', true)

  // Create new one
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      message,
      type: type || 'info',
      expires_at: expires_at || null,
      created_by: admin.email,
      active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })

  return NextResponse.json({ announcement: data })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  const supabase = createAdminClient()
  await supabase.from('announcements').update({ active: false }).eq('id', id)

  return NextResponse.json({ ok: true })
}
