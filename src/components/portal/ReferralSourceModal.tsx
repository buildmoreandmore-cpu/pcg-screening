'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveClientReferralSource } from '@/app/portal/actions/settings'

const OPTIONS = [
  { value: 'referral', label: 'Referral from another business' },
  { value: 'google', label: 'Google search' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'event', label: 'Event or conference' },
  { value: 'partner', label: 'Channel partner' },
  { value: 'cold_outreach', label: 'PCG reached out to me' },
  { value: 'other', label: 'Other' },
]

export default function ReferralSourceModal() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [referralSource, setReferralSource] = useState('')
  const [referralSourceOther, setReferralSourceOther] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  if (!open) return null

  function submit() {
    setError('')
    if (!referralSource) {
      setError('Please select an option.')
      return
    }
    startTransition(async () => {
      const res = await saveClientReferralSource({
        referralSource,
        referralSourceOther: referralSource === 'other' ? referralSourceOther : undefined,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="font-heading text-xl text-navy">Welcome to PCG Screening</h2>
        <p className="text-sm text-gray-500 mt-1">
          One quick question before you get started — how did you find us?
        </p>

        <div className="mt-5 space-y-2">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                referralSource === opt.value
                  ? 'border-navy bg-navy/[0.03]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="referralSource"
                value={opt.value}
                checked={referralSource === opt.value}
                onChange={(e) => setReferralSource(e.target.value)}
                className="text-navy focus:ring-gold"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>

        {referralSource === 'other' && (
          <input
            type="text"
            value={referralSourceOther}
            onChange={(e) => setReferralSourceOther(e.target.value)}
            placeholder="Tell us how you found us"
            className="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        )}

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={pending}
            className="text-sm text-gray-500 px-3 py-2 hover:text-navy transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
