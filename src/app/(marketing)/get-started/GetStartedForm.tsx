'use client'

import { useState, useTransition } from 'react'
import { submitLeadRequest } from '@/app/actions/leads'

type LeadType = 'screen' | 'package' | 'call'

const TYPE_OPTIONS: { value: LeadType; label: string; desc: string }[] = [
  { value: 'screen', label: 'Run my first screen', desc: 'Set me up so I can submit a candidate today.' },
  { value: 'package', label: 'Build a custom package', desc: 'I want help putting together the right components for my industry.' },
  { value: 'call', label: 'Schedule a call', desc: 'I have questions — let&apos;s talk.' },
]

export default function GetStartedForm({ initialType }: { initialType: LeadType }) {
  const [type, setType] = useState<LeadType>(initialType)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await submitLeadRequest({
        name,
        company,
        email,
        phone,
        type,
        message,
        source: 'get-started',
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold-pale flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-navy text-2xl mb-2">We got your request</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Gwen has been notified and will reach out shortly — usually within a couple of business hours.
          Keep an eye on your inbox at <span className="font-medium text-navy">{email}</span>.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6"
    >
      {/* Type selector */}
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
          What do you need?
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const on = type === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  on ? 'border-navy bg-navy/[0.03]' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className={`text-sm font-semibold ${on ? 'text-navy' : 'text-gray-700'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Your Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Work Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Anything we should know? <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Tell us about your industry, hiring volume, or specific checks you're looking for."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending...' : 'Send My Request'}
        {!pending && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        )}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        Your info goes straight to Gwen at PCG. We never share or resell contact details.
      </p>
    </form>
  )
}
