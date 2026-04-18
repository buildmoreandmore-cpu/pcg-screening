import { NextRequest, NextResponse } from 'next/server'
import { createCredentialingAdminClient } from '@/lib/supabase-credentialing'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const VERIFICATION_TYPES = {
  core: ['ssn_trace', 'county_criminal', 'national_criminal', 'sex_offender_registry', 'oig_sam'],
  locum_specific: ['license_verification', 'dea_verification', 'board_certification', 'npdb', 'employment_verification', 'reference_check', 'malpractice_insurance_verification'],
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MCS-'
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const required = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'specialty']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const supabase = createCredentialingAdminClient()

    // Generate unique tracking code
    let trackingCode = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateTrackingCode()
      const { data: existing } = await supabase
        .from('providers')
        .select('id')
        .eq('tracking_code', candidate)
        .single()
      if (!existing) {
        trackingCode = candidate
        break
      }
    }

    if (!trackingCode) {
      return NextResponse.json({ error: 'Failed to generate tracking code. Please try again.' }, { status: 500 })
    }

    // Insert provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        tracking_code: trackingCode,
        first_name: body.first_name,
        last_name: body.last_name,
        middle_name: body.middle_name || null,
        degree: body.degree || null,
        suffix: body.suffix || null,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
        specialty: body.specialty,
        npi_number: body.npi_number || null,
        dea_number: body.dea_number || null,
        dea_expiration: body.dea_expiration || null,
        states_of_license: body.states_of_license || [],
        ssn_encrypted: body.ssn || null,
        citizenship: body.citizenship || null,
        birthplace: body.birthplace || null,
        home_address: body.home_address || null,
        home_city: body.home_city || null,
        home_state: body.home_state || null,
        home_zip: body.home_zip || null,
        office_address: body.office_address || null,
        office_city: body.office_city || null,
        office_state: body.office_state || null,
        office_zip: body.office_zip || null,
        status: 'intake_received',
        source: 'portal',
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (providerError || !provider) {
      console.error('Provider insert error:', providerError)
      return NextResponse.json({ error: 'Failed to create provider record' }, { status: 500 })
    }

    const providerId = provider.id

    // Link any pre-uploaded documents to this provider
    const documentIds = body.document_ids || []
    if (documentIds.length > 0) {
      await supabase
        .from('provider_documents')
        .update({ provider_id: providerId })
        .in('id', documentIds)
    }

    // Insert license records (table may not exist yet — non-fatal)
    const licenses = body.licenses || []
    if (licenses.length > 0) {
      try {
        const licenseRows = licenses.map((l: { state: string; license_number: string; active: boolean; date_granted: string; expiration_date: string }) => ({
          provider_id: providerId,
          state: l.state,
          license_number: l.license_number || null,
          status: l.active ? 'active' : 'inactive',
          date_granted: l.date_granted || null,
          expiration_date: l.expiration_date || null,
        }))
        const { error: licenseError } = await supabase
          .from('provider_licenses')
          .insert(licenseRows)
        if (licenseError) {
          console.error('License insert error:', licenseError)
        }
      } catch (e) {
        console.error('License insert skipped:', e)
      }
    }

    // Create default verification rows
    const verificationRows = [
      ...VERIFICATION_TYPES.core.map((v) => ({
        provider_id: providerId,
        verification_type: v,
        category: 'core' as const,
        completed: false,
      })),
      ...VERIFICATION_TYPES.locum_specific.map((v) => ({
        provider_id: providerId,
        verification_type: v,
        category: 'locum_specific' as const,
        completed: false,
      })),
    ]

    const { error: verificationsError } = await supabase
      .from('provider_verifications')
      .insert(verificationRows)

    if (verificationsError) {
      console.error('Verifications insert error:', verificationsError)
    }

    // Insert status history
    await supabase.from('provider_status_history').insert({
      provider_id: providerId,
      previous_status: null,
      new_status: 'intake_received',
    })

    // Send emails
    const resend = new Resend(process.env.RESEND_API_KEY)
    const providerName = `${body.first_name} ${body.last_name}`
    const credentialingUrl = process.env.CREDENTIALING_URL || 'https://credentialing.pcgscreening.net'

    // Provider confirmation email
    try {
      await resend.emails.send({
        from: 'PCG Screening <accounts@pcgscreening.com>',
        to: body.email,
        subject: `MedCare Staffing — Credentialing Application Received`,
        html: buildProviderEmail(providerName, trackingCode),
      })
    } catch (e) {
      console.error('Provider email error:', e)
    }

    // Admin notification email
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
    if (adminEmail) {
      try {
        await resend.emails.send({
          from: 'PCG Screening <noreply@pcgscreening.net>',
          to: adminEmail,
          subject: `New Credentialing Submission — Dr. ${body.last_name}, ${body.specialty}`,
          html: buildAdminEmail(providerName, body, trackingCode, providerId, credentialingUrl, documentIds.length),
        })
      } catch (e) {
        console.error('Admin email error:', e)
      }
    }

    return NextResponse.json({ success: true, trackingCode })
  } catch (error) {
    console.error('Credentialing submit error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

function buildProviderEmail(name: string, code: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #2C5F8A;"><span style="color: #4A90D9;">MED</span>care</span>
        <div style="display: inline-block; background: #4A90D9; color: white; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; padding: 2px 8px; border-radius: 2px; margin-left: 4px;">STAFFING</div>
      </div>
      <p style="color: #333; font-size: 15px;">Dear Dr. ${name.split(' ').pop()},</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">Your credentialing application has been received and is being reviewed by our team.</p>
      <div style="background: #F0F6FF; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Reference Code</p>
        <p style="color: #4A90D9; font-size: 28px; font-weight: 700; font-family: monospace; margin: 0;">${code}</p>
      </div>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">If you need to submit additional documents or have questions:</p>
      <p style="color: #555; font-size: 14px; line-height: 1.8;">
        <strong style="color: #2C5F8A;">MedCare Staffing:</strong> 888-474-3380 | tharbin@medcarestaffing.com<br/>
        <strong>PCG Screening:</strong> 770-716-1278 | accounts@pcgscreening.com
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 11px;">Credentialing managed by PCG Screening Services on behalf of MedCare Staffing, Inc.</p>
    </div>
  `
}

function buildAdminEmail(name: string, body: any, code: string, providerId: string, credUrl: string, docCount: number): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">New Credentialing Submission</h2>
      <p style="color: #555; font-size: 14px;">A new locum tenens credentialing application has been submitted.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #888; width: 140px;">Provider</td><td style="padding: 8px 0; color: #333; font-weight: 600;">Dr. ${name}${body.degree ? ', ' + body.degree : ''}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Specialty</td><td style="padding: 8px 0; color: #333;">${body.specialty}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">States</td><td style="padding: 8px 0; color: #333;">${(body.states_of_license || []).join(', ') || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Documents</td><td style="padding: 8px 0; color: #333;">${docCount} of 13 uploaded</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Tracking Code</td><td style="padding: 8px 0; color: #4A90D9; font-weight: 700; font-family: monospace;">${code}</td></tr>
      </table>
      <a href="${credUrl}/admin/providers/${providerId}" style="display: inline-block; background: #4A90D9; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View in Dashboard</a>
    </div>
  `
}
