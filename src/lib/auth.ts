import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getAuthUser() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Find the Supabase auth token cookie(s)
  // @supabase/ssr stores tokens in cookies with names like:
  // sb-<ref>-auth-token or sb-<ref>-auth-token.0, .1, etc (chunked)
  const authCookies = allCookies
    .filter(c => c.name.includes('auth-token'))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (authCookies.length === 0) return null

  // Combine chunked cookies
  let combined = authCookies.map(c => c.value).join('')

  try {
    // @supabase/ssr v0.10 stores cookies with a "base64-" prefix before the base64url data
    if (combined.startsWith('base64-')) {
      combined = combined.substring(7)
    }

    // Decode base64url
    const padding = '='.repeat((4 - combined.length % 4) % 4)
    const decoded = Buffer.from(combined + padding, 'base64url').toString('utf-8')
    const session = JSON.parse(decoded)

    if (!session.access_token) return null

    // Verify the token using Supabase service client
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
    const serviceKey = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
    if (error || !user) return null

    return user
  } catch {
    return null
  }
}

export async function getSession() {
  return await getAuthUser()
}

export async function getClientUser() {
  const user = await getAuthUser()
  if (!user) return null

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || '').replace(/\\n/g, '').trim()
  const supabase = createSupabaseClient(supabaseUrl, serviceKey)

  const { data: clientUser } = await supabase
    .from('client_users')
    .select('*, client:clients(*)')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single()

  return clientUser
}

export async function requireAuth() {
  const clientUser = await getClientUser()

  if (!clientUser) {
    redirect('/portal/login')
  }

  return clientUser
}

export async function requireAdmin() {
  const clientUser = await requireAuth()

  if (clientUser.role !== 'admin') {
    redirect('/portal/dashboard')
  }

  return clientUser
}
