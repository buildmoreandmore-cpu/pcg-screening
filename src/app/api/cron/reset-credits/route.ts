import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Monthly credit reset.
 *
 * Set this as a Vercel Cron at "0 0 1 * *" (midnight on the 1st of each
 * month). Authenticated by CRON_SECRET in the Authorization header.
 *
 * Resets credits_used to 0 and bumps period_start to today for any client
 * on a subscription tier whose period_start is more than 28 days old. The
 * 28-day floor protects against double-running the cron.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const cutoff = new Date(Date.now() - 28 * 86400 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('clients')
    .update({ credits_used: 0, period_start: today })
    .not('subscription_tier', 'is', null)
    .lte('period_start', cutoff)
    .select('id, name, subscription_tier')

  if (error) {
    console.error('[reset-credits]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reset_count: data?.length ?? 0,
    clients: data ?? [],
    period_start: today,
  })
}
