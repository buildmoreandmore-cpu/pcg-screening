'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCandidate, cancelCandidate, resendCandidateInvite } from '@/app/portal/actions/candidate'

interface Package {
  name: string
  price?: number
}

interface Props {
  candidate: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    package_name: string
    payment_status: string | null
    consent_status: string | null
    status: string | null
  }
  packages: Package[]
}

export default function CandidateActions({ candidate, packages }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null)

  const [firstName, setFirstName] = useState(candidate.first_name || '')
  const [lastName, setLastName] = useState(candidate.last_name || '')
  const [email, setEmail] = useState(candidate.email || '')
  const [phone, setPhone] = useState(candidate.phone || '')
  const [packageName, setPackageName] = useState(candidate.package_name || '')

  const locked =
    candidate.payment_status === 'paid' ||
    candidate.consent_status === 'signed' ||
    candidate.status === 'cancelled'

  const isCancelled = candidate.status === 'cancelled'

  function handleSave() {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateCandidate({
        candidateId: candidate.id,
        firstName,
        lastName,
        email,
        phone,
        packageName,
      })
      if (res.error) {
        setFeedback({ kind: 'error', msg: res.error })
        return
      }
      setFeedback({ kind: 'ok', msg: 'Candidate updated.' })
      setEditing(false)
      router.refresh()
    })
  }

  function handleResend() {
    setFeedback(null)
    if (!confirm(`Resend the screening invite email to ${candidate.email}?`)) return
    startTransition(async () => {
      const res = await resendCandidateInvite({ candidateId: candidate.id })
      if (res.error) {
        setFeedback({ kind: 'error', msg: res.error })
        return
      }
      setFeedback({ kind: 'ok', msg: `Invite resent to ${res.sentTo}.` })
    })
  }

  function handleCancel() {
    setFeedback(null)
    if (
      !confirm(
        'Cancel this candidate? They will no longer be able to complete the screening. This cannot be undone from the portal.'
      )
    )
      return
    startTransition(async () => {
      const res = await cancelCandidate({ candidateId: candidate.id })
      if (res.error) {
        setFeedback({ kind: 'error', msg: res.error })
        return
      }
      setFeedback({ kind: 'ok', msg: 'Candidate cancelled.' })
      router.refresh()
    })
  }

  function handleCancelEdit() {
    setFirstName(candidate.first_name || '')
    setLastName(candidate.last_name || '')
    setEmail(candidate.email || '')
    setPhone(candidate.phone || '')
    setPackageName(candidate.package_name || '')
    setEditing(false)
    setFeedback(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Candidate Information</h2>
        {!editing && !locked && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:text-navy-light transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}
      </div>

      {locked && !isCancelled && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
          This candidate has paid or signed consent. Their record is locked to preserve the FCRA
          audit trail.
        </div>
      )}
      {isCancelled && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          This candidate has been cancelled.
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Package</label>
              <select
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                {packages.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                    {typeof p.price === 'number' ? ` — $${p.price.toFixed(2)}` : ''}
                  </option>
                ))}
                {!packages.find((p) => p.name === packageName) && (
                  <option value={packageName}>{packageName}</option>
                )}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={pending}
              className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={pending}
              className="text-gray-600 px-3 py-2 text-sm hover:text-navy transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="text-sm text-gray-900">
              {candidate.first_name} {candidate.last_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{candidate.email}</dd>
          </div>
          {candidate.phone && (
            <div>
              <dt className="text-xs text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{candidate.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">Package</dt>
            <dd className="text-sm text-gray-900">{candidate.package_name}</dd>
          </div>
        </dl>
      )}

      {feedback && (
        <div
          className={`mt-3 text-xs px-3 py-2 rounded-lg ${
            feedback.kind === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {!editing && !locked && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <button
            onClick={handleResend}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:text-navy-light transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Resend invite email
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={handleCancel}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 7V4a2 2 0 012-2h0a2 2 0 012 2v3"
              />
            </svg>
            Cancel candidate
          </button>
        </div>
      )}
    </div>
  )
}
