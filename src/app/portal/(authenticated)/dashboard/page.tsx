import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { getClientUser } from '@/lib/auth'
import StatusBadge from '@/components/portal/StatusBadge'
import EmptyState from '@/components/portal/EmptyState'
import AssistantChat from '@/components/portal/AssistantChat'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default async function DashboardPage() {
  const clientUser = await getClientUser()
  if (!clientUser) return null
  const supabase = createAdminClient()
  const clientId = clientUser.client_id

  // Role-based filter: user sees only their own candidates
  const isUser = clientUser.role === 'user'
  const userId = clientUser.id

  // Parallel queries
  let totalQ = supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('client_id', clientId)
  let pendingQ = supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['submitted', 'in_progress'])
  let completedQ = supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'completed')
  let recentQ = supabase.from('candidates').select('id, first_name, last_name, package_name, status, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5)

  if (isUser) {
    totalQ = totalQ.eq('submitted_by_user_id', userId)
    pendingQ = pendingQ.eq('submitted_by_user_id', userId)
    completedQ = completedQ.eq('submitted_by_user_id', userId)
    recentQ = recentQ.eq('submitted_by_user_id', userId)
  }

  const [totalRes, pendingRes, completedRes, recentRes] = await Promise.all([
    totalQ, pendingQ, completedQ, recentQ,
  ])

  const total = totalRes.count ?? 0
  const pending = pendingRes.count ?? 0
  const completed = completedRes.count ?? 0
  const recent = recentRes.data ?? []

  const stats = [
    { label: 'Total Candidates', value: total },
    { label: 'In Progress', value: pending },
    { label: 'Completed', value: completed },
  ]

  if (total === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        }
        title="No screenings yet"
        description="Invite your first candidate to get started."
        actionLabel="Invite Candidate"
        actionHref="/portal/invite"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-wider">{stat.label}</p>
            <p className="font-heading text-xl sm:text-2xl lg:text-3xl text-navy mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-gray-100">
          <h2 className="font-heading text-base text-navy">Recent Candidates</h2>
          <Link href="/portal/candidates" className="text-sm text-gold hover:text-gold-light transition-colors">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.map((c: any) => (
            <Link
              key={c.id}
              href={`/portal/candidates/${c.id}`}
              className="flex items-center justify-between px-4 lg:px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.first_name} {c.last_name}
                </p>
                <p className="text-xs text-gray-500">{c.package_name}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <StatusBadge status={c.status} />
                <span className="text-xs text-gray-400 hidden sm:inline">{timeAgo(c.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-navy to-navy-light rounded-xl p-5 lg:p-6 text-white">
        <h3 className="font-heading text-lg mb-1">Screen a New Candidate</h3>
        <p className="text-white/70 text-sm mb-4">
          Send a screening link to your candidate. They&apos;ll complete everything on their end.
        </p>
        <Link
          href="/portal/invite"
          className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gold-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Candidate
        </Link>
      </div>

      {/* AI Assistant */}
      <AssistantChat />
    </div>
  )
}
