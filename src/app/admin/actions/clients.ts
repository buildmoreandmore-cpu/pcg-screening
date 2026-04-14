'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { Resend } from 'resend'
import { buildWelcomeEmail, buildTeamInviteEmail, buildPasswordResetEmail } from '@/lib/email-templates'
import { dispatchAgentEvent } from '@/lib/agent-webhook'
import { issuePortalInvite } from '@/lib/portal-invite'

export async function createNewClient({
  name,
  slug,
  contactName,
  contactEmail,
  contactPhone,
  website,
  address,
  city,
  state,
  zip,
  billingType,
  packages,
  inviteUser,
  referralSource,
  referralSourceOther,
}: {
  name: string
  slug: string
  contactName: string
  contactEmail: string
  contactPhone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  billingType?: string
  packages: Array<{ name: string; price: number; description: string; features: string[]; components?: Record<string, boolean>; customNotes?: string }>
  inviteUser: boolean
  referralSource?: string
  referralSourceOther?: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Insert client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      name,
      slug,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      website: website || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      packages,
      billing_type: billingType || 'net_30',
      notification_email: contactEmail || 'accounts@pcgscreening.com',
      referral_source: referralSource || null,
      referral_source_other: referralSourceOther || null,
      referral_source_captured_at: referralSource ? new Date().toISOString() : null,
      referral_source_captured_by: referralSource ? 'admin' : null,
    })
    .select('id')
    .single()

  if (clientError) {
    if (clientError.code === '23505') return { error: 'A client with this slug already exists' }
    return { error: 'Failed to create client' }
  }

  // Insert per-package rows into the new first-class client_packages table.
  // The legacy clients.packages JSONB above is kept for safety during rollout.
  if (packages.length > 0) {
    const rows = packages.map((p, i) => ({
      client_id: client.id,
      name: p.name,
      price_cents: Math.round(Number(p.price || 0) * 100),
      description: p.description || null,
      components: p.components || {},
      custom_notes: p.customNotes || null,
      sort_order: i,
    }))
    const { error: pkgErr } = await supabase.from('client_packages').insert(rows)
    if (pkgErr) console.error('[createNewClient] client_packages insert failed:', pkgErr)
  }

  dispatchAgentEvent(
    'client.created',
    `New employer client onboarded: ${name}`,
    {
      client_id: client.id,
      client_name: name,
      slug,
      contact_name: contactName,
      contact_email: contactEmail,
      billing_type: billingType || 'net_30',
    }
  )

  // Create first admin user for this client (and generate a one-time sign-in link)
  let newClientUserId: string | null = null
  if (contactEmail) {
    const { data: inserted } = await supabase
      .from('client_users')
      .insert({
        client_id: client.id,
        email: contactEmail,
        name: contactName || name,
        role: 'admin',
      })
      .select('id')
      .single()
    newClientUserId = inserted?.id ?? null
  }

  // Send welcome email with magic-link sign-in URL
  let inviteWarning: string | undefined
  if (inviteUser && contactEmail && newClientUserId) {
    try {
      const invite = await issuePortalInvite({
        email: contactEmail,
        clientUserId: newClientUserId,
        next: '/portal/setup-password',
      })

      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set')
      }

      const resend = new Resend(process.env.RESEND_API_KEY)
      const sendRes = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
        to: contactEmail,
        subject: 'Welcome to PCG Screening Services',
        html: buildWelcomeEmail({
          contactName: contactName || name,
          portalUrl: invite.magicLinkUrl,
        }),
      })

      // Resend's SDK returns { data, error } instead of throwing on API errors
      if (sendRes.error) {
        throw new Error(`Resend API: ${sendRes.error.message || JSON.stringify(sendRes.error)}`)
      }
    } catch (err) {
      // Don't block client creation, but surface the message to the caller.
      const message = err instanceof Error ? err.message : String(err)
      console.error('[createNewClient] invite failed:', err)
      inviteWarning = `Client created, but invite email failed: ${message}`
    }
  }

  return { clientId: client.id, warning: inviteWarning }
}

export async function resendPortalInvite({ clientUserId }: { clientUserId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Look up the client_users row + parent client name (for the email body).
  const { data: user, error: userErr } = await supabase
    .from('client_users')
    .select('id, email, name, client_id, clients(name)')
    .eq('id', clientUserId)
    .single()

  if (userErr || !user) {
    return { error: 'Could not find that user' }
  }

  if (!user.email) {
    return { error: 'User has no email address on file' }
  }

  try {
    const invite = await issuePortalInvite({
      email: user.email,
      clientUserId: user.id,
      next: '/portal/setup-password',
    })

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const companyName = (user as any).clients?.name as string | undefined
    const resend = new Resend(process.env.RESEND_API_KEY)
    const sendRes = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: user.email,
      subject: 'Your PCG Screening portal access',
      html: buildWelcomeEmail({
        contactName: user.name || 'there',
        portalUrl: invite.magicLinkUrl,
      }),
    })

    if (sendRes.error) {
      throw new Error(`Resend API: ${sendRes.error.message || JSON.stringify(sendRes.error)}`)
    }

    return { ok: true as const, sentTo: user.email }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[resendPortalInvite] failed:', err)
    return { error: `Failed to resend invite: ${message}` }
  }
}

