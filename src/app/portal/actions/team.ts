'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import { Resend } from 'resend'
import { buildTeamInviteEmail } from '@/lib/email-templates'

export async function inviteTeamMember({
  name,
  email,
  role,
}: {
  name: string
  email: string
  role: string
}) {
  const clientUser = await requireAdmin()
  const supabase = createAdminClient()

  // Check for existing member
  const { data: existing } = await supabase
    .from('client_users')
    .select('id')
    .eq('client_id', clientUser.client_id)
    .eq('email', email)
    .single()

  if (existing) return { error: 'A team member with this email already exists' }

  // Insert client_user record
  const { error: insertError } = await supabase.from('client_users').insert({
    client_id: clientUser.client_id,
    email,
    name,
    role: role === 'admin' ? 'admin' : 'user',
  })

  if (insertError) return { error: 'Failed to add team member' }

  // Send invite email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: email,
      subject: `You've been added to ${clientUser.client.name}'s PCG Screening Portal`,
      html: buildTeamInviteEmail({
        memberName: name,
        companyName: clientUser.client.name,
        portalUrl: `${siteUrl}/portal/login`,
      }),
    })
  } catch {
    // Email failed but user was created
  }

  return {}
}

export async function deactivateTeamMember(memberId: string) {
  const clientUser = await requireAdmin()
  const supabase = createAdminClient()

  // Can't deactivate yourself
  if (memberId === clientUser.id) {
    return { error: 'You cannot remove yourself' }
  }

  const { error } = await supabase
    .from('client_users')
    .update({ active: false })
    .eq('id', memberId)
    .eq('client_id', clientUser.client_id)

  if (error) return { error: 'Failed to remove team member' }

  return {}
}
