'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
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
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

type Filters = {
  search: string
  status: string
  client: string
  payment: string
  sla: boolean
}

export default function AdminCandidatesList({
  candidates,
  clients,
  totalPages,
  currentPage,
  totalCount,
  filters,
}: {
  candidates: any[]
  clients: { id: string; name: string; slug: string }[]
  totalPages: number
  currentPage: number
  totalCount: number
  filters: Filters
}) {
  const router = useRouter()
  const [query, setQuery] = useState(filters.search)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function buildUrl(updates: Record<string, string | boolean>) {
    const params = new URLSearchParams()
    const merged = { ...filters, ...updates }
    if (merged.search) params.set('q', String(merged.search))
    if (merged.status !== 'all') params.set('status', String(merged.status))
    if (merged.client !== 'all') params.set('client', String(merged.client))
    if (merged.payment !== 'all') params.set('payment', String(merged.payment))
    if (merged.sla) params.set('sla', 'true')
    return `/admin/candidates?${params.toString()}`
  }

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    const timeout = setTimeout(() => router.push(buildUrl({ search: value })), 400)
    return () => clearTimeout(timeout)
  }, [router, filters])

  function toggleSelect(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === candidates.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(candidates.map(c => c.id)))
    }
  }

  async function exportCsv() {
    const headers = ['Name', 'Email', 'Client', 'Package', 'Status', 'Payment', 'Consent', 'Tracking', 'Submitted']
    const rows = candidates.map((c: any) => [
      `${c.first_name} ${c.last_name}`,
      c.email,
      c.client?.name || c.client_slug,
      c.package_name,
      c.status,
      c.payment_status,
      c.consent_status,
      c.tracking_code,
      new Date(c.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pcg-candidates-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">Candidates</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{totalCount} total</span>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search name, email, or tracking code..."
          className="flex-1 min-w-[200px] px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
        <select
          value={filters.client}
          onChange={(e) => router.push(buildUrl({ client: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => router.push(buildUrl({ status: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filters.payment}
          onChange={(e) => router.push(buildUrl({ payment: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Payment</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          onClick={() => router.push(buildUrl({ sla: !filters.sla }))}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            filters.sla ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          ⚑ SLA Alerts
        </button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {candidates.map((c: any) => (
          <Link
            key={c.id}
            href={`/admin/candidates/${c.id}`}
            className="block bg-white rounded-xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.first_name} {c.last_name}</p>
                  {c.sla_flagged && <span className="text-red-500 text-xs shrink-0">⚑</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{c.email}</p>
                <p className="text-xs text-gray-400 mt-1 truncate">{c.client?.name || c.client_slug} · {c.package_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge status={c.status} />
                <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-[11px]">
              <StatusBadge status={c.payment_status} />
              <StatusBadge status={c.consent_status} />
              <span className="ml-auto text-gray-400 font-mono">{c.tracking_code}</span>
            </div>
          </Link>
        ))}
        {candidates.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm text-center py-12 text-sm text-gray-400">No candidates found</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={selected.size === candidates.length && candidates.length > 0} onChange={toggleAll} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Consent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {candidates.map((c: any) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/candidates/${c.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                      {c.sla_flagged && <span className="text-red-500 text-xs">⚑</span>}
                    </div>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.client?.name || c.client_slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.package_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.payment_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.consent_status} /></td>
                  <td className="px-4 py-3">
                    {c.report_sent_at ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700">Sent</span>
                    ) : c.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700">Pending</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(c.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{c.tracking_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No candidates found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link href={buildUrl({ search: filters.search }) + `&page=${currentPage - 1}`} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">← Prev</Link>
          )}
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={buildUrl({ search: filters.search }) + `&page=${currentPage + 1}`} className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
