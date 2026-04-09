'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { Resend } from 'resend'
import { buildScreeningCompleteEmail } from '@/lib/email-templates'
import { sendNotification } from '@/lib/notifications'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

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

  const candidateName = `${candidate.first_name} ${candidate.last_name}`
  const clientName = candidate.client?.name ?? 'unknown client'

  dispatchAgentEvent(
    'candidate.status_changed',
    `${candidateName}: ${previousStatus} → ${newStatus} (${clientName})`,
    {
      candidate_id: candidateId,
      candidate_name: candidateName,
      client_id: candidate.client_id,
      client_name: clientName,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: notes || null,
      changed_by: admin.name,
    }
  )

  if (newStatus === 'completed') {
    dispatchAgentEvent(
      'screening.completed',
      `${candidateName} screening completed (${clientName})`,
      {
        candidate_id: candidateId,
        candidate_name: candidateName,
        client_id: candidate.client_id,
        client_name: clientName,
        package_name: candidate.package_name,
        tracking_code: candidate.tracking_code,
      }
    )
  }

  if (candidate.sla_flagged) {
    dispatchAgentEvent(
      'screening.flagged',
      `${candidateName} screening flagged (SLA)`,
      {
        candidate_id: candidateId,
        candidate_name: candidateName,
        client_id: candidate.client_id,
        client_name: clientName,
        reason: 'sla_flagged',
      }
    )
  }

  // Send notification emails (preference-aware)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const clientId = candidate.client_id

  if (newStatus === 'completed') {
    // Notify candidate
    sendNotification({
      clientId,
      audience: 'candidate',
      event: 'status_updates',
      to: candidate.email,
      subject: `Screening Complete — ${candidateName}`,
      html: `<p>Hi ${candidate.first_name},</p><p>Your <strong>${candidate.package_name}</strong> screening has been completed. Results have been delivered to your employer.</p><p>Questions? Contact accounts@pcgscreening.com or 770-716-1278.</p>`,
    })

    // Notify employer
    const notifyEmail = candidate.client?.notification_email || 'accounts@pcgscreening.com'
    sendNotification({
      clientId,
      audience: 'client',
      event: 'report_completed',
      to: notifyEmail,
      subject: `Screening Complete — ${candidateName}`,
      html: buildScreeningCompleteEmail({
        candidateName,
        packageName: candidate.package_name,
        trackingCode: candidate.tracking_code,
        detailUrl: `${siteUrl}/portal/candidates/${candidateId}`,
      }),
    })

    // Notify PCG admin
    sendNotification({
      clientId,
      audience: 'pcg_admin',
      event: 'report_completed',
      to: 'accounts@pcgscreening.com',
      subject: `Report Complete — ${candidateName} (${candidate.client?.name})`,
      html: `<p><strong>${candidateName}</strong>'s <em>${candidate.package_name}</em> screening for <strong>${candidate.client?.name}</strong> has been completed.</p><p><a href="${siteUrl}/admin/candidates/${candidateId}">View in dashboard</a></p>`,
    })
  }

  if (newStatus === 'in_progress') {
    sendNotification({
      clientId,
      audience: 'candidate',
      event: 'status_updates',
      to: candidate.email,
      subject: `Your screening is underway`,
      html: `<p>Hi ${candidate.first_name},</p><p>Your <strong>${candidate.package_name}</strong> screening is now being processed. Most screenings complete within 1-3 business days.</p><p>Track your status: ${siteUrl}/track with code <strong>${candidate.tracking_code}</strong></p>`,
    })
  }

  return {}
}

export async function updateScreeningComponents(candidateId: string, components: any) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ screening_components: components })
    .eq('id', candidateId)

  if (!error) {
    await supabase.from('status_history').insert({
      candidate_id: candidateId,
      new_status: 'updated',
      notes: `Screening components updated by ${admin.name}`,
      changed_by: admin.name,
    })
  }

  return { error: error?.message }
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

export async function updateInternalNotes({
  candidateId,
  notes,
}: {
  candidateId: string
  notes: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ internal_notes: notes })
    .eq('id', candidateId)

  return { error: error?.message }
}

export async function markReportSent(candidateId: string) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({
      report_sent_at: new Date().toISOString(),
      report_sent_by: admin.name,
    })
    .eq('id', candidateId)

  if (!error) {
    await supabase.from('status_history').insert({
      candidate_id: candidateId,
      new_status: 'report_sent',
      notes: `Report sent to employer by ${admin.name}`,
      changed_by: admin.name,
    })
  }

  return { error: error?.message }
}
