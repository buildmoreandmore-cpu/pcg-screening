import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase-server'
import AdminCandidatesList from './AdminCandidatesList'

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; client?: string; payment?: string; sla?: string; page?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  const search = params.q || ''
  const statusFilter = params.status || 'all'
  const clientFilter = params.client || 'all'
  const paymentFilter = params.payment || 'all'
  const slaOnly = params.sla === 'true'
  const page = parseInt(params.page || '1', 10)
  const perPage = 25
  const offset = (page - 1) * perPage

  // Get client list for filter dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, slug')
    .eq('active', true)
    .order('name')

  // Build candidates query
  let query = supabase
    .from('candidates')
    .select('id, first_name, last_name, email, package_name, status, payment_status, consent_status, tracking_code, sla_flagged, created_at, client_slug, client:clients(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (clientFilter !== 'all') query = query.eq('client_id', clientFilter)
  if (paymentFilter !== 'all') query = query.eq('payment_status', paymentFilter)
  if (slaOnly) query = query.eq('sla_flagged', true)
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tracking_code.ilike.%${search}%`)
  }

  query = query.range(offset, offset + perPage - 1)

  const { data: candidates, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <AdminCandidatesList
      candidates={candidates ?? []}
      clients={clients ?? []}
      totalPages={totalPages}
      currentPage={page}
      totalCount={count ?? 0}
      filters={{ search, status: statusFilter, client: clientFilter, payment: paymentFilter, sla: slaOnly }}
    />
  )
}
