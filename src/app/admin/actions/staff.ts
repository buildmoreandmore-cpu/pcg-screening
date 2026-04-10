'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireOwner } from '@/lib/admin-auth'
import { getPortalSiteUrl } from '@/lib/portal-invite'
import { buildAdminInviteEmail } from '@/lib/email-templates'

/**
 * Add a new PCG internal admin user.
 *
 * Mirrors the portal-invite flow:
 *   1. Creates or finds a Supabase auth user for the email.
 *   2. Inserts an admin_users row (the link_auth_user trigger will wire
 *      auth_user_id, but we also set it explicitly for immediacy).
 *   3. Generates a one-time magic link that lands on /portal/auth/confirm
 *      (shared confirm route), next=/admin/dashboard.
 *   4. Emails the invite via Resend.
 *
 * Owner-only.
 */
export async function addAdminUser({
  email,
  name,
  role,
}: {
  email: string
  name: string
  role: 'admin' | 'owner'
}) {
  await requireOwner()
  const supabase = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !name.trim()) {
    return { error: 'Name and email are required.' }
  }

  // 1. Ensure an auth.users row exists for this email.
  let authUserId: string | null = null

  const createRes = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  })

  if (createRes.data?.user) {
    authUserId = createRes.data.user.id
  } else {
    const msg = createRes.error?.message?.toLowerCase() ?? ''
    const isExists =
      msg.includes('already') || msg.includes('exists') || msg.includes('registered')
    if (!isExists && createRes.error) {
      return { error: `Failed to create auth user: ${createRes.error.message}` }
    }
    for (let page = 1; page <= 20 && !authUserId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (error) return { error: `Failed to look up auth user: ${error.message}` }
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
    return { error: `Could not create or locate auth user for ${normalizedEmail}` }
  }

  // 2. Insert admin_users row (or update if pre-seeded by email).
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('admin_users')
      .update({ auth_user_id: authUserId, name, role, active: true })
      .eq('id', existing.id)
  } else {
    const { error: insertErr } = await supabase.from('admin_users').insert({
      auth_user_id: authUserId,
      email: normalizedEmail,
      name,
      role,
      active: true,
    })
    if (insertErr) {
      if (insertErr.code === '23505') return { error: 'An admin with this email already exists.' }
      return { error: `Failed to insert admin_users row: ${insertErr.message}` }
    }
  }

  // 3. Magic-link invite.
  const siteUrl = getPortalSiteUrl()
  const next = '/portal/setup-password'
  const linkRes = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}${next}` },
  })

  if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
    return {
      error: `Admin created, but magic link failed: ${linkRes.error?.message ?? 'no hashed_token returned'}`,
    }
  }

  const hashedToken = linkRes.data.properties.hashed_token
  const magicLinkUrl = `${siteUrl}/portal/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=email&next=${encodeURIComponent(next)}`

  // 4. Send invite email.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: normalizedEmail,
      subject: "You've been invited to the PCG Screening admin dashboard",
      html: buildAdminInviteEmail({
        adminName: name,
        portalUrl: magicLinkUrl,
      }),
    })
  } catch (err) {
    console.error('[addAdminUser] email send failed:', err)
  }

  revalidatePath('/admin/staff')
  return {}
}

export async function toggleAdminUser({
  adminId,
  active,
}: {
  adminId: string
  active: boolean
}) {
  await requireOwner()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('admin_users')
    .update({ active })
    .eq('id', adminId)

  if (error) return { error: error.message }

  revalidatePath('/admin/staff')
  return {}
}

export async function updateAdminRole({
  adminId,
  role,
}: {
  adminId: string
  role: 'admin' | 'owner'
}) {
  await requireOwner()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('admin_users')
    .update({ role })
    .eq('id', adminId)

  if (error) return { error: error.message }

  revalidatePath('/admin/staff')
  return {}
}
