'use client'

import { useState } from 'react'
import { usePortal } from '@/components/portal/PortalContext'
import { inviteCandidate, inviteCandidateManual } from '@/app/portal/actions/invite'
import ScreeningSelector from '@/components/screening/ScreeningSelector'
import ScreeningSummary from '@/components/screening/ScreeningSummary'
import type { ScreeningSelections } from '@/components/screening/screening-types'
import { DEFAULT_SELECTIONS } from '@/components/screening/screening-types'

export default function InvitePage() {
  const { client } = usePortal()
  const packages = client.packages || []

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ trackingCode: string; name: string } | null>(null)
  const [error, setError] = useState('')

  // Step 1: What to screen
  const [screeningType, setScreeningType] = useState<'package' | 'custom'>('package')
  const [selectedPackage, setSelectedPackage] = useState(packages[0]?.name || '')
  const [screeningSelections, setScreeningSelections] = useState<ScreeningSelections>({ ...DEFAULT_SELECTIONS })

  // Step 2: Who + How
  const [deliveryMode, setDeliveryMode] = useState<'link' | 'manual'>('link')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const enabledCount = Object.values(screeningSelections).filter((s: any) => s.enabled).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (deliveryMode === 'link') {
      const result = await inviteCandidate({
        firstName,
        email,
        packageName: screeningType === 'package' ? selectedPackage : 'Custom Screening',
        ...(screeningType === 'custom' ? { screeningComponents: screeningSelections } : {}),
      })
      setLoading(false)
      if (result.error) { setError(result.error); return }
      setSuccess({ trackingCode: result.trackingCode!, name: firstName })
    } else {
      const result = await inviteCandidateManual({
        firstName,
        lastName,
        email,
        phone,
        packageName: screeningType === 'package' ? selectedPackage : 'Custom Screening',
        ...(screeningType === 'custom' ? { screeningComponents: screeningSelections } : {}),
      })
      setLoading(false)
      if (result.error) { setError(result.error); return }
      setSuccess({ trackingCode: result.trackingCode!, name: `${firstName} ${lastName}` })
    }
  }

  function handleReset() {
    setSuccess(null)
    setStep(1)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setSelectedPackage(packages[0]?.name || '')
    setScreeningType('package')
    setScreeningSelections({ ...DEFAULT_SELECTIONS })
    setDeliveryMode('link')
    setError('')
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-xl text-navy mb-2">
          {deliveryMode === 'link' ? 'Invite Sent' : 'Candidate Submitted'}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {deliveryMode === 'link'
            ? <>A screening invitation has been sent to <strong>{success.name}</strong>.</>
            : <><strong>{success.name}</strong> has been submitted for screening.</>
          }
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

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            step === 1 ? 'text-navy' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 1 ? 'bg-navy text-white' : step === 2 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {step === 2 ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : '1'}
          </span>
          What to Screen
        </button>
        <div className="flex-1 h-px bg-gray-200" />
        <button
          onClick={() => step === 2 ? undefined : undefined}
          className={`flex items-center gap-2 text-sm font-medium ${
            step === 2 ? 'text-navy' : 'text-gray-300'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 2 ? 'bg-navy text-white' : 'bg-gray-200 text-gray-400'
          }`}>2</span>
          Who to Screen
        </button>
      </div>

      {/* STEP 1: What to screen */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Package cards */}
          <div className="space-y-3">
            {packages.map((pkg: any) => (
              <button
                key={pkg.name}
                type="button"
                onClick={() => { setScreeningType('package'); setSelectedPackage(pkg.name) }}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  screeningType === 'package' && selectedPackage === pkg.name
                    ? 'border-navy bg-navy/[0.02] shadow-sm'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy">{pkg.name}</p>
                    {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-lg font-heading text-navy">${pkg.price}</p>
                  </div>
                </div>
                {pkg.features && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {pkg.features.map((f: string) => (
                      <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md">{f}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* Separator */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">or build your own</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Custom / A La Carte banner */}
            <button
              type="button"
              onClick={() => setScreeningType('custom')}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all relative overflow-hidden ${
                screeningType === 'custom'
                  ? 'border-gold shadow-md ring-1 ring-gold/20'
                  : 'border-gold/30 hover:border-gold/60'
              }`}
              style={{ background: 'linear-gradient(135deg, #fdf8ed 0%, #fef3d0 50%, #fdf8ed 100%)' }}
            >
              {/* Decorative corner accent */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gold/10 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-gold/5 rounded-full" />

              <div className="relative flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-navy">Custom Screening</p>
                    <span className="px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-bold rounded-full uppercase tracking-wider">A La Carte</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">Pick exactly the checks you need — criminal, employment, education, drug testing & more</p>
                </div>
                <div className="shrink-0">
                  <svg className={`w-5 h-5 transition-transform ${screeningType === 'custom' ? 'text-gold rotate-90' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              {screeningType === 'custom' && enabledCount > 0 && (
                <div className="relative mt-4 pt-3 border-t border-gold/20">
                  <ScreeningSummary selections={screeningSelections} />
                </div>
              )}
            </button>
          </div>

          {/* Custom screening selector (expands below the cards) */}
          {screeningType === 'custom' && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <ScreeningSelector
                mode="edit"
                initialSelections={screeningSelections}
                onChange={setScreeningSelections}
              />
            </div>
          )}

          {/* Continue button */}
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={screeningType === 'custom' && enabledCount === 0}
            className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP 2: Who to screen + delivery method */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary of what was selected */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Screening</p>
                <p className="text-sm font-medium text-navy">
                  {screeningType === 'package'
                    ? `${selectedPackage} — $${packages.find((p: any) => p.name === selectedPackage)?.price || 0}`
                    : `Custom (${enabledCount} component${enabledCount !== 1 ? 's' : ''})`
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gold hover:text-gold-light font-medium"
              >
                Change
              </button>
            </div>
          </div>

          {/* How to deliver */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setDeliveryMode('link')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                deliveryMode === 'link' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
              }`}
            >
              Send Link
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode('manual')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                deliveryMode === 'manual' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
              }`}
            >
              Enter Details
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-sm text-gray-500">
              {deliveryMode === 'link'
                ? 'Send a screening link. The candidate completes their info, consent, and payment.'
                : 'Enter candidate details manually. For employer-paid screenings or candidates who need help.'
              }
            </p>

            {deliveryMode === 'link' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
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
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : deliveryMode === 'link' ? 'Send Screening Link' : 'Submit Candidate'}
          </button>
        </form>
      )}
    </div>
  )
}
