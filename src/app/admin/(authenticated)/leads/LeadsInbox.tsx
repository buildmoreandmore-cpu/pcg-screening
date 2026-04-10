'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeadStatus } from '@/app/admin/actions/leads'

type Lead = {
  id: string
  name: string
  company: string | null
  email: string
  phone: string | null
  type: string
  message: string | null
  status: 'new' | 'contacted' | 'closed'
  source: string | null
  created_at: string
  contacted_at: string | null
  closed_at: string | null
  notes: string | null
}

const TYPE_LABEL: Record<string, string> = {
  screen: 'Run first screen',
  package: 'Custom package',
  call: 'Schedule a call',
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-gold/15 text-gold-dark border border-gold/30',
  contacted: 'bg-blue-50 text-blue-700 border border-blue-100',
  closed: 'bg-gray-100 text-gray-500 border border-gray-200',
}

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

export default function LeadsInbox({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('new')
  const [pending, startTransition] = useTransition()
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = initialLeads.filter((l) => filter === 'all' || l.status === filter)

  const counts = {
    new: initialLeads.filter((l) => l.status === 'new').length,
    contacted: initialLeads.filter((l) => l.status === 'contacted').length,
    closed: initialLeads.filter((l) => l.status === 'closed').length,
    all: initialLeads.length,
  }

  function setStatus(leadId: string, status: 'new' | 'contacted' | 'closed') {
    startTransition(async () => {
      await updateLeadStatus({ leadId, status })
      router.refresh()
    })
  }

  const tabs = [
    { key: 'new', label: `New (${counts.new})` },
    { key: 'contacted', label: `Contacted (${counts.contacted})` },
    { key: 'closed', label: `Closed (${counts.closed})` },
    { key: 'all', label: `All (${counts.all})` },
  ] as const

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leads list */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
        {filtered.map((lead) => {
          const open = openId === lead.id
          return (
            <div key={lead.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : lead.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      {lead.company && (
                        <span className="text-xs text-gray-500">· {lead.company}</span>
                      )}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          STATUS_STYLES[lead.status] || ''
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {TYPE_LABEL[lead.type] || lead.type} · {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(lead.created_at)}</span>
                </div>
              </button>

              {open && (
                <div className="px-5 pb-4 pt-1 bg-gray-50/40 border-t border-gray-50">
                  {lead.message && (
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                        Message
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1.5 bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-light transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1.5 bg-white text-navy border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                        </svg>
                        Call
                      </a>
                    )}
                    <div className="flex-1" />
                    {lead.status !== 'contacted' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setStatus(lead.id, 'contacted')}
                        className="text-xs text-blue-700 hover:underline px-2 py-1"
                      >
                        Mark contacted
                      </button>
                    )}
                    {lead.status !== 'closed' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setStatus(lead.id, 'closed')}
                        className="text-xs text-gray-500 hover:underline px-2 py-1"
                      >
                        Close
                      </button>
                    )}
                    {lead.status !== 'new' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setStatus(lead.id, 'new')}
                        className="text-xs text-gray-500 hover:underline px-2 py-1"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">No leads in this view.</div>
        )}
      </div>
    </div>
  )
}
