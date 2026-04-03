import { createAdminClient } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import EmptyState from '@/components/portal/EmptyState'
import CandidatesList from './CandidatesList'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const clientUser = await requireAuth()
  const supabase = createAdminClient()
  const clientId = clientUser.client_id
  const params = await searchParams

  const search = params.q || ''
  const statusFilter = params.status || 'all'
  const page = parseInt(params.page || '1', 10)
  const perPage = 25
  const offset = (page - 1) * perPage

  let query = supabase
    .from('candidates')
    .select('id, first_name, last_name, email, package_name, status, payment_status, consent_status, tracking_code, created_at', { count: 'exact' })
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  // User role: only see their own candidates; admin role: see all
  if (clientUser.role === 'user') {
    query = query.eq('submitted_by_user_id', clientUser.id)
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tracking_code.ilike.%${search}%`)
  }

  query = query.range(offset, offset + perPage - 1)

  const { data: candidates, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)

  if ((count ?? 0) === 0 && !search && statusFilter === 'all') {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="No candidates yet"
        description="Once you invite candidates for screening, they'll appear here."
        actionLabel="Invite Candidate"
        actionHref="/portal/invite"
      />
    )
  }

  return (
    <CandidatesList
      candidates={candidates ?? []}
      totalPages={totalPages}
      currentPage={page}
      search={search}
      statusFilter={statusFilter}
    />
  )
}
