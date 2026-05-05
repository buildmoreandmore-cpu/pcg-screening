'use client'

import { useState } from 'react'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatSsnDisplay(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 9) return raw
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export default function CandidatePII({
  candidateId,
  email,
  phone,
  dob,
  ssnLast4,
  maidenName,
  sex,
  race,
  driversLicenseNumber,
  driversLicenseState,
  driversLicenseClass,
  driversLicenseExpiration,
  address,
  source,
  referralSource,
  submittedAt,
}: {
  candidateId: string
  email: string
  phone: string | null
  dob: string | null
  ssnLast4: string | null
  maidenName: string | null
  sex: string | null
  race: string | null
  driversLicenseNumber: string | null
  driversLicenseState: string | null
  driversLicenseClass: string | null
  driversLicenseExpiration: string | null
  address: string | null
  source: string | null
  referralSource: string | null
  submittedAt: string
}) {
  const [fullSsn, setFullSsn] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState('')

  async function handleRevealSsn() {
    if (fullSsn) {
      setFullSsn(null)
      return
    }
    setRevealing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/ssn`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to retrieve SSN')
      } else if (data.ssn) {
        setFullSsn(formatSsnDisplay(data.ssn))
      } else {
        setError('No full SSN on file')
      }
    } catch {
      setError('Failed to retrieve SSN')
    }
    setRevealing(false)
  }

  async function handleCopySsn() {
    if (!fullSsn) return
    await navigator.clipboard.writeText(fullSsn.replace(/\D/g, ''))
  }

  const dl = [driversLicenseNumber, driversLicenseState, driversLicenseClass]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h2>
      <dl className="space-y-2.5">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-gray-500">Email</dt>
          <dd className="text-sm text-gray-900 text-right break-all">{email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-xs text-gray-500">Phone</dt>
          <dd className="text-sm text-gray-900">{phone || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-xs text-gray-500">DOB</dt>
          <dd className="text-sm text-gray-900">{dob ? new Date(dob).toLocaleDateString() : '—'}</dd>
        </div>

        {/* SSN with click-to-reveal */}
        <div className="flex justify-between items-center">
          <dt className="text-xs text-gray-500">SSN</dt>
          <dd className="text-sm text-gray-900 flex items-center gap-2">
            <span className="font-mono">
              {fullSsn ? fullSsn : ssnLast4 ? `•••-••-${ssnLast4}` : '—'}
            </span>
            {ssnLast4 && (
              <>
                <button
                  onClick={handleRevealSsn}
                  disabled={revealing}
                  className="text-xs text-gold hover:text-gold-light transition-colors disabled:opacity-50"
                >
                  {revealing ? '…' : fullSsn ? 'Hide' : 'Reveal'}
                </button>
                {fullSsn && (
                  <button
                    onClick={handleCopySsn}
                    className="text-xs text-gray-400 hover:text-navy transition-colors"
                  >
                    Copy
                  </button>
                )}
              </>
            )}
          </dd>
        </div>
        {error && (
          <p className="text-xs text-red-600 text-right">{error}</p>
        )}

        {maidenName && (
          <div className="flex justify-between">
            <dt className="text-xs text-gray-500">Maiden / Prior Name</dt>
            <dd className="text-sm text-gray-900">{maidenName}</dd>
          </div>
        )}
        {sex && (
          <div className="flex justify-between">
            <dt className="text-xs text-gray-500">Sex</dt>
            <dd className="text-sm text-gray-900 capitalize">{sex}</dd>
          </div>
        )}
        {race && (
          <div className="flex justify-between">
            <dt className="text-xs text-gray-500">Race</dt>
            <dd className="text-sm text-gray-900 capitalize">{race}</dd>
          </div>
        )}

        {dl && (
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-gray-500">Driver&apos;s License</dt>
            <dd className="text-sm text-gray-900 text-right">{dl}</dd>
          </div>
        )}
        {driversLicenseExpiration && (
          <div className="flex justify-between">
            <dt className="text-xs text-gray-500">DL Expiration</dt>
            <dd className="text-sm text-gray-900">{driversLicenseExpiration}</dd>
          </div>
        )}

        <div className="flex justify-between gap-3">
          <dt className="text-xs text-gray-500">Address</dt>
          <dd className="text-sm text-gray-900 text-right">{address || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-xs text-gray-500">Source</dt>
          <dd className="text-sm text-gray-900">{source || 'portal'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-xs text-gray-500">Heard about us</dt>
          <dd className="text-sm text-gray-900">{referralSource || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-xs text-gray-500">Submitted</dt>
          <dd className="text-sm text-gray-900">{formatDate(submittedAt)}</dd>
        </div>
      </dl>
    </div>
  )
}
