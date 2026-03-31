'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { Resend } from 'resend'
import { buildScreeningCompleteEmail } from '@/lib/email-templates'

export async function updateCandidateStatus({
  candidateId,
  newStatus,
  notes,
}: {
  candidateId: string
  newStatus: string
  notes?: string
}) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  // Get current candidate
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*, client:clients(name, notification_email)')
    .eq('id', candidateId)
    .single()

  if (!candidate) return { error: 'Candidate not found' }

  const previousStatus = candidate.status

  // Update candidate
  const updates: Record<string, any> = {
    status: newStatus,
    last_status_update: new Date().toISOString(),
  }

  if (newStatus === 'in_progress' && !candidate.screening_started_at) {
    updates.screening_started_at = new Date().toISOString()
  }
  if (newStatus === 'completed') {
    updates.screening_completed_at = new Date().toISOString()
  }
  if (notes) {
    updates.status_notes = notes
  }

  const { error: updateError } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', candidateId)

  if (updateError) return { error: 'Failed to update status' }

  // Insert status history
  await supabase.from('status_history').insert({
    candidate_id: candidateId,
    previous_status: previousStatus,
    new_status: newStatus,
    notes: notes || null,
    changed_by: admin.name,
  })

  // Send notification emails
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    if (newStatus === 'completed') {
      // Notify candidate
      await resend.emails.send({
        from: fromEmail,
        to: candidate.email,
        subject: `Screening Complete — ${candidate.first_name} ${candidate.last_name}`,
        html: `<p>Hi ${candidate.first_name},</p><p>Your <strong>${candidate.package_name}</strong> screening has been completed. Results have been delivered to your employer.</p><p>Questions? Contact accounts@pcgscreening.com or 770-716-1278.</p>`,
      })

      // Notify employer
      const notifyEmail = candidate.client?.notification_email || 'accounts@pcgscreening.com'
      await resend.emails.send({
        from: fromEmail,
        to: notifyEmail,
        subject: `Screening Complete — ${candidate.first_name} ${candidate.last_name}`,
        html: buildScreeningCompleteEmail({
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          packageName: candidate.package_name,
          trackingCode: candidate.tracking_code,
          detailUrl: `${siteUrl}/portal/candidates/${candidateId}`,
        }),
      })
    }

    if (newStatus === 'in_progress') {
      await resend.emails.send({
        from: fromEmail,
        to: candidate.email,
        subject: `Your screening is underway`,
        html: `<p>Hi ${candidate.first_name},</p><p>Your <strong>${candidate.package_name}</strong> screening is now being processed. Most screenings complete within 1-3 business days.</p><p>Track your status: ${siteUrl}/track with code <strong>${candidate.tracking_code}</strong></p>`,
      })
    }
  } catch {
    // Email failures shouldn't block status updates
  }

  return {}
}

export async function updateJurisdictions({
  candidateId,
  jurisdictions,
}: {
  candidateId: string
  jurisdictions: any[]
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ search_jurisdictions: jurisdictions })
    .eq('id', candidateId)

  return { error: error?.message }
}

export async function uploadReport(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const file = formData.get('file') as File
  const candidateId = formData.get('candidateId') as string

  if (!file || !candidateId) return { error: 'Missing file or candidate ID' }

  const ext = file.name.split('.').pop()
  const path = `reports/${candidateId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('screening-reports')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: 'Upload failed' }

  const { data: urlData } = supabase.storage
    .from('screening-reports')
    .getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('candidates')
    .update({ report_url: urlData.publicUrl })
    .eq('id', candidateId)

  if (updateError) return { error: 'Failed to save report URL' }

  return { url: urlData.publicUrl }
}
