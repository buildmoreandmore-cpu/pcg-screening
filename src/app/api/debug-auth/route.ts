import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const cookieNames = allCookies.map(c => ({ name: c.name, length: c.value.length }))

  const authCookies = allCookies
    .filter(c => c.name.includes('auth-token'))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (authCookies.length === 0) {
    return NextResponse.json({
      status: 'no_auth_cookies',
      allCookieNames: cookieNames,
      totalCookies: allCookies.length,
    })
  }

  const encoded = authCookies.map(c => c.value).join('')

  try {
    const padding = '='.repeat((4 - encoded.length % 4) % 4)
    const decoded = Buffer.from(encoded + padding, 'base64url').toString('utf-8')
    const session = JSON.parse(decoded)

    const hasAccessToken = !!session.access_token
    const hasRefreshToken = !!session.refresh_token

    if (!session.access_token) {
      return NextResponse.json({
        status: 'no_access_token',
        authCookieNames: authCookies.map(c => c.name),
        sessionKeys: Object.keys(session),
      })
    }

    // Verify token
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
    const serviceKey = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()

    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)

    if (error || !user) {
      return NextResponse.json({
        status: 'token_invalid',
        error: error?.message,
        hasAccessToken,
        hasRefreshToken,
        tokenPrefix: session.access_token.substring(0, 20) + '...',
      })
    }

    // Check client_users
    const { data: clientUser, error: clientError } = await supabase
      .from('client_users')
      .select('id, email, role, active, client_id')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    // Check admin_users
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role, active')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single()

    return NextResponse.json({
      status: 'authenticated',
      userId: user.id,
      email: user.email,
      clientUser: clientUser || null,
      clientError: clientError?.message || null,
      adminUser: adminUser || null,
      adminError: adminError?.message || null,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'decode_error',
      error: err.message,
      authCookieNames: authCookies.map(c => c.name),
      encodedLength: encoded.length,
      encodedPrefix: encoded.substring(0, 50) + '...',
    })
  }
}
