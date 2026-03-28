import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory rate limiter: IP → array of request timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const code = new URL(req.url).searchParams.get('code')?.trim().toUpperCase();
    if (!code || !/^PCG-[A-Z0-9]{6}$/.test(code)) {
      return NextResponse.json({ found: false });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ found: false });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('first_name, last_name, package_name, status, created_at, last_status_update, screening_started_at, screening_completed_at, sla_flagged')
      .eq('confirmation_code', code)
      .single();

    if (error || !data) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      name: `${data.first_name} ${data.last_name?.[0] || ''}.`,
      package: data.package_name,
      status: data.status || 'pending',
      submitted: data.created_at,
      lastUpdated: data.last_status_update || data.created_at,
      screeningStarted: data.screening_started_at || null,
      screeningCompleted: data.screening_completed_at || null,
      slaFlagged: data.sla_flagged || false,
    });
  } catch (error) {
    console.error('Track lookup error:', error);
    return NextResponse.json({ found: false });
  }
}
