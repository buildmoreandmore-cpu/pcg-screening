/**
 * Handles server-generated magic links from the onboarding / invite flow.
 *
 * The welcome email links to:
 *   /portal/auth/confirm?token_hash=...&type=email&next=/portal/dashboard
 *
 * We verify the hashed token with Supabase, which issues a session and
 * sets the auth cookies on the response, then redirect to `next`.
 *
 * Paired with src/lib/portal-invite.ts which produces these URLs.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') || 'email') as
    | 'email'
    | 'recovery'
    | 'invite'
    | 'magiclink'
    | 'signup'
    | 'email_change'
  const next = searchParams.get('next') || '/portal/dashboard'

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/portal/login?error=missing_token`)
  }

  const cookieStore = await cookies()
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/\\n/g, '')
    .trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    .replace(/\\n/g, '')
    .trim()

  // Build the redirect response first so we can set cookies on it.
  // Setting cookies on `cookieStore` alone doesn't propagate them to
  // the outgoing NextResponse.redirect().
  const redirectUrl = `${origin}${next}`
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent('link_expired')}`
    )
  }

  // Pass session tokens as URL hash fragments so the browser client can
  // establish the session immediately. This is more reliable than relying
  // on httpOnly cookies which createBrowserClient can't read via JS.
  const hashParams = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    type: type,
  })
  const redirectWithHash = `${origin}${next}#${hashParams.toString()}`

  // Copy the auth cookies onto the hash-redirect response too (belt & suspenders).
  const hashResponse = NextResponse.redirect(redirectWithHash)
  response.cookies.getAll().forEach(({ name, value }) => {
    hashResponse.cookies.set(name, value)
  })

  return hashResponse
}
