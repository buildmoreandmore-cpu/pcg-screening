import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      paid: session.payment_status === 'paid',
      email: session.customer_email,
      trackingCode: session.metadata?.trackingCode || null,
      firstName: session.metadata?.firstName || null,
      packageName: session.metadata?.packageName || null,
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 })
  }
}
