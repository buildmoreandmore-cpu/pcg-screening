'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { Resend } from 'resend'
import { buildReportDeliveryEmail } from '@/lib/email-templates'
import { dispatchAgentEvent } from '@/lib/agent-webhook'
import { generateReportPdf } from '@/lib/report-pdf'
import type { ScreeningResults, ReportAttachment } from '@/lib/report-types'

export async function saveScreeningResults(
  candidateId: string,
  results: ScreeningResults
) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('candidates')
    .update({ screening_results: results })
    .eq('id', candidateId)

  if (error) return { error: error.message }

  await supabase.from('status_history').insert({
    candidate_id: candidateId,
    previous_status: null,
    new_status: 'results_entered',
    notes: 'Screening results saved',
    changed_by: admin.name,
  })

  return { success: true }
}

export async function uploadReportAttachment(formData: FormData) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const file = formData.get('file') as File
  const candidateId = formData.get('candidateId') as string

  if (!file || !candidateId) return { error: 'Missing file or candidateId' }

  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() || 'pdf'
  const storagePath = `attachments/${candidateId}/${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('screening-reports')
    .upload(storagePath, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const attachment: ReportAttachment = {
    id,
    name: file.name,
    storagePath,
    uploadedAt: new Date().toISOString(),
    size: file.size,
  }

  // Append to existing attachments
  const { data: candidate } = await supabase
    .from('candidates')
    .select('report_attachments')
    .eq('id', candidateId)
    .single()

  const existing: ReportAttachment[] = candidate?.report_attachments || []
  const updated = [...existing, attachment]

  const { error: updateError } = await supabase
    .from('candidates')
    .update({ report_attachments: updated })
    .eq('id', candidateId)

  if (updateError) return { error: updateError.message }

  return { attachments: updated }
}

export async function removeReportAttachment(
  candidateId: string,
  attachmentId: string
) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('report_attachments')
    .eq('id', candidateId)
    .single()

  const existing: ReportAttachment[] = candidate?.report_attachments || []
  const toRemove = existing.find(a => a.id === attachmentId)

  if (toRemove) {
    await supabase.storage.from('screening-reports').remove([toRemove.storagePath])
  }

  const updated = existing.filter(a => a.id !== attachmentId)
  const { error } = await supabase
    .from('candidates')
    .update({ report_attachments: updated })
    .eq('id', candidateId)

  if (error) return { error: error.message }

  return { attachments: updated }
}

export async function sendReportToEmployer(
  candidateId: string,
  recipientEmail: string
) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  // Fetch candidate for metadata
  const { data: c } = await supabase
    .from('candidates')
    .select('first_name, last_name, tracking_code, package_name, report_attachments, client:clients(name)')
    .eq('id', candidateId)
    .single()

  if (!c) return { error: 'Candidate not found' }

  // Generate PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateReportPdf(candidateId)
  } catch (err: any) {
    return { error: `PDF generation failed: ${err.message}` }
  }

  // Upload generated PDF to storage
  const storagePath = `reports/${candidateId}.pdf`
  await supabase.storage
    .from('screening-reports')
    .upload(storagePath, pdfBuffer, {
      upsert: true,
      contentType: 'application/pdf',
    })

  const { data: urlData } = supabase.storage
    .from('screening-reports')
    .getPublicUrl(storagePath)

  // Download supplementary attachments
  const attachments: ReportAttachment[] = c.report_attachments || []
  const emailAttachments: Array<{ filename: string; content: Buffer }> = [
    {
      filename: `PCG_Report_${c.tracking_code}.pdf`,
      content: pdfBuffer,
    },
  ]

  for (const att of attachments) {
    try {
      const { data: blob } = await supabase.storage
        .from('screening-reports')
        .download(att.storagePath)
      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer())
        emailAttachments.push({ filename: att.name, content: buffer })
      }
    } catch {
      // Skip failed downloads — don't block the send
    }
  }

  // Send email
  const candidateName = `${c.first_name} ${c.last_name}`
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to: recipientEmail,
      subject: `Background Screening Report — ${candidateName} (${c.tracking_code})`,
      html: buildReportDeliveryEmail({
        candidateName,
        packageName: c.package_name || 'Standard',
        trackingCode: c.tracking_code,
        attachmentCount: attachments.length,
      }),
      attachments: emailAttachments,
    })
  } catch (err: any) {
    return { error: `Email send failed: ${err.message}` }
  }

  // Update candidate record
  await supabase
    .from('candidates')
    .update({
      report_url: urlData.publicUrl,
      report_sent_at: new Date().toISOString(),
      report_sent_by: admin.name,
    })
    .eq('id', candidateId)

  await supabase.from('status_history').insert({
    candidate_id: candidateId,
    previous_status: null,
    new_status: 'report_sent',
    notes: `Report sent to ${recipientEmail}`,
    changed_by: admin.name,
  })

  dispatchAgentEvent('screening.completed', `Report sent for ${candidateName}`, {
    candidateId,
    trackingCode: c.tracking_code,
    name: candidateName,
    sentTo: recipientEmail,
  })

  return { success: true, reportUrl: urlData.publicUrl }
}
