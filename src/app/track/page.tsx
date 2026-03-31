'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type TrackingResult = {
  firstName: string
  status: string
  packageName: string
  submittedAt: string
  startedAt: string | null
  completedAt: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  submitted: { label: 'Submitted', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50' },
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackPageInner />
    </Suspense>
  )
}

function TrackPageInner() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() || '')
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setResult(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to look up this tracking code.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Connection error. Please try again.')
    }

    setLoading(false)
  }

  // Auto-search if code came from URL
  useState(() => {
    if (searchParams.get('code')) {
      handleSearch()
    }
  })

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const statusConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.submitted : null

  return (
    <div className="min-h-dvh bg-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG" className="h-8" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl text-navy">Track Your Screening</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your tracking code to check your screening status.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <label className="block text-xs text-gray-500 mb-1.5">Tracking Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PCG-XXXXXXXX"
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent uppercase"
              style={{ fontSize: '16px' }}
              maxLength={12}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-40 shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Your tracking code was sent to your email after payment.</p>
        </form>

        {/* Error */}
        {error && searched && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
                <p className="text-xs text-red-500 mt-1">Double-check your code and try again. If the issue persists, contact us.</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && statusConfig && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Screening for</p>
                  <p className="text-lg font-heading text-navy">{result.firstName}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-gray-50">
                <span className="text-gray-500">Package</span>
                <span className="text-navy font-medium">{result.packageName}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-medium text-navy mb-4">Screening Timeline</h2>
              <div className="space-y-0">
                <TimelineStep
                  title="Submitted"
                  date={formatDate(result.submittedAt)}
                  complete={true}
                  active={result.status === 'submitted'}
                  last={false}
                />
                <TimelineStep
                  title="In Progress"
                  date={formatDate(result.startedAt)}
                  complete={result.status === 'in_progress' || result.status === 'completed'}
                  active={result.status === 'in_progress'}
                  last={false}
                />
                <TimelineStep
                  title="Completed"
                  date={formatDate(result.completedAt)}
                  complete={result.status === 'completed'}
                  active={result.status === 'completed'}
                  last={true}
                />
              </div>
            </div>

            {/* Info */}
            <div className="text-center text-xs text-gray-400 space-y-1">
              <p>Results are delivered directly to your employer.</p>
              <p>Most screenings complete in 1–3 business days.</p>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Need help? Contact PCG at{' '}
            <a href="mailto:accounts@pcgscreening.com" className="text-gold">accounts@pcgscreening.com</a>{' '}
            or <a href="tel:7707161278" className="text-gold">770-716-1278</a>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function TimelineStep({ title, date, complete, active, last }: {
  title: string; date: string | null; complete: boolean; active: boolean; last: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
          complete ? 'bg-gold border-gold' : 'bg-white border-gray-300'
        } ${active ? 'ring-4 ring-gold/20' : ''}`} />
        {!last && (
          <div className={`w-0.5 h-8 ${complete ? 'bg-gold' : 'bg-gray-200'}`} />
        )}
      </div>
      <div className="pb-6">
        <p className={`text-sm font-medium ${complete ? 'text-navy' : 'text-gray-400'}`}>{title}</p>
        {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
      </div>
    </div>
  )
}
