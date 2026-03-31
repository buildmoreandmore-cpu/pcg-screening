'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

type Candidate = {
  id: string
  first_name: string
  last_name: string
  email: string
  package_name: string
  status: string
  payment_status: string
  consent_status: string
  tracking_code: string
  created_at: string
}

export default function CandidatesList({
  candidates,
  totalPages,
  currentPage,
  search,
  statusFilter,
}: {
  candidates: Candidate[]
  totalPages: number
  currentPage: number
  search: string
  statusFilter: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(search)
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val && val !== 'all' && val !== '') params.set(key, val)
        else params.delete(key)
      })
      params.delete('page') // Reset page on filter change
      router.push(`/portal/candidates?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      const timeout = setTimeout(() => updateParams({ q: value }), 400)
      return () => clearTimeout(timeout)
    },
    [updateParams]
  )

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl text-navy">Candidates</h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, or tracking code..."
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/portal/candidates/${c.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.package_name}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={c.payment_status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(c.created_at)}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{c.tracking_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">
        {candidates.map((c) => (
          <Link
            key={c.id}
            href={`/portal/candidates/${c.id}`}
            className="block bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-gray-500">{c.package_name}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{timeAgo(c.created_at)}</span>
              <span className="font-mono">{c.tracking_code}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* No results for search */}
      {candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No candidates match your search.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/portal/candidates?${new URLSearchParams({
                ...(search ? { q: search } : {}),
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(p > 1 ? { page: String(p) } : {}),
              }).toString()}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === currentPage
                  ? 'bg-navy text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
