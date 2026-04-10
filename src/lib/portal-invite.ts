/**
 * Portal invite helper — bridges the gap between client_users rows and
 * Supabase auth.users. Creates (or finds) the auth user, links it back to
 * the client_users row via auth_user_id, and generates a one-time
 * magic-link URL that our /portal/auth/confirm route can verify server-side.
 *
 * Used by:
 *   - src/app/admin/actions/clients.ts (createClient, addClientUser, resendPortalInvite)
 *   - src/app/api/admin/repair-portal-users/route.ts (bulk backfill)
 */

import { createAdminClient } from './supabase-admin'

export function getPortalSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net'
  return raw.trim().replace(/\/+$/, '')
}

export interface PortalInviteResult {
  authUserId: string
  magicLinkUrl: string
  created: boolean
}

export async function issuePortalInvite({
  email,
  clientUserId,
  next = '/portal/setup-password',
}: {
  email: string
  clientUserId: string
  next?: string
}): Promise<PortalInviteResult> {
  const supabase = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()
  const siteUrl = getPortalSiteUrl()

  // 1. Ensure an auth.users row exists for this email.
  let authUserId: string | null = null
  let created = false

  const createRes = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  })

  if (createRes.data?.user) {
    authUserId = createRes.data.user.id
    created = true
  } else {
    // Likely "email already exists". Page through listUsers to find them.
    const msg = createRes.error?.message?.toLowerCase() ?? ''
    const isExists =
      msg.includes('already') || msg.includes('exists') || msg.includes('registered')
    if (!isExists && createRes.error) {
      throw new Error(`createUser failed: ${createRes.error.message}`)
    }

    for (let page = 1; page <= 20 && !authUserId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw new Error(`listUsers failed: ${error.message}`)
      const match = data.users.find(
        (u: { email?: string | null }) => u.email?.toLowerCase() === normalizedEmail
      )
      if (match) {
        authUserId = match.id
        break
      }
      if (data.users.length < 200) break
    }
  }

  if (!authUserId) {
    throw new Error(`Could not create or find auth user for ${normalizedEmail}`)
  }

  // 2. Link the client_users row to the auth user (idempotent — always overwrite
  //    since we just confirmed this auth_user_id represents this email).
  const { error: linkErr } = await supabase
    .from('client_users')
    .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
    .eq('id', clientUserId)

  if (linkErr) {
    throw new Error(`Failed to link client_users row: ${linkErr.message}`)
  }

  // 3. Generate a one-time magic link. Supabase returns `hashed_token` which
  //    we verify server-side in /portal/auth/confirm.
  const linkRes = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: {
      redirectTo: `${siteUrl}${next}`,
    },
  })

  if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
    throw new Error(
      `generateLink failed: ${linkRes.error?.message ?? 'no hashed_token returned'}`
    )
  }

  const hashedToken = linkRes.data.properties.hashed_token
  const magicLinkUrl = `${siteUrl}/portal/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=email&next=${encodeURIComponent(next)}`

  return { authUserId, magicLinkUrl, created }
}
