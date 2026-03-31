import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import StatusBadge from '@/components/portal/StatusBadge'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default async function AdminDashboard() {
  await requireAdmin()
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [newTodayRes, inProgressRes, completedWeekRes, slaRes, revenueRes, recentRes, statusHistoryRes] = await Promise.all([
    supabase.from('candidates').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('candidates').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'in_progress']),
    supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('screening_completed_at', weekAgo.toISOString()),
    supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('sla_flagged', true).neq('status', 'completed').neq('status', 'cancelled'),
    supabase.from('candidates').select('package_price').eq('payment_status', 'paid').gte('created_at', monthStart.toISOString()),
    supabase.from('candidates').select('id, first_name, last_name, package_name, status, payment_status, consent_status, created_at, client_slug, sla_flagged').order('created_at', { ascending: false }).limit(10),
    supabase.from('status_history').select('id, candidate_id, new_status, notes, changed_by, created_at, candidate:candidates(first_name, last_name, client_slug)').order('created_at', { ascending: false }).limit(20),
  ])

  const stats = [
    { label: 'New Today', value: newTodayRes.count ?? 0, color: 'text-navy' },
    { label: 'In Progress', value: inProgressRes.count ?? 0, color: 'text-blue-600' },
    { label: 'Completed (Week)', value: completedWeekRes.count ?? 0, color: 'text-green-600' },
    { label: 'SLA Alerts', value: slaRes.count ?? 0, color: (slaRes.count ?? 0) > 0 ? 'text-red-600' : 'text-gray-400' },
    {
      label: 'Revenue (Month)',
      value: `$${((revenueRes.data ?? []).reduce((sum: number, r: any) => sum + Number(r.package_price || 0), 0)).toLocaleString()}`,
      color: 'text-gold',
    },
  ]

  const recent = recentRes.data ?? []
  const activity = statusHistoryRes.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-navy">Dashboard</h1>

      {/* SLA Alert Banner */}
      {(slaRes.count ?? 0) > 0 && (
        <Link
          href="/admin/candidates?sla=true"
          className="block bg-red-50 border border-red-200 rounded-xl px-5 py-3 hover:bg-red-100 transition-colors"
        >
          <p className="text-red-800 text-sm font-medium">
            {slaRes.count} screening{(slaRes.count ?? 0) !== 1 ? 's have' : ' has'} exceeded 48 hours.{' '}
            <span className="underline">View now →</span>
          </p>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-[11px] uppercase tracking-wider">{s.label}</p>
            <p className={`font-heading text-2xl mt-1 ${s.color}`}>
              {typeof s.value === 'number' ? s.value : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-heading text-base text-navy">Recent Candidates</h2>
            <Link href="/admin/candidates" className="text-sm text-gold hover:text-gold-light transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map((c: any) => (
              <Link
                key={c.id}
                href={`/admin/candidates/${c.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.first_name} {c.last_name}</p>
                    {c.sla_flagged && <span className="text-red-500 text-xs">⚑</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.client_slug} · {c.package_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.payment_status} />
                  <span className="text-xs text-gray-400 hidden sm:inline">{timeAgo(c.created_at)}</span>
                </div>
              </Link>
            ))}
            {recent.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">No candidates yet</div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-heading text-base text-navy">Activity</h2>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {activity.map((a: any) => {
              const candidate = a.candidate as any
              return (
                <Link
                  key={a.id}
                  href={`/admin/candidates/${a.candidate_id}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm text-gray-700">
                    {candidate?.first_name} {candidate?.last_name}{' '}
                    <span className="text-gray-400">→</span>{' '}
                    <span className="font-medium capitalize">{a.new_status?.replace('_', ' ')}</span>
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 truncate">{a.notes}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{a.changed_by} · {timeAgo(a.created_at)}</p>
                </Link>
              )
            })}
            {activity.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/clients/new" className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Client
        </Link>
        <Link href="/admin/candidates" className="inline-flex items-center gap-2 bg-white text-navy px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
          View All Candidates
        </Link>
        <Link href="/admin/documents" className="inline-flex items-center gap-2 bg-white text-navy px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
          Upload Document
        </Link>
      </div>
    </div>
  )
}
