import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildCandidateInviteEmail } from '@/lib/email-templates'
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
      packageSlug,
      packageName,
      priceCents,
      companyName,
      buyerName,
      buyerEmail,
      buyerPhone,
      candidateFirst,
      candidateLast,
      candidateEmail,
    } = body

    // Validate required fields
    if (!packageSlug || !packageName || !priceCents || !companyName || !buyerName || !buyerEmail || !candidateFirst || !candidateLast || !candidateEmail) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ error: 'Invalid buyer email.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      return NextResponse.json({ error: 'Invalid candidate email.' }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Payment processing is not configured yet. Please contact us at accounts@pcgscreening.com.' }, { status: 500 })
    }

    const supabase = createAdminClient()

    // Look up or create a guest client record for this company.
    // Guest orders are grouped under a single "Guest Orders" client so
    // the admin dashboard can filter them. Each order stores the actual
    // company name in the candidate metadata.
    let { data: guestClient } = await supabase
      .from('clients')
      .select('id, slug, name')
      .eq('slug', 'guest-orders')
      .single()

    if (!guestClient) {
      const { data: created, error: clientErr } = await supabase
        .from('clients')
        .insert({
          name: 'Guest Orders',
          slug: 'guest-orders',
          active: true,
          billing_type: 'per_candidate',
        })
        .select('id, slug, name')
        .single()

      if (clientErr || !created) {
        console.error('Failed to create guest-orders client:', clientErr)
        return NextResponse.json({ error: 'System error. Please try again.' }, { status: 500 })
      }
      guestClient = created
    }

    // Generate unique tracking code
    let trackingCode = generateTrackingCode()
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

    // Create candidate row
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        tracking_code: trackingCode,
        client_id: guestClient.id,
        client_slug: guestClient.slug,
        first_name: candidateFirst.trim(),
        last_name: candidateLast.trim(),
        email: candidateEmail.trim().toLowerCase(),
        package_name: packageName,
        package_price: priceCents / 100,
        status: 'submitted',
        payment_status: 'pending',
        source: 'guest_order',
        referral_source: `Guest order by ${companyName} (${buyerName}, ${buyerEmail}${buyerPhone ? ', ' + buyerPhone : ''})`,
      })
      .select('id, tracking_code')
      .single()

    if (candidateError || !candidate) {
      console.error('Guest candidate insert error:', candidateError)
      return NextResponse.json({ error: 'Failed to create screening order.' }, { status: 500 })
    }

    const portalUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pcgscreening.net').trim().replace(/\/+$/, '')

    // Create Stripe Checkout Session — buyer pays, not candidate
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: buyerEmail.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageName,
              description: `PCG Screening — ${packageName} for ${candidateFirst} ${candidateLast}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${portalUrl}/order/confirmation?session_id={CHECKOUT_SESSION_ID}&tracking=${trackingCode}`,
      cancel_url: `${portalUrl}/order/${packageSlug}?cancelled=true`,
      metadata: {
        candidateId: candidate.id,
        trackingCode,
        packageSlug,
        packageName,
        buyerName,
        buyerEmail,
        companyName,
        candidateFirst,
        candidateLast,
        candidateEmail: candidateEmail.trim().toLowerCase(),
        orderType: 'guest',
      },
    })

    // Store Stripe session ID
    await supabase
      .from('candidates')
      .update({ stripe_session_id: session.id })
      .eq('id', candidate.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Guest checkout error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
