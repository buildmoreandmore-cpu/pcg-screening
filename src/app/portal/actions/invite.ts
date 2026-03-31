'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { Resend } from 'resend'
import { buildCandidateInviteEmail } from '@/lib/email-templates'

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
  email,
  packageName,
}: {
  firstName: string
  email: string
  packageName: string
}) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const client = clientUser.client

  // Find package price
  const pkg = client.packages?.find((p: any) => p.name === packageName)
  if (!pkg) return { error: 'Invalid package selected' }

  const trackingCode = generateTrackingCode()

  // Insert candidate
  const { error: insertError } = await supabase.from('candidates').insert({
    tracking_code: trackingCode,
    client_id: client.id,
    client_slug: client.slug,
    first_name: firstName,
    last_name: '',
    email,
    package_name: packageName,
    package_price: pkg.price,
    status: 'submitted',
  })

  if (insertError) return { error: 'Failed to create candidate record' }

  // Send invite email to candidate
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: email,
      subject: `Background Screening Request — ${client.name}`,
      html: buildCandidateInviteEmail({
        candidateName: firstName,
        companyName: client.name,
        packageName,
        applyUrl: `${siteUrl}/?client=${client.slug}`,
      }),
    })
  } catch {
    // Email failed but record was created — don't block
  }

  // Notify employer if notification email set
  try {
    const notifyEmail = client.notification_email || clientUser.email
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: notifyEmail,
      subject: `Screening Invite Sent — ${firstName}`,
      html: `<p>A screening invitation has been sent to <strong>${email}</strong> for the <strong>${packageName}</strong> package.</p><p>Tracking code: <strong>${trackingCode}</strong></p>`,
    })
  } catch {
    // Non-critical
  }

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
    ...(screeningComponents ? { screening_components: screeningComponents } : {}),
  })

  if (insertError) return { error: 'Failed to create candidate record' }

  return { trackingCode }
}
