import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { FCRA_DISCLOSURE_VERSION } from '@/lib/fcra-disclosure'
import { buildCandidateSubmissionConfirmationEmail } from '@/lib/email-templates'
import { generateAndStoreConsentPdf } from '@/lib/consent-pdf'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function generateTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PCG-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientSlug, inviteCode, firstName, lastName, maidenName, email, phone,
      dob, ssn, sex, race, driversLicense, dlState, dlClass, dlExpiration,
      address, city, state, zip,
      packageName, packagePrice, signatureData, signatureMethod,
      referralSource, referralEmployer, additionalDetails,
    } = body
    // Derive last-4 for legacy column from full SSN
    const ssn4 = ssn ? ssn.slice(-4) : null

    // Audit headers captured at consent time. These get written into the
    // candidates row alongside consent_signed_at so we can defensibly prove
    // who signed what, when, and from where.
    const xff = req.headers.get('x-forwarded-for') || ''
    const consentIp = xff.split(',')[0].trim() || req.headers.get('x-real-ip') || null
    const consentUserAgent = req.headers.get('user-agent') || null

    // Validate required fields
    if (!clientSlug || !firstName || !lastName || !email || !packageName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify client exists and is active
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, slug')
      .eq('slug', clientSlug)
      .eq('active', true)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Invalid screening link' }, { status: 400 })
    }

    // Look up the client_packages row for this package so we can copy the
    // configured components (and drug panel) onto the candidate. Without
    // this step, the report workflow falls back to a default 3-component
    // list and Gwen can't mark education/employment/etc. as completed even
    // though the package included them.
    const { data: pkgRow } = await supabase
      .from('client_packages')
      .select('components, drug_panel')
      .eq('client_id', client.id)
      .eq('name', packageName)
      .eq('active', true)
      .maybeSingle()

    const packageComponents = (pkgRow?.components as Record<string, boolean> | null) || null
    const packageDrugPanel = pkgRow?.drug_panel || null

    // Build screening_components in the nested-enabled format the rest of
    // the app expects. e.g. { criminal_history: { enabled: true } }
    const screeningComponentsFromPackage: Record<string, unknown> | null = packageComponents
      ? Object.fromEntries(
          Object.entries(packageComponents)
            .filter(([, v]) => v === true)
            .map(([k]) => [k, { enabled: true }])
        )
      : null

    // Reconcile-or-insert. If the candidate arrived via an employer-sent
    // invite link, the row already exists (created by inviteCandidate()).
    // We update that row in place — same id, same tracking_code — so the
    // pre-seeded record isn't orphaned. Cross-tenant tampering is blocked
    // by also matching on client.id (the slug → client lookup above).
    let candidate: { id: string; tracking_code: string } | null = null
    let trackingCode: string = ''

    const consentSignedAt = signatureData ? new Date().toISOString() : null
    const resolvedConsentMethod = signatureData
      ? signatureMethod === 'typed'
        ? 'typed'
        : 'canvas'
      : null
    const consentColumns = {
      consent_status: signatureData ? 'signed' : 'pending',
      consent_signed_at: consentSignedAt,
      consent_ip: signatureData ? consentIp : null,
      consent_user_agent: signatureData ? consentUserAgent : null,
      consent_method: resolvedConsentMethod,
      consent_signature_data_url: signatureData || null,
      consent_disclosure_version: signatureData ? FCRA_DISCLOSURE_VERSION : null,
    }

    if (inviteCode) {
      const { data: existing } = await supabase
        .from('candidates')
        .select('id, tracking_code, payment_status')
        .eq('tracking_code', inviteCode)
        .eq('client_id', client.id)
        .maybeSingle()

      if (existing && existing.payment_status !== 'paid') {
        // Pull current screening_components so we don't overwrite a custom
        // selection the employer set when generating the invite link.
        const { data: existingFull } = await supabase
          .from('candidates')
          .select('screening_components, drug_panel')
          .eq('id', existing.id)
          .single()

        const shouldSetComponents =
          screeningComponentsFromPackage &&
          (!existingFull?.screening_components ||
            Object.keys(existingFull.screening_components).length === 0)
        const shouldSetDrugPanel = packageDrugPanel && !existingFull?.drug_panel

        const { data: updated, error: updErr } = await supabase
          .from('candidates')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            maiden_name: maidenName?.trim() || null,
            email: email.trim().toLowerCase(),
            phone: phone || null,
            dob: dob || null,
            ssn_last4: ssn4,
            ssn_full: ssn || null,
            sex: sex || null,
            race: race || null,
            drivers_license_number: driversLicense?.trim() || null,
            drivers_license_state: dlState || null,
            drivers_license_class: dlClass || null,
            drivers_license_expiration: dlExpiration || null,
            address: address ? `${address}, ${city}, ${state} ${zip}` : null,
            package_name: packageName,
            package_price: packagePrice || 0,
            status: 'submitted',
            payment_status: 'pending',
            referral_source: referralSource || null,
            additional_details: additionalDetails || {},
            ...(shouldSetComponents && { screening_components: screeningComponentsFromPackage }),
            ...(shouldSetDrugPanel && { drug_panel: packageDrugPanel }),
            ...consentColumns,
          })
          .eq('id', existing.id)
          .select('id, tracking_code')
          .single()

        if (updErr) {
          console.error('Candidate update (invite reconcile) error:', updErr)
          return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
        }
        candidate = updated
        trackingCode = updated.tracking_code
      }
    }

    if (!candidate) {
      // Fallthrough: no invite code, OR invite not found, OR already paid.
      // Generate a fresh unique tracking code and INSERT a new row.
      trackingCode = generateTrackingCode()
      let attempts = 0
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from('candidates')
          .select('id')
          .eq('tracking_code', trackingCode)
          .single()
        if (!existing) break
        trackingCode = generateTrackingCode()
        attempts++
      }

      const { data: inserted, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          tracking_code: trackingCode,
          client_id: client.id,
          client_slug: client.slug,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          maiden_name: maidenName?.trim() || null,
          email: email.trim().toLowerCase(),
          phone: phone || null,
          dob: dob || null,
          ssn_last4: ssn4,
          ssn_full: ssn || null,
          sex: sex || null,
          race: race || null,
          drivers_license_number: driversLicense?.trim() || null,
          drivers_license_state: dlState || null,
          drivers_license_class: dlClass || null,
          drivers_license_expiration: dlExpiration || null,
          address: address ? `${address}, ${city}, ${state} ${zip}` : null,
          package_name: packageName,
          package_price: packagePrice || 0,
          status: 'submitted',
          payment_status: 'pending',
          source: 'candidate_portal',
          referral_source: referralSource || null,
          additional_details: additionalDetails || {},
          ...(screeningComponentsFromPackage && { screening_components: screeningComponentsFromPackage }),
          ...(packageDrugPanel && { drug_panel: packageDrugPanel }),
          ...consentColumns,
        })
        .select('id, tracking_code')
        .single()

      if (candidateError || !inserted) {
        console.error('Candidate insert error:', candidateError)
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
      }
      candidate = inserted
    }

    // Also insert into submissions table for backwards compatibility
    await supabase.from('submissions').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      dob: dob || null,
      ssn_last4: ssn4 || null,
      address: address ? `${address}, ${city}, ${state} ${zip}` : null,
      package_name: packageName,
      package_price: packagePrice || 0,
      client_name: client.slug,
      consent_status: signatureData ? 'signed' : 'pending',
      payment_status: inviteCode ? 'employer_billed' : 'pending',
      signature_type: resolvedConsentMethod,
      signature_value: signatureData || null,
      confirmation_code: trackingCode,
    })

    const portalUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PORTAL_URL || 'https://www.pcgscreening.net').trim().replace(/\/+$/, '')

    // Generate consent PDF and send confirmation email with link
    if (signatureData && candidate && email) {
      let consentPdfUrl: string | null = null
      try {
        consentPdfUrl = await generateAndStoreConsentPdf(candidate.id)
      } catch (err) {
        console.error('Failed to generate consent PDF:', err)
      }

      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const resend = new Resend(resendKey)
        const fromEmail = process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>'
        try {
          await resend.emails.send({
            from: fromEmail,
            to: email.trim().toLowerCase(),
            subject: 'Background Screening Confirmation',
            html: buildCandidateSubmissionConfirmationEmail({
              candidateName: `${firstName} ${lastName}`.toUpperCase(),
              companyName: client.name,
              trackingCode,
              trackUrl: `${portalUrl}/track?code=${trackingCode}`,
              consentPdfUrl,
            }),
          })
        } catch (emailErr) {
          console.error('Failed to send candidate confirmation email:', emailErr)
        }
      }
    }

    // Employer-paid path: candidate arrived via an invite link, the employer
    // is billed via the client's billing terms (immediate / net_30 / etc).
    // Skip Stripe entirely and route the candidate straight to confirmation.
    if (inviteCode) {
      await supabase
        .from('candidates')
        .update({ payment_status: 'employer_billed' })
        .eq('id', candidate.id)

      return NextResponse.json({
        url: `${portalUrl}/apply/${client.slug}/confirmation?tracking=${trackingCode}&billed=employer`,
      })
    }

    // Otherwise: self-pay. Create a Stripe Checkout Session.
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }
    const stripe = new Stripe(secretKey)
    const priceInCents = Math.round((packagePrice || 0) * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageName,
              description: `PCG Screening Services — ${packageName} for ${client.name}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${portalUrl}/apply/${client.slug}/confirmation?session_id={CHECKOUT_SESSION_ID}&tracking=${trackingCode}`,
      cancel_url: `${portalUrl}/apply/${client.slug}?cancelled=true`,
      metadata: {
        candidateId: candidate.id,
        trackingCode,
        clientSlug: client.slug,
        firstName,
        lastName,
        packageName,
      },
    })

    // Store Stripe session ID on candidate
    await supabase
      .from('candidates')
      .update({ stripe_session_id: session.id })
      .eq('id', candidate.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
