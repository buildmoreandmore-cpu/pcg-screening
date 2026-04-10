'use server'

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'

type LeadType = 'screen' | 'package' | 'call'

const TYPE_LABELS: Record<LeadType, string> = {
  screen: 'Run my first screen',
  package: 'Build a custom package',
  call: 'Schedule a call',
}

export async function submitLeadRequest({
  name,
  company,
  email,
  phone,
  type,
  message,
  source,
}: {
  name: string
  company: string
  email: string
  phone: string
  type: LeadType
  message: string
  source?: string
}) {
  if (!name.trim() || !email.trim()) {
    return { error: 'Name and email are required.' }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('lead_requests')
    .insert({
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      type: TYPE_LABELS[type] ? type : 'screen',
      message: message.trim() || null,
      source: source || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[submitLeadRequest] insert failed:', error)
    return { error: 'Could not submit your request. Please try again.' }
  }

  // Notify Gwen (and any address in LEADS_NOTIFY_EMAIL). Best-effort — never
  // block the form on email failures.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const to =
      process.env.LEADS_NOTIFY_EMAIL ||
      'gwen@pcgscreening.com'

    const typeLabel = TYPE_LABELS[type] || type
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>',
      to,
      replyTo: email.trim(),
      subject: `New PCG lead: ${name.trim()}${company.trim() ? ` (${company.trim()})` : ''} — ${typeLabel}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a2547">
          <h2 style="color:#1a2547;margin-bottom:6px">New lead from pcgscreening.net</h2>
          <p style="color:#777;font-size:13px;margin-top:0">Reply to this email to contact them directly.</p>
          <table style="border-collapse:collapse;width:100%;margin-top:18px;font-size:14px">
            <tr><td style="padding:6px 0;color:#777;width:120px">Wants:</td><td style="padding:6px 0"><strong>${typeLabel}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#777">Name:</td><td style="padding:6px 0">${escapeHtml(name)}</td></tr>
            ${company.trim() ? `<tr><td style="padding:6px 0;color:#777">Company:</td><td style="padding:6px 0">${escapeHtml(company)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#777">Email:</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(email)}" style="color:#c9a227">${escapeHtml(email)}</a></td></tr>
            ${phone.trim() ? `<tr><td style="padding:6px 0;color:#777">Phone:</td><td style="padding:6px 0">${escapeHtml(phone)}</td></tr>` : ''}
            ${message.trim() ? `<tr><td style="padding:6px 0;color:#777;vertical-align:top">Message:</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(message)}</td></tr>` : ''}
          </table>
          <p style="margin-top:24px;font-size:13px;color:#777">
            View in admin: <a href="https://www.pcgscreening.net/admin/leads" style="color:#c9a227">pcgscreening.net/admin/leads</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[submitLeadRequest] email failed:', err)
  }

  return { id: data.id }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
