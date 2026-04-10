import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Read-only endpoint used by /apply/[slug] to prefill the intake form when
 * the candidate arrives via an employer-sent invite link of the form
 *   /apply/<slug>?invite=PCG-XXXXXXXX
 *
 * Returns only the fields needed for prefill — never id/dob/ssn/address —
 * so a tampered code can't leak PII.
 *
 * The candidate is anonymous at this point, so we use the admin client.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = (searchParams.get('code') || '').trim()
  const slug = (searchParams.get('slug') || '').trim()

  if (!code || !slug) {
    return NextResponse.json({ error: 'Missing code or slug' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Resolve the client by slug so we can scope the candidate lookup to the
  // right tenant. Prevents an invite code from one client matching a row in
  // another client's data.
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: candidate } = await supabase
    .from('candidates')
    .select('first_name, last_name, email, package_name, payment_status')
    .eq('tracking_code', code)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!candidate || candidate.payment_status === 'paid') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    firstName: candidate.first_name || '',
    lastName: candidate.last_name || '',
    email: candidate.email || '',
    packageName: candidate.package_name || '',
  })
}
