import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifies Authorization: Bearer <PCG_AGENT_API_KEY>.
 * Returns null on success, or a 401 NextResponse to return from the route.
 */
export function requireAgentAuth(req: NextRequest): NextResponse | null {
  const expected = (process.env.PCG_AGENT_API_KEY || '').trim()
  if (!expected) {
    return NextResponse.json(
      { error: 'PCG_AGENT_API_KEY not configured' },
      { status: 500 }
    )
  }

  const header = req.headers.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  const provided = match?.[1]?.trim()

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
