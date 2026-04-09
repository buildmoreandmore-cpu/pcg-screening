// TEMPORARY — used to verify end-to-end webhook delivery against the
// production receiver at martinbuilds.ai. Delete after the integration
// test is green.
import { NextRequest, NextResponse } from 'next/server'
import { requireAgentAuth } from '@/lib/agent-auth'
import { dispatchAgentEvent } from '@/lib/agent-webhook'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const unauthorized = requireAgentAuth(req)
  if (unauthorized) return unauthorized

  dispatchAgentEvent(
    'candidate.submitted',
    'E2E integration ping from PCG → martinbuilds.ai',
    {
      source: 'verify_dispatch_prod',
      timestamp: new Date().toISOString(),
      note: 'This is a test event. Gwen should see a Telegram DM.',
    }
  )

  return NextResponse.json({ dispatched: true, target: 'production webhook URL' })
}
