'use client'

import { useState } from 'react'

export default function GuestOrderForm({
  packageSlug,
  packageName,
  priceCents,
}: {
  packageSlug: string
  packageName: string
  priceCents: number
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Buyer (the company)
  const [companyName, setCompanyName] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')

  // Candidate
  const [candidateFirst, setCandidateFirst] = useState('')
  const [candidateLast, setCandidateLast] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/guest-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageSlug,
          packageName,
          priceCents,
          companyName,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone.replace(/\D/g, ''),
          candidateFirst,
          candidateLast,
          candidateEmail,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company / Buyer info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-medium text-navy">Your Information</h2>
        <p className="text-xs text-gray-500">You are paying for this screening. We&apos;ll send you the results.</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Your Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Work Email <span className="text-red-400">*</span></label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Candidate info */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-medium text-navy">Candidate to Screen</h2>
        <p className="text-xs text-gray-500">
          After payment, we&apos;ll email this person a secure link to complete the FCRA consent form
          and provide their personal details (SSN, address, etc.).
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Candidate First Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={candidateFirst}
              onChange={(e) => setCandidateFirst(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Candidate Last Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={candidateLast}
              onChange={(e) => setCandidateLast(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Candidate Email <span className="text-red-400">*</span></label>
          <input
            type="email"
            required
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-navy text-white py-3.5 rounded-xl font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay {`$${(priceCents / 100).toFixed(0)}`} & Send Consent Form
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        Secure payment via Stripe. Your candidate will receive an email with a link to complete the
        consent form and provide their personal information.
      </p>
    </form>
  )
}
