'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { getPortalSiteUrl } from '@/lib/portal-invite'
import { buildPasswordResetEmail } from '@/lib/email-templates'

/**
 * Request a password reset.
 *
 * Generates a Supabase recovery link via the admin API, wraps it in our
 * /portal/auth/confirm route (which uses verifyOtp on the token_hash), and
 * sends it via Resend with our branded template.
 *
 * Returns success regardless of whether the email exists, so attackers can't
 * enumerate registered users.
 */
export async function requestPasswordReset({ email }: { email: string }) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { error: 'Email is required.' }

  const supabase = createAdminClient()
  const siteUrl = getPortalSiteUrl()
  const next = '/portal/reset-password'

  // Look up the display name from client_users or admin_users (best-effort).
  let displayName = 'there'
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('name')
    .eq('email', normalizedEmail)
    .maybeSingle()
  if (clientUser?.name) {
    displayName = clientUser.name
  } else {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('name')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (adminUser?.name) displayName = adminUser.name
  }

  const linkRes = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}${next}` },
  })

  // If the email isn't registered, generateLink may error. Swallow that —
  // we still return success to avoid leaking which emails exist.
  if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
    console.warn('[requestPasswordReset] generateLink:', linkRes.error?.message)
    return {}
  }

  const hashedToken = linkRes.data.properties.hashed_token
  const resetUrl = `${siteUrl}/portal/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=recovery&next=${encodeURIComponent(next)}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: normalizedEmail,
      subject: 'Reset your PCG Screening password',
      html: buildPasswordResetEmail({ name: displayName, resetUrl }),
    })
  } catch (err) {
    console.error('[requestPasswordReset] email send failed:', err)
  }

  return {}
}

export async function signOut() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Delete all Supabase auth cookies
  for (const cookie of allCookies) {
    if (cookie.name.includes('auth-token')) {
      cookieStore.delete(cookie.name)
    }
  }

  redirect('/portal/login')
}
