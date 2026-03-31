'use client'

import { useState } from 'react'
import { usePortal } from '@/components/portal/PortalContext'
import { inviteCandidate, inviteCandidateManual } from '@/app/portal/actions/invite'
import ScreeningSelector from '@/components/screening/ScreeningSelector'
import type { ScreeningSelections } from '@/components/screening/screening-types'
import { DEFAULT_SELECTIONS } from '@/components/screening/screening-types'

export default function InvitePage() {
  const { client } = usePortal()
  const packages = client.packages || []

  const [mode, setMode] = useState<'link' | 'manual'>('link')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ trackingCode: string; name: string } | null>(null)
  const [error, setError] = useState('')

  // Link mode fields
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedPackage, setSelectedPackage] = useState(packages[0]?.name || '')

  // Manual mode extra fields
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Screening type: 'package' or 'custom'
  const [screeningType, setScreeningType] = useState<'package' | 'custom'>('package')
  const [screeningSelections, setScreeningSelections] = useState<ScreeningSelections>({ ...DEFAULT_SELECTIONS })

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await inviteCandidate({
      firstName,
      email,
      packageName: selectedPackage,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess({ trackingCode: result.trackingCode!, name: firstName })
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await inviteCandidateManual({
      firstName,
      lastName,
      email,
      phone,
      packageName: screeningType === 'package' ? selectedPackage : 'Custom Screening',
      ...(screeningType === 'custom' ? { screeningComponents: screeningSelections } : {}),
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess({ trackingCode: result.trackingCode!, name: `${firstName} ${lastName}` })
  }

  function handleReset() {
    setSuccess(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setSelectedPackage(packages[0]?.name || '')
    setScreeningType('package')
    setScreeningSelections({ ...DEFAULT_SELECTIONS })
    setError('')
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-xl text-navy mb-2">Invite Sent</h2>
        <p className="text-gray-500 text-sm mb-4">
          A screening invitation has been sent to <strong>{success.name}</strong>.
        </p>
        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
          <p className="text-xs text-gray-500">Tracking Code</p>
          <p className="text-lg font-mono text-navy font-medium">{success.trackingCode}</p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gold-light transition-colors"
        >
          Invite Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-xl text-navy">Invite a Candidate</h1>

      {/* Mode Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setMode('link')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'link' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
          }`}
        >
          Send Link
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'manual' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
          }`}
        >
          Enter Details
        </button>
      </div>

      {mode === 'link' ? (
        <form onSubmit={handleSendLink} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Send a screening link. The candidate completes their info, consent, and payment.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {packages.map((pkg: any) => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} — ${pkg.price}
                </option>
              ))}
              {packages.length === 0 && <option>No packages configured</option>}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || packages.length === 0}
            className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Screening Link'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-sm text-gray-500">
              Enter candidate details manually. Use this for employer-paid screenings or candidates who need help.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Screening Type Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Screening Type</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setScreeningType('package')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  screeningType === 'package' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                }`}
              >
                Package
              </button>
              <button
                type="button"
                onClick={() => setScreeningType('custom')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  screeningType === 'custom' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                }`}
              >
                Custom / A La Carte
              </button>
            </div>

            {screeningType === 'package' ? (
              <div>
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  required={screeningType === 'package'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {packages.map((pkg: any) => (
                    <option key={pkg.name} value={pkg.name}>
                      {pkg.name} — ${pkg.price}
                    </option>
                  ))}
                  {packages.length === 0 && <option>No packages configured</option>}
                </select>
              </div>
            ) : (
              <div className="pt-2">
                <ScreeningSelector
                  mode="edit"
                  initialSelections={screeningSelections}
                  onChange={setScreeningSelections}
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || (screeningType === 'package' && packages.length === 0)}
            className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Candidate'}
          </button>
        </form>
      )}
    </div>
  )
}