export async function addClientUser({
  clientId,
  name,
  email,
  role,
}: {
  clientId: string
  name: string
  email: string
  role: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: inserted, error } = await supabase
    .from('client_users')
    .insert({
      client_id: clientId,
      email,
      name,
      role: role === 'admin' ? 'admin' : 'user',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'This email already exists' }
    return { error: 'Failed to add user' }
  }

  // Send invite email with magic-link sign-in URL
  let inviteWarning: string | undefined
  try {
    const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()

    const invite = await issuePortalInvite({
      email,
      clientUserId: inserted!.id,
      next: '/portal/setup-password',
    })

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const sendRes = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: email,
      subject: `You've been added to ${client?.name || 'a company'}'s PCG Screening Portal`,
      html: buildTeamInviteEmail({
        memberName: name,
        companyName: client?.name || 'your company',
        portalUrl: invite.magicLinkUrl,
      }),
    })

    if (sendRes.error) {
      throw new Error(`Resend API: ${sendRes.error.message || JSON.stringify(sendRes.error)}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[addClientUser] invite failed:', err)
    inviteWarning = `User added, but invite email failed: ${message}`
  }

  return { warning: inviteWarning }
}

export async function updateClientSettings({
  clientId,
  name,
  contactName,
  contactEmail,
  contactPhone,
  website,
  address,
  city,
  state,
  zip,
  packages,
  billingType,
  notificationPreferences,
}: {
  clientId: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  packages: Array<{ name: string; price: number; description: string; features: string[] }>
  billingType: string
  notificationPreferences: any
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      notification_email: contactEmail || 'accounts@pcgscreening.com',
      website: website || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      packages,
      billing_type: billingType,
      notification_preferences: notificationPreferences,
    })
    .eq('id', clientId)

  return { error: error?.message }
}

export async function deleteClient({ clientId }: { clientId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Soft-delete: deactivate the client to preserve candidate FKs and history
  const { error } = await supabase
    .from('clients')
    .update({ active: false })
    .eq('id', clientId)

  if (error) return { error: error.message }

  revalidatePath('/admin/clients')
  return {}
}

/**
 * Hard-delete a client. Removes:
 *   - the clients row
 *   - every client_users row scoped to this client
 *   - the corresponding auth.users row for any client_user whose auth_user_id
 *     is not referenced by another client_users row in any other client
 *
 * Refuses to run if the client still has candidates so we never orphan
 * screening history. Caller should soft-delete (deactivate) for that case.
 */
export async function permanentlyDeleteClient({ clientId }: { clientId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Block if there are any candidates linked to this client.
  const { count: candidateCount, error: countErr } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if (countErr) return { error: `Failed to check candidates: ${countErr.message}` }
  if ((candidateCount ?? 0) > 0) {
    return {
      error: `Cannot permanently delete: ${candidateCount} candidate record(s) still linked. Deactivate instead.`,
    }
  }

  // Pull all client_users rows so we know which auth users to potentially delete.
  const { data: users, error: usersErr } = await supabase
    .from('client_users')
    .select('id, auth_user_id')
    .eq('client_id', clientId)

  if (usersErr) return { error: `Failed to load client users: ${usersErr.message}` }

  // Delete the client_users rows for this client first so the
  // "is this auth user referenced anywhere else" check below is accurate.
  const { error: deleteUsersErr } = await supabase
    .from('client_users')
    .delete()
    .eq('client_id', clientId)

  if (deleteUsersErr) return { error: `Failed to delete client users: ${deleteUsersErr.message}` }

  // For each auth_user_id we just unlinked, delete the auth.users row IF
  // no other client_users row in any other client still references it.
  const authUserIds = (users ?? [])
    .map((u) => u.auth_user_id)
    .filter((id): id is string => !!id)

  for (const authUserId of authUserIds) {
    const { count: stillLinked } = await supabase
      .from('client_users')
      .select('id', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId)

    if ((stillLinked ?? 0) === 0) {
      // Best-effort delete; ignore errors (e.g., auth user already gone)
      await supabase.auth.admin.deleteUser(authUserId).catch(() => {})
    }
  }

  // Finally delete the client row.
  const { error: deleteClientErr } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (deleteClientErr) return { error: `Failed to delete client: ${deleteClientErr.message}` }

  revalidatePath('/admin/clients')
  return {}
}

export async function toggleClientUser({
  userId,
  active,
}: {
  userId: string
  active: boolean
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('client_users')
    .update({ active })
    .eq('id', userId)

  return { error: error?.message }
}

/**
 * Admin resets a client user's password by generating a recovery link and emailing it.
 */
export async function resetClientUserPassword({ userId }: { userId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: user, error: userErr } = await supabase
    .from('client_users')
    .select('id, email, name, auth_user_id')
    .eq('id', userId)
    .single()

  if (userErr || !user) return { error: 'User not found' }
  if (!user.email) return { error: 'User has no email address' }
  if (!user.auth_user_id) return { error: 'User has no auth account — resend their invite instead' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net'
  const next = '/portal/reset-password'

  const linkRes = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
    options: { redirectTo: `${siteUrl}${next}` },
  })

  if (linkRes.error || !linkRes.data?.properties?.hashed_token) {
    return { error: `Failed to generate reset link: ${linkRes.error?.message || 'Unknown error'}` }
  }

  const hashedToken = linkRes.data.properties.hashed_token
  const resetUrl = `${siteUrl}/portal/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=recovery&next=${encodeURIComponent(next)}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: user.email,
      subject: 'Reset your PCG Screening password',
      html: buildPasswordResetEmail({ name: user.name || 'there', resetUrl }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: `Reset link generated but email failed: ${message}` }
  }

  return { ok: true as const, sentTo: user.email }
}
