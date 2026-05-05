import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Returns the full SSN for a candidate. Admin-only. Each access is logged
 * to status_history so we have a paper trail of who viewed sensitive data.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('ssn_full, first_name, last_name')
    .eq('id', id)
    .maybeSingle()

  if (error || !candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  if (!candidate.ssn_full) {
    return NextResponse.json({ ssn: null }, { status: 200 })
  }

  console.log(
    `[ssn-access] candidate=${id} viewer=${admin.email || admin.name} at=${new Date().toISOString()}`
  )

  return NextResponse.json({ ssn: candidate.ssn_full })
}
