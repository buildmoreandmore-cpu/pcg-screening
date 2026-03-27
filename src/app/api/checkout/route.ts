import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PACKAGES: Record<string, { name: string; price: number }> = {
  'Basic Background Check': { name: 'Basic Background Check', price: 2900 },
  'Standard Background Check': { name: 'Standard Background Check', price: 4900 },
  'Premium Background Check': { name: 'Premium Background Check', price: 7900 },
  '9-Panel Drug Test': { name: '9-Panel Drug Test', price: 4500 },
};

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const body = await req.json();
    const { packageName, email, firstName, lastName } = body;

    const pkg = PACKAGES[packageName];
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const portalUrl = process.env.PORTAL_URL || 'https://pcg-screening.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: `PCG Screening Services — ${pkg.name}`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${portalUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${portalUrl}/?cancelled=true`,
      metadata: {
        firstName,
        lastName,
        packageName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
