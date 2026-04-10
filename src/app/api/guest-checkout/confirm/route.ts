import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  buildGuestOrderConsentEmail,
  buildGuestOrderBuyerConfirmationEmail,
} from '@/lib/email-templates'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ paid: false, error: 'Stripe not configured' }, { status: 200 })
    }

    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ paid: false })
    }

    const meta = session.metadata || {}
    if (meta.orderType !== 'guest') {
      return NextResponse.json({ paid: false, error: 'Not a guest order' })
    }

    const supabase = createAdminClient()
    const trackingCode = meta.trackingCode

    // Update candidate payment status (idempotent — only updates if not already paid)
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id, payment_status')
      .eq('tracking_code', trackingCode)
      .single()

    if (candidate && candidate.payment_status !== 'paid') {
      await supabase
        .from('candidates')
        .update({ payment_status: 'paid', status: 'submitted' })
        .eq('id', candidate.id)

      // Send emails (best-effort — don't fail the response if emails fail)
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const resend = new Resend(resendKey)
        const fromEmail = process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>'
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net').trim().replace(/\/+$/, '')

        // 1. Send consent form email to candidate
        const consentUrl = `${siteUrl}/apply/guest-orders?invite=${trackingCode}`
        try {
          await resend.emails.send({
            from: fromEmail,
            to: meta.candidateEmail,
            subject: `Action Required: Complete Your Background Screening Authorization`,
            html: buildGuestOrderConsentEmail({
              candidateName: `${meta.candidateFirst} ${meta.candidateLast}`,
              companyName: meta.companyName,
              packageName: meta.packageName,
              applyUrl: consentUrl,
            }),
          })
        } catch (emailErr) {
          console.error('Failed to send consent email to candidate:', emailErr)
        }

        // 2. Send confirmation email to buyer
        try {
          await resend.emails.send({
            from: fromEmail,
            to: meta.buyerEmail,
            subject: `Order Confirmed — ${meta.packageName} for ${meta.candidateFirst} ${meta.candidateLast}`,
            html: buildGuestOrderBuyerConfirmationEmail({
              buyerName: meta.buyerName,
              companyName: meta.companyName,
              candidateName: `${meta.candidateFirst} ${meta.candidateLast}`,
              packageName: meta.packageName,
              trackingCode,
            }),
          })
        } catch (emailErr) {
          console.error('Failed to send confirmation email to buyer:', emailErr)
        }

        // 3. Notify PCG admin
        try {
          const adminEmail = process.env.PCG_ADMIN_EMAIL || 'accounts@pcgscreening.com'
          await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `New Guest Order: ${meta.packageName} — ${meta.companyName}`,
            html: `<p>New guest screening order received.</p>
              <p><strong>Company:</strong> ${meta.companyName}<br>
              <strong>Buyer:</strong> ${meta.buyerName} (${meta.buyerEmail})<br>
              <strong>Candidate:</strong> ${meta.candidateFirst} ${meta.candidateLast} (${meta.candidateEmail})<br>
              <strong>Package:</strong> ${meta.packageName}<br>
              <strong>Tracking:</strong> ${trackingCode}</p>`,
          })
        } catch (emailErr) {
          console.error('Failed to send admin notification:', emailErr)
        }
      }
    }

    return NextResponse.json({
      paid: true,
      trackingCode,
      packageName: meta.packageName,
      candidateName: `${meta.candidateFirst} ${meta.candidateLast}`,
      buyerName: meta.buyerName,
      companyName: meta.companyName,
    })
  } catch (error) {
    console.error('Guest checkout confirm error:', error)
    return NextResponse.json({ paid: false, error: 'Verification failed' }, { status: 500 })
  }
}
