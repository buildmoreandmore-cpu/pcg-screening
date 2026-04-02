'use client'

import { Suspense, useEffect, useState } from 'react'
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  submitted: {
    label: 'Submitted',
    color: 'text-navy',
    bg: 'bg-navy/10',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (searchParams.get('code')) handleSearch()
  }, [])

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const statusConfig = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.submitted : null

  return (
    <div className="min-h-dvh bg-[#f8f7f4]">
      {/* Gold Header */}
      <header className="bg-[#c9a44c] sticky top-0 z-50" style={{ boxShadow: '0 2px 20px rgba(201,164,76,0.3)' }}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG" className="h-9" />
            <div>
              <p className="text-white text-sm font-semibold leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                PCG Screening
              </p>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-medium">Track Status</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-white/80 bg-white/15 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
            </svg>
            Secure
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#c9a44c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#1f2f4a]" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Track Your Screening
          </h1>
          <p className="text-sm text-[#8a8680] mt-1.5">
            Enter the tracking code from your confirmation email.
          </p>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 16px rgba(31,47,74,0.08), 0 2px 4px rgba(31,47,74,0.04)' }}>
          <label className="block text-[11px] uppercase tracking-wider text-[#8a8680] font-medium mb-2">Tracking Code</label>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PCG-XXXXXXXX"
              className="flex-1 px-4 py-3 rounded-xl border border-[#e2e0db] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#c9a44c] focus:border-transparent uppercase bg-[#fafaf9]"
              style={{ fontSize: '16px' }}
              maxLength={12}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="bg-[#1f2f4a] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#2a3f5f] transition-all disabled:opacity-40 shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(31,47,74,0.2)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && searched && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-800 font-medium">{error}</p>
                <p className="text-xs text-red-500 mt-1">Double-check your code and try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && statusConfig && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            {/* Status Hero Card */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(31,47,74,0.08), 0 2px 4px rgba(31,47,74,0.04)' }}>
              {/* Status Banner */}
              <div className={`px-6 py-4 flex items-center gap-3 ${
                result.status === 'completed' ? 'bg-green-50' :
                result.status === 'in_progress' ? 'bg-blue-50' :
                result.status === 'cancelled' ? 'bg-red-50' :
                'bg-[#f8f7f4]'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  result.status === 'completed' ? 'bg-green-100' :
                  result.status === 'in_progress' ? 'bg-blue-100' :
                  result.status === 'cancelled' ? 'bg-red-100' :
                  'bg-[#e2e0db]'
                }`}>
                  <svg className={`w-5 h-5 ${statusConfig.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
                  <p className="text-xs text-[#8a8680]">
                    {result.status === 'completed' ? 'Results delivered to your employer.' :
                     result.status === 'in_progress' ? 'Usually completes within 1-3 business days.' :
                     result.status === 'cancelled' ? 'This screening has been cancelled.' :
                     'Your information has been received.'}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#8a8680] uppercase tracking-wider font-medium">Candidate</span>
                  <span className="text-sm font-semibold text-[#1f2f4a]">{result.firstName}</span>
                </div>
                <div className="h-px bg-[#f0efec]" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#8a8680] uppercase tracking-wider font-medium">Package</span>
                  <span className="text-sm font-medium text-[#4a4743]">{result.packageName}</span>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 16px rgba(31,47,74,0.08), 0 2px 4px rgba(31,47,74,0.04)' }}>
              <h2 className="text-xs text-[#8a8680] uppercase tracking-wider font-medium mb-5">Screening Timeline</h2>
              <div className="space-y-0">
                <TimelineStep
                  title="Submitted"
                  subtitle="Application received"
                  date={formatDate(result.submittedAt)}
                  complete={true}
                  active={result.status === 'submitted'}
                  last={false}
                />
                <TimelineStep
                  title="In Progress"
                  subtitle="Screening underway"
                  date={formatDate(result.startedAt)}
                  complete={result.status === 'in_progress' || result.status === 'completed'}
                  active={result.status === 'in_progress'}
                  last={false}
                />
                <TimelineStep
                  title="Completed"
                  subtitle="Report delivered to employer"
                  date={formatDate(result.completedAt)}
                  complete={result.status === 'completed'}
                  active={result.status === 'completed'}
                  last={true}
                />
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-[#f5ecd4] rounded-2xl px-5 py-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#c9a44c] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs text-[#4a4743] font-medium">Results are delivered directly to your employer.</p>
                <p className="text-xs text-[#8a8680] mt-0.5">Most screenings complete within 1-3 business days.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Help */}
        <div className="pt-4 pb-8">
          <div className="bg-white rounded-2xl p-5 text-center" style={{ boxShadow: '0 1px 3px rgba(31,47,74,0.06)' }}>
            <p className="text-xs text-[#8a8680] mb-2">Need help with your screening?</p>
            <div className="flex items-center justify-center gap-4">
              <a href="mailto:accounts@pcgscreening.com" className="inline-flex items-center gap-1.5 text-sm text-[#c9a44c] font-medium hover:text-[#e5c97a] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
              <span className="text-[#e2e0db]">|</span>
              <a href="tel:7707161278" className="inline-flex items-center gap-1.5 text-sm text-[#c9a44c] font-medium hover:text-[#e5c97a] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                770-716-1278
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function TimelineStep({ title, subtitle, date, complete, active, last }: {
  title: string; subtitle: string; date: string | null; complete: boolean; active: boolean; last: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Track */}
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
          complete
            ? 'bg-[#c9a44c] border-[#c9a44c]'
            : 'bg-white border-[#e2e0db]'
        } ${active ? 'ring-[6px] ring-[#c9a44c]/15 scale-110' : ''}`}>
          {complete && (
            <svg className="w-full h-full text-white p-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        {!last && (
          <div className={`w-0.5 flex-1 min-h-[40px] ${complete ? 'bg-[#c9a44c]' : 'bg-[#e2e0db]'}`} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 ${last ? 'pb-0' : ''}`}>
        <p className={`text-sm font-semibold ${complete ? 'text-[#1f2f4a]' : 'text-[#c8c5be]'}`}>
          {title}
        </p>
        <p className={`text-xs mt-0.5 ${complete ? 'text-[#8a8680]' : 'text-[#c8c5be]'}`}>
          {subtitle}
        </p>
        {date && (
          <p className="text-[11px] text-[#c9a44c] font-medium mt-1">{date}</p>
        )}
      </div>
    </div>
  )
}
