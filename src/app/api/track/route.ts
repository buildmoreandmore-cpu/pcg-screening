import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 }) // 1 minute window
    return true
  }

  if (entry.count >= 10) return false // 10 requests per minute
  entry.count++
  return true
}

export async function GET(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 })
  }

  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()

  if (!code || !/^PCG-[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid tracking code format' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }

  const { data: candidate } = await supabase
    .from('candidates')
    .select('first_name, status, package_name, created_at, screening_started_at, screening_completed_at')
    .eq('tracking_code', code)
    .single()

  if (!candidate) {
    return NextResponse.json({ error: 'No screening found for this tracking code' }, { status: 404 })
  }

  // Privacy-safe response — first name only, no PII
  return NextResponse.json({
    firstName: candidate.first_name,
    status: candidate.status,
    packageName: candidate.package_name,
    submittedAt: candidate.created_at,
    startedAt: candidate.screening_started_at,
    completedAt: candidate.screening_completed_at,
  })
}
