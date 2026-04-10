import { createAdminClient } from './supabase-admin'
import { Resend } from 'resend'

// Default preferences — required events default true, optional default false
const DEFAULTS: Record<string, Record<string, boolean>> = {
  pcg_admin: {
    new_order: true,
    no_response_48h: true,
    payment_received: true,
    consent_signed: true,
    drug_test_received: true,
    report_completed: true,
  },
  client: {
    order_received: true,
    status_updates: false,
    consent_signed: false,
    drug_test_received: false,
    report_completed: true,
  },
  candidate: {
    intake_link: true,
    payment_confirmation: true,
    consent_request: true,
    order_received: true,
    status_updates: false,
    consent_signed: false,
    drug_test_received: false,
  },
}

export function shouldNotify(
  preferences: any,
  audience: 'pcg_admin' | 'client' | 'candidate',
  event: string
): boolean {
  if (!preferences || !preferences[audience]) {
    // No preferences set — use defaults
    return DEFAULTS[audience]?.[event] ?? false
  }

  const audiencePrefs = preferences[audience]
  if (typeof audiencePrefs[event] === 'boolean') {
    return audiencePrefs[event]
  }

  // Event not in preferences — use default
  return DEFAULTS[audience]?.[event] ?? false
}

export async function sendNotification({
  clientId,
  audience,
  event,
  to,
  subject,
  html,
}: {
  clientId: string
  audience: 'pcg_admin' | 'client' | 'candidate'
  event: string
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  try {
    // Load client notification preferences
    const supabase = createAdminClient()
    const { data: client } = await supabase
      .from('clients')
      .select('notification_preferences')
      .eq('id', clientId)
      .single()

    if (!shouldNotify(client?.notification_preferences, audience, event)) {
      return false // Notification disabled for this event
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'PCG Screening <accounts@pcgscreening.com>'

    const result = await resend.emails.send({ from: fromEmail, to, subject, html })
    if (result.error) {
      console.error('[sendNotification] Resend error', { audience, event, to, error: result.error })
      return false
    }
    return true
  } catch (err) {
    console.error('[sendNotification] threw', { audience, event, to, err })
    return false
  }
}
