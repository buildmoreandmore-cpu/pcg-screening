import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import StatusBadge from '@/components/portal/StatusBadge'
import ClientDetail from './ClientDetail'

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const supabase = createAdminClient()

  const [clientRes, candidatesRes, usersRes, packagesRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('candidates').select('id, first_name, last_name, email, package_name, status, payment_status, tracking_code, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('client_users').select('id, name, email, role, active, created_at').eq('client_id', id).order('created_at'),
    supabase.from('client_packages').select('id, name, price_cents, description, components, custom_notes, sort_order, active').eq('client_id', id).eq('active', true).order('sort_order'),
  ])

  if (!clientRes.data) notFound()

  const client = clientRes.data
  const candidates = candidatesRes.data ?? []
  const users = usersRes.data ?? []
  const packages = packagesRes.data ?? []

  const stats = {
    total: candidates.length,
    active: candidates.filter((c: any) => c.status !== 'completed' && c.status !== 'cancelled').length,
    completed: candidates.filter((c: any) => c.status === 'completed').length,
    revenue: candidates.filter((c: any) => c.payment_status === 'paid').reduce((sum: number, c: any) => sum + Number(c.package_price || 0), 0),
  }

  return (
    <ClientDetail
      client={client}
      candidates={candidates}
      users={users}
      stats={stats}
      packages={packages}
    />
  )
}
