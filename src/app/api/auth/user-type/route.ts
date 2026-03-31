import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const authCookies = allCookies
    .filter(c => c.name.includes('auth-token'))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (authCookies.length === 0) {
    return NextResponse.json({ type: null })
  }

  let combined = authCookies.map(c => c.value).join('')

  try {
    if (combined.startsWith('base64-')) {
      combined = combined.substring(7)
    }

    const padding = '='.repeat((4 - combined.length % 4) % 4)
    const decoded = Buffer.from(combined + padding, 'base64url').toString('utf-8')
    const session = JSON.parse(decoded)

    if (!session.access_token) {
      return NextResponse.json({ type: null })
    }

    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
    const serviceKey = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
    if (error || !user) {
      return NextResponse.json({ type: null })
    }

    // Check admin first
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    if (adminUser) {
      return NextResponse.json({ type: 'admin', role: adminUser.role })
    }

    // Check client user
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    if (clientUser) {
      return NextResponse.json({ type: 'employer', role: clientUser.role })
    }

    return NextResponse.json({ type: null })
  } catch {
    return NextResponse.json({ type: null })
  }
}
