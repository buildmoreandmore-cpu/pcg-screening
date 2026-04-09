import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const candidateId = session.metadata?.candidateId
    const trackingCode = session.metadata?.trackingCode

    if (candidateId) {
      // Update candidate payment status
      await supabase
        .from('candidates')
        .update({
          payment_status: 'paid',
          status: 'in_progress',
          screening_started_at: new Date().toISOString(),
        })
        .eq('id', candidateId)

      // Insert status history
      await supabase.from('status_history').insert({
        candidate_id: candidateId,
        previous_status: 'submitted',
        new_status: 'in_progress',
        updated_by: 'system',
        notes: 'Payment completed via Stripe',
      })

      const candidateName = `${session.metadata?.firstName ?? ''} ${session.metadata?.lastName ?? ''}`.trim() || 'Candidate'
      const amount = (session.amount_total ?? 0) / 100

      dispatchAgentEvent(
        'payment.received',
        `Payment received: $${amount.toFixed(2)} for ${candidateName}`,
        {
          candidate_id: candidateId,
          candidate_name: candidateName,
          tracking_code: trackingCode,
          amount,
          currency: session.currency,
          stripe_session_id: session.id,
          package_name: session.metadata?.packageName,
          client_slug: session.metadata?.clientSlug,
        }
      )

      dispatchAgentEvent(
        'candidate.status_changed',
        `${candidateName}: submitted → in_progress (Stripe payment)`,
        {
          candidate_id: candidateId,
          candidate_name: candidateName,
          tracking_code: trackingCode,
          previous_status: 'submitted',
          new_status: 'in_progress',
          trigger: 'stripe_payment',
        }
      )

      // Update submissions table too
      if (session.customer_email) {
        await supabase
          .from('submissions')
          .update({ payment_status: 'paid' })
          .eq('email', session.customer_email)
          .eq('payment_status', 'pending')
      }

      // Send confirmation email to candidate
      if (process.env.RESEND_API_KEY && session.customer_email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const firstName = session.metadata?.firstName || 'Candidate'
          const packageName = session.metadata?.packageName || 'Background Check'

          await resend.emails.send({
            from: 'PCG Screening Services <accounts@pcgscreening.com>',
            to: session.customer_email,
            subject: 'Payment Confirmed — Your Screening Has Begun',
            html: buildConfirmationEmail(firstName, trackingCode || '', packageName),
          })
        } catch (emailErr) {
          console.error('Confirmation email error:', emailErr)
        }
      }

      // Notify PCG admin
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: 'PCG Screening Services <accounts@pcgscreening.com>',
            to: 'accounts@pcgscreening.com',
            subject: `New Paid Screening: ${session.metadata?.firstName} ${session.metadata?.lastName}`,
            html: `<p>New paid screening submitted.</p>
<p><strong>Name:</strong> ${session.metadata?.firstName} ${session.metadata?.lastName}</p>
<p><strong>Package:</strong> ${session.metadata?.packageName}</p>
<p><strong>Tracking:</strong> ${trackingCode}</p>
<p><strong>Client:</strong> ${session.metadata?.clientSlug}</p>
<p><a href="https://pcg-screening.vercel.app/admin/candidates/${candidateId}">View in Admin</a></p>`,
          })
        } catch (emailErr) {
          console.error('Admin notification error:', emailErr)
        }
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const candidateId = session.metadata?.candidateId

    if (candidateId) {
      await supabase
        .from('candidates')
        .update({ payment_status: 'expired' })
        .eq('id', candidateId)

      dispatchAgentEvent(
        'payment.failed',
        `Stripe checkout expired for candidate ${candidateId}`,
        {
          candidate_id: candidateId,
          stripe_session_id: session.id,
          reason: 'checkout_session_expired',
        }
      )
    }
  }

  return NextResponse.json({ received: true })
}

function buildConfirmationEmail(firstName: string, trackingCode: string, packageName: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #f8f7f4; font-family: 'Georgia', serif; }
  .container { max-width: 520px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 32px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header img { height: 48px; }
  .divider { height: 2px; background: linear-gradient(to right, #c9a44c, #e5c97a); margin: 20px 0; border: none; }
  h1 { color: #1f2f4a; font-size: 20px; margin: 0 0 12px; }
  p { color: #4a4743; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
  .tracking { background: #f0efec; border-radius: 8px; padding: 12px 16px; text-align: center; margin: 16px 0; }
  .tracking-code { color: #1f2f4a; font-size: 18px; font-weight: bold; font-family: monospace; }
  .btn { display: inline-block; background: #1f2f4a; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 16px 0; }
  .footer { text-align: center; color: #8a8680; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="https://pcgscreening.com/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG Screening Services">
      </div>
      <hr class="divider">
      <h1>Payment Confirmed</h1>
      <p>Hi ${firstName},</p>
      <p>Your payment for the <strong>${packageName}</strong> has been received. Your background screening is now in progress.</p>
      <div class="tracking">
        <p style="margin:0;font-size:12px;color:#8a8680;">Your Tracking Code</p>
        <p class="tracking-code" style="margin:4px 0 0;">${trackingCode}</p>
      </div>
      <p>You can check your screening status at any time:</p>
      <p style="text-align:center;">
        <a href="https://pcg-screening.vercel.app/track?code=${trackingCode}" class="btn">Track My Screening</a>
      </p>
      <p style="font-size:13px;color:#8a8680;">Most screenings complete within 1–3 business days. We'll email you when your results are ready.</p>
    </div>
    <div class="footer">
      <p>PCG Screening Services<br>770-716-1278 · accounts@pcgscreening.com</p>
    </div>
  </div>
</body>
</html>`
}
