'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { Resend } from 'resend'
import { buildCandidateInviteEmail } from '@/lib/email-templates'
import { sendNotification } from '@/lib/notifications'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

function generateTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PCG-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function inviteCandidate({
  firstName,
  lastName,
  email,
  packageName,
  screeningComponents,
}: {
  firstName: string
  lastName: string
  email: string
  packageName: string
  screeningComponents?: any
}) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const isCustom = packageName === 'Custom Screening'

  // Find package price (custom = 0)
  if (!isCustom) {
    const pkg = client.packages?.find((p: any) => p.name === packageName)
    if (!pkg) return { error: 'Invalid package selected' }
  }
  const pkg = client.packages?.find((p: any) => p.name === packageName)

  const trackingCode = generateTrackingCode()

  // Insert candidate
  const { error: insertError } = await supabase.from('candidates').insert({
    tracking_code: trackingCode,
    client_id: client.id,
    client_slug: client.slug,
    first_name: firstName,
    last_name: lastName,
    email,
    package_name: packageName,
    package_price: isCustom ? 0 : (pkg?.price || 0),
    status: 'submitted',
    submitted_by_user_id: clientUser.id,
    ...(screeningComponents ? { screening_components: screeningComponents } : {}),
  })

  if (insertError) return { error: 'Failed to create candidate record' }

  dispatchAgentEvent(
    'candidate.submitted',
    `${firstName} ${lastName} invited for ${packageName} (${client.name})`,
    {
      tracking_code: trackingCode,
      client_id: client.id,
      client_name: client.name,
      candidate_email: email,
      package_name: packageName,
      source: 'portal_invite',
    }
  )

  // Send invite email to candidate (preference-aware)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  sendNotification({
    clientId: client.id,
    audience: 'candidate',
    event: 'intake_link',
    to: email,
    subject: `Background Screening Request — ${client.name}`,
    html: buildCandidateInviteEmail({
      candidateName: firstName,
      companyName: client.name,
      packageName,
      applyUrl: `${siteUrl}/apply/${client.slug}?invite=${trackingCode}`,
    }),
  })

  // Notify employer
  const notifyEmail = client.notification_email || clientUser.email
  sendNotification({
    clientId: client.id,
    audience: 'client',
    event: 'order_received',
    to: notifyEmail,
    subject: `Screening Invite Sent — ${firstName} ${lastName}`,
    html: `<p>A screening invitation has been sent to <strong>${email}</strong> for the <strong>${packageName}</strong> package.</p><p>Tracking code: <strong>${trackingCode}</strong></p>`,
  })

  // Notify PCG admin
  sendNotification({
    clientId: client.id,
    audience: 'pcg_admin',
    event: 'new_order',
    to: 'accounts@pcgscreening.com',
    subject: `New Screening Order — ${firstName} ${lastName} (${client.name})`,
    html: `<p>New screening order from <strong>${client.name}</strong>.</p><p>Candidate: <strong>${firstName} ${lastName}</strong> (${email})</p><p>Package: <strong>${packageName}</strong></p><p>Tracking: <strong>${trackingCode}</strong></p>`,
  })

  return { trackingCode }
}

export async function inviteCandidateManual({
  firstName,
  lastName,
  email,
  phone,
  packageName,
  screeningComponents,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string
  packageName: string
  screeningComponents?: any
}) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  const isCustom = packageName === 'Custom Screening'

  if (!isCustom) {
    const pkg = client.packages?.find((p: any) => p.name === packageName)
    if (!pkg) return { error: 'Invalid package selected' }
  }

  const pkg = client.packages?.find((p: any) => p.name === packageName)
  const trackingCode = generateTrackingCode()

  const { error: insertError } = await supabase.from('candidates').insert({
    tracking_code: trackingCode,
    client_id: client.id,
    client_slug: client.slug,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    package_name: packageName,
    package_price: isCustom ? 0 : (pkg?.price || 0),
    status: 'submitted',
    submitted_by_user_id: clientUser.id,
    ...(screeningComponents ? { screening_components: screeningComponents } : {}),
  })

  if (insertError) return { error: 'Failed to create candidate record' }

  dispatchAgentEvent(
    'candidate.submitted',
    `${firstName} ${lastName} added manually for ${packageName} (${client.name})`,
    {
      tracking_code: trackingCode,
      client_id: client.id,
      client_name: client.name,
      candidate_email: email,
      package_name: packageName,
      source: 'portal_manual',
    }
  )

  return { trackingCode }
}
