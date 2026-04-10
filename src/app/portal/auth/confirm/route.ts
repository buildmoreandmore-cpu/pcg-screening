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

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent('link_expired')}`
    )
  }

  return response
}
