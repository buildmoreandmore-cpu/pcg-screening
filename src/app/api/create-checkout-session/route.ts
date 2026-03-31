import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

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
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const body = await req.json()
    const {
      clientSlug, firstName, lastName, email, phone,
      dob, ssn4, address, city, state, zip,
      packageName, packagePrice, signatureData,
    } = body

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

    // Create candidate record
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        tracking_code: trackingCode,
        client_id: client.id,
        client_slug: client.slug,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        dob: dob || null,
        ssn_last4: ssn4 || null,
        address: address ? `${address}, ${city}, ${state} ${zip}` : null,
        package_name: packageName,
        package_price: packagePrice || 0,
        status: 'submitted',
        consent_status: signatureData ? 'signed' : 'pending',
        payment_status: 'pending',
        source: 'candidate_portal',
      })
      .select('id, tracking_code')
      .single()

    if (candidateError) {
      console.error('Candidate insert error:', candidateError)
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    // Also insert into submissions table for backwards compatibility
    await supabase.from('submissions').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      date_of_birth: dob || null,
      ssn_last4: ssn4 || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      package: packageName,
      client_name: client.slug,
      consent_status: signatureData ? 'signed' : 'pending',
      payment_status: 'pending',
      signature_data: signatureData || null,
    })

    // Create Stripe Checkout Session
    const stripe = new Stripe(secretKey)
    const portalUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PORTAL_URL || 'https://pcg-screening.vercel.app'

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
