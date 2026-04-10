'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { Resend } from 'resend'
import { buildWelcomeEmail, buildTeamInviteEmail } from '@/lib/email-templates'
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
  packages: Array<{ name: string; price: number; description: string; features: string[] }>
  inviteUser: boolean
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
    })
    .select('id')
    .single()

  if (clientError) {
    if (clientError.code === '23505') return { error: 'A client with this slug already exists' }
    return { error: 'Failed to create client' }
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
  if (inviteUser && contactEmail && newClientUserId) {
    try {
      const invite = await issuePortalInvite({
        email: contactEmail,
        clientUserId: newClientUserId,
        next: '/portal/dashboard',
      })

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
        to: contactEmail,
        subject: 'Welcome to PCG Screening Services',
        html: buildWelcomeEmail({
          contactName: contactName || name,
          portalUrl: invite.magicLinkUrl,
        }),
      })
    } catch (err) {
      // Email/invite failure shouldn't block client creation, but log it.
      console.error('[createNewClient] invite failed:', err)
    }
  }

  return { clientId: client.id }
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
  try {
    const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()

    const invite = await issuePortalInvite({
      email,
      clientUserId: inserted!.id,
      next: '/portal/dashboard',
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: email,
      subject: `You've been added to ${client?.name || 'a company'}'s PCG Screening Portal`,
      html: buildTeamInviteEmail({
        memberName: name,
        companyName: client?.name || 'your company',
        portalUrl: invite.magicLinkUrl,
      }),
    })
  } catch (err) {
    console.error('[addClientUser] invite failed:', err)
  }

  return {}
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
