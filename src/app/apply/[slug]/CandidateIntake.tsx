'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FCRA_DISCLOSURE_PARAGRAPHS,
  FCRA_CONSENT_CHECKBOX_1,
  FCRA_CONSENT_CHECKBOX_2,
} from '@/lib/fcra-disclosure'
import { SCREENING_COMPONENTS } from '@/lib/screening-components'

type ClientData = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  packages: Array<{
    name: string
    price: number
    description?: string
    features?: string[]
    components?: Record<string, boolean>
    customNotes?: string
  }>
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
]

export default function CandidateIntake({ client }: { client: ClientData }) {
  const searchParams = useSearchParams()
  const packages = client.packages || []

  // Auto-skip package step if only 1 package, OR if the candidate arrived
  // via an employer invite — in that case the employer already chose the
  // package on their behalf and the candidate shouldn't be asked to re-pick.
  const inviteCodeParam = searchParams.get('invite') || ''
  const skipPackageStep = packages.length <= 1 || !!inviteCodeParam

  const [step, setStep] = useState(() => {
    const s = searchParams.get('step')
    return s ? parseInt(s) : 1
  })
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  // Invite-link prefill: when the candidate arrives via
  // /apply/<slug>?invite=PCG-XXXXXXXX (sent by the employer's "Send Link"
  // flow), look up the pre-seeded candidate row and prefill the contact
  // fields. The invite code is also forwarded on submit so the API route
  // can UPDATE the existing row instead of creating a duplicate.
  const inviteCode = inviteCodeParam
  const [invitePrefilled, setInvitePrefilled] = useState(false)

  // Step 1 — Personal Info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [ssn4, setSsn4] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [referralOther, setReferralOther] = useState('')

  // Step 2 — Package
  const [selectedPackage, setSelectedPackage] = useState(
    skipPackageStep && packages[0] ? packages[0].name : ''
  )

  // Step 3 — Consent
  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)
  const [signatureData, setSignatureData] = useState('')
  // 'canvas' = drawn signature, 'typed' = name typed in. Both produce the
  // same Base64 PNG payload via the canvas, so audit display is unchanged.
  const [signatureMode, setSignatureMode] = useState<'canvas' | 'typed'>('canvas')
  const [typedSignature, setTypedSignature] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const typedCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Live date/time stamp shown under the signature (FCRA requires the
  // candidate be able to see when they're signing). The server captures
  // the authoritative consent_signed_at when the row is written.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!inviteCode) return
    fetch(`/api/invite-lookup?code=${encodeURIComponent(inviteCode)}&slug=${encodeURIComponent(client.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        if (data.firstName) setFirstName(data.firstName)
        if (data.lastName) setLastName(data.lastName)
        if (data.email) setEmail(data.email)
        if (data.packageName && packages.find((p) => p.name === data.packageName)) {
          setSelectedPackage(data.packageName)
        }
        setInvitePrefilled(true)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, client.slug])

  // Employer-invited candidates collapse to a 2-step flow:
  //   1) Personal info
  //   2) Authorization & Consent (submits directly, no review/payment)
  const skipReviewStep = !!inviteCodeParam
  const totalSteps = skipReviewStep ? 2 : skipPackageStep ? 3 : 4
  const effectiveStep = skipPackageStep && step >= 2 ? step + 1 : step

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'Required'
    if (!lastName.trim()) e.lastName = 'Required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (phone.replace(/\D/g, '').length < 10) e.phone = 'Valid phone required'
    if (!dob) e.dob = 'Required'
    else {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 18) e.dob = 'Must be 18 or older'
    }
    if (!/^\d{4}$/.test(ssn4)) e.ssn4 = 'Exactly 4 digits'
    if (!address.trim()) e.address = 'Required'
    if (!city.trim()) e.city = 'Required'
    if (!state) e.state = 'Required'
    if (!/^\d{5}$/.test(zip)) e.zip = '5 digit zip required'
    setErrors(e)
    if (Object.keys(e).length > 0) showToast('Please complete all required fields')
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !skipPackageStep && !selectedPackage) {
      showToast('Please select a package')
      return
    }
    const consentStep = skipPackageStep ? 2 : 3
    if (step === consentStep) {
      if (!consent1 || !consent2) { showToast('Please check both consent boxes'); return }
      if (!signatureData) { showToast('Please provide your signature'); return }
      // Employer-invited candidates submit directly from the consent step.
      if (skipReviewStep) {
        handleSubmit()
        return
      }
    }
    setStep(step + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    if (step > 1) setStep(step - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setLoading(true)
    const pkg = packages.find(p => p.name === selectedPackage)

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug: client.slug,
          inviteCode,
          firstName, lastName, email,
          phone: phone.replace(/\D/g, ''),
          dob, ssn4, address, city, state, zip,
          packageName: selectedPackage,
          packagePrice: pkg?.price || 0,
          signatureData,
          signatureMethod: signatureMode === 'typed' ? 'typed' : 'canvas',
          referralSource: referralSource === 'other' ? (referralOther.trim() || 'other') : referralSource,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        showToast('Payment could not be processed. Please try again.')
        setLoading(false)
      }
    } catch {
      showToast('Something went wrong. Please check your connection and try again.')
      setLoading(false)
    }
  }

  // Canvas signature
  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    drawingRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    const { x, y } = getPos(e, canvas)
    ctx.moveTo(x, y)
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e, canvas)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#1f2f4a'
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endDraw() {
    drawingRef.current = false
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL())
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData('')
  }

  function getPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const pkg = packages.find(p => p.name === selectedPackage)
  const progressPercent = (step / totalSteps) * 100
  const consentStep = skipPackageStep ? 2 : 3
  const reviewStep = skipPackageStep ? 3 : 4

  const stepLabels = skipReviewStep
    ? ['Info', 'Consent']
    : skipPackageStep
      ? ['Info', 'Consent', 'Review']
      : ['Info', 'Package', 'Consent', 'Review']

  return (
    <div className="min-h-dvh bg-off-white">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-[slideUp_0.3s_ease]">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
              alt="PCG Screening Services"
              className="h-16 sm:h-20 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Screening for</p>
              <p className="text-base font-medium text-navy truncate">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {stepLabels.map((label, i) => (
              <div key={i} className={`flex items-center gap-1 text-[11px] ${i + 1 <= step ? 'text-navy font-medium' : 'text-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  i + 1 < step ? 'bg-gold text-white' : i + 1 === step ? 'bg-navy text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i + 1 < step ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="hidden xs:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
            {/* Welcome */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gold-pale rounded-full flex items-center justify-center mx-auto mb-3">
                {client.logo_url ? (
                  <img src={client.logo_url} alt="" className="h-8 w-8 object-contain" />
                ) : (
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                )}
              </div>
              <span className="inline-block bg-navy/5 text-navy text-xs font-medium px-3 py-1 rounded-full mb-2">{client.name}</span>
              <h1 className="font-heading text-xl text-navy">Background Screening</h1>
              <p className="text-sm text-gray-500 mt-1">Complete the steps below. Takes about 3 minutes.</p>
            </div>

            {invitePrefilled && (
              <div className="bg-gold-pale/40 border border-gold/30 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-navy">
                  Welcome — we&apos;ve pre-filled your invitation from <strong>{client.name}</strong>.
                </p>
              </div>
            )}

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  title: 'Secure',
                  desc: 'Encrypted & confidential',
                  icon: (
                    <svg className="w-5 h-5 mx-auto text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v3M5 11h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z" />
                    </svg>
                  ),
                },
                {
                  title: 'Quick',
                  desc: '1–3 business days',
                  icon: (
                    <svg className="w-5 h-5 mx-auto text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                },
                {
                  title: 'FCRA',
                  desc: 'Fully compliant',
                  icon: (
                    <svg className="w-5 h-5 mx-auto text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                },
              ].map((t) => (
                <div key={t.title} className="bg-white rounded-lg p-3 text-center shadow-sm">
                  {t.icon}
                  <p className="text-xs font-medium text-navy mt-1">{t.title}</p>
                  <p className="text-[10px] text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" value={firstName} onChange={setFirstName} error={errors.firstName} autoFocus />
                <Field label="Last Name" value={lastName} onChange={setLastName} error={errors.lastName} />
              </div>
              <Field label="Email Address" type="email" value={email} onChange={setEmail} error={errors.email} />
              <Field label="Phone Number" type="tel" value={phone} onChange={(v) => setPhone(formatPhone(v))} error={errors.phone} inputMode="tel" />
              <Field label="Date of Birth" type="date" value={dob} onChange={setDob} error={errors.dob} />
              <Field label="Last 4 of SSN" value={ssn4} onChange={(v) => setSsn4(v.replace(/\D/g, '').slice(0, 4))} error={errors.ssn4} inputMode="numeric" maxLength={4} placeholder="••••" />
              <Field label="Street Address" value={address} onChange={setAddress} error={errors.address} />
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2"><Field label="City" value={city} onChange={setCity} error={errors.city} /></div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className={`w-full px-2 py-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ${errors.state ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">—</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><Field label="Zip Code" value={zip} onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} error={errors.zip} inputMode="numeric" maxLength={5} /></div>
              </div>

              {!inviteCode && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">How did you hear about us?</label>
                  <select
                    value={referralSource}
                    onChange={(e) => { setReferralSource(e.target.value); if (e.target.value !== 'other') setReferralOther('') }}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">— Select one —</option>
                    <option value="google">Google search</option>
                    <option value="referral">Referral from a friend or colleague</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="event">Event or conference</option>
                    <option value="employer">My employer told me</option>
                    <option value="other">Other</option>
                  </select>
                  {referralSource === 'other' && (
                    <input
                      type="text"
                      value={referralOther}
                      onChange={(e) => setReferralOther(e.target.value)}
                      placeholder="Tell us how you found us"
                      className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  )}
                </div>
              )}
            </div>

            <button onClick={goNext} className="w-full bg-navy text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy-light transition-colors">
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {/* STEP 2: Package Selection (skipped if only 1 package) */}
        {step === 2 && !skipPackageStep && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
            <div className="text-center">
              <h2 className="font-heading text-xl text-navy">Select Your Package</h2>
              <p className="text-sm text-gray-500 mt-1">Choose the screening package required for your position.</p>
            </div>

            <div className="space-y-3">
              {packages.map((pkg, i) => {
                const isSelected = selectedPackage === pkg.name
                const isMostPopular = packages.length >= 3 && i === 1
                return (
                  <button
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg.name)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all relative ${
                      isSelected ? 'border-gold bg-gold-pale/30 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {isMostPopular && (
                      <span className="absolute -top-2.5 right-3 bg-navy text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full">Most Popular</span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${isSelected ? 'border-gold bg-gold' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-navy">{pkg.name}</p>
                          <p className="font-heading text-lg text-navy">${pkg.price}</p>
                        </div>
                        {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pkg.features.map((f) => (
                              <span key={f} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">Back</button>
              <button onClick={goNext} disabled={!selectedPackage} className="flex-1 bg-navy text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-40">Continue</button>
            </div>
          </div>
        )}

        {/* STEP: Consent (step 2 if skipped, step 3 if not) */}
        {step === consentStep && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
            <div className="text-center">
              <h2 className="font-heading text-xl text-navy">Authorization & Consent</h2>
              <p className="text-sm text-gray-500 mt-1">Please review and sign to authorize the screening.</p>
            </div>

            {/* Package scope — only shown for employer-invited candidates so
                they can see exactly what's being checked (no pricing). */}
            {inviteCode && (() => {
              const pkg = packages.find((p) => p.name === selectedPackage)
              const activeKeys = pkg?.components
                ? Object.entries(pkg.components).filter(([, v]) => v).map(([k]) => k)
                : []
              const items = SCREENING_COMPONENTS.filter((c) => activeKeys.includes(c.key))
              if (items.length === 0 && !pkg?.customNotes) return null
              return (
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <p className="text-sm font-medium text-navy">Your screening will include</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {client.name} has authorized the following checks:
                  </p>
                  {items.length > 0 && (
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((c) => (
                        <li
                          key={c.key}
                          className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-navy flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {pkg?.customNotes && (
                    <p className="mt-3 text-xs text-gray-500 italic">{pkg.customNotes}</p>
                  )}
                </div>
              )
            })()}

            {/* FCRA Disclosure */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed">
                {FCRA_DISCLOSURE_PARAGRAPHS.map((p, i) => (
                  <p key={i} className={i < FCRA_DISCLOSURE_PARAGRAPHS.length - 1 ? 'mb-3' : ''}>
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consent1} onChange={() => setConsent1(!consent1)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy focus:ring-gold" />
                  <span className="text-sm text-gray-700">{FCRA_CONSENT_CHECKBOX_1}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consent2} onChange={() => setConsent2(!consent2)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy focus:ring-gold" />
                  <span className="text-sm text-gray-700">{FCRA_CONSENT_CHECKBOX_2}</span>
                </label>
              </div>
            </div>

            {/* Signature: Draw or Type */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Electronic Signature</p>
                {signatureData && (
                  <button
                    onClick={() => {
                      clearSignature()
                      setTypedSignature('')
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureMode('canvas')
                    setSignatureData('')
                    setTypedSignature('')
                  }}
                  className={`text-xs font-medium py-2 rounded-md transition-colors ${
                    signatureMode === 'canvas' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Draw signature
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignatureMode('typed')
                    setSignatureData('')
                    if (firstName || lastName) setTypedSignature(`${firstName} ${lastName}`.trim())
                  }}
                  className={`text-xs font-medium py-2 rounded-md transition-colors ${
                    signatureMode === 'typed' ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Type signature
                </button>
              </div>

              {signatureMode === 'canvas' ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    className="w-full border-2 border-dashed border-gray-200 rounded-lg cursor-crosshair touch-none bg-white"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  {!signatureData && (
                    <p className="text-xs text-gray-400 text-center mt-1">Sign here with your finger or mouse</p>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => {
                      const value = e.target.value
                      setTypedSignature(value)
                      // Render to off-screen canvas → Base64 PNG so the
                      // existing storage column / consent record renderer
                      // works without changes.
                      const canvas = typedCanvasRef.current
                      if (!canvas) return
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      ctx.clearRect(0, 0, canvas.width, canvas.height)
                      if (!value.trim()) {
                        setSignatureData('')
                        return
                      }
                      ctx.fillStyle = '#1f2f4a'
                      ctx.font = '48px "Snell Roundhand", "Lucida Handwriting", "Apple Chancery", cursive'
                      ctx.textBaseline = 'middle'
                      ctx.textAlign = 'center'
                      ctx.fillText(value, canvas.width / 2, canvas.height / 2)
                      setSignatureData(canvas.toDataURL())
                    }}
                    placeholder="Type your full legal name"
                    className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-200 text-2xl text-navy bg-white text-center focus:outline-none focus:border-gold"
                    style={{ fontFamily: '"Snell Roundhand", "Lucida Handwriting", "Apple Chancery", cursive' }}
                  />
                  <canvas ref={typedCanvasRef} width={400} height={120} className="hidden" />
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    By typing your name above, you are providing your legal electronic signature.
                  </p>
                </>
              )}

              {/* FCRA-required date/time stamp */}
              <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Signed on</p>
                <p className="text-xs text-gray-700 font-medium mt-0.5">
                  {now
                    ? now.toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">Back</button>
              <button
                onClick={goNext}
                disabled={!consent1 || !consent2 || !signatureData || loading}
                className="flex-1 bg-navy text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-40"
              >
                {loading ? 'Submitting…' : skipReviewStep ? 'Submit' : 'Continue to Review'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Review & Pay */}
        {step === reviewStep && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
            <div className="text-center">
              <h2 className="font-heading text-xl text-navy">Review & Submit</h2>
              <p className="text-sm text-gray-500 mt-1">
                {inviteCode
                  ? 'Confirm your details are correct before submitting.'
                  : 'Confirm your details are correct before payment.'}
              </p>
            </div>

            {/* Review Card */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <dl className="space-y-2">
                {[
                  ['Name', `${firstName} ${lastName}`],
                  ['Email', email],
                  ['Phone', phone],
                  ['Date of Birth', dob ? new Date(dob + 'T12:00:00').toLocaleDateString() : ''],
                  ['SSN', `••••${ssn4}`],
                  ['Address', `${address}, ${city}, ${state} ${zip}`],
                  ['Package', selectedPackage],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-sm text-navy font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {inviteCode ? (
              /* Employer-paid: hide price entirely. The candidate doesn't need
                 to know the cost — the employer is being billed via the client's
                 billing terms (immediate / net_30 / net_60 / net_90). */
              <div className="bg-navy rounded-xl p-5 text-center">
                <p className="text-white/70 text-xs uppercase tracking-wider">Billed to</p>
                <p className="font-heading text-xl text-gold mt-1">{client.name}</p>
                <p className="text-white/60 text-[11px] mt-1">No payment required from you.</p>
              </div>
            ) : (
              <>
                <div className="bg-navy rounded-xl p-5 text-center">
                  <p className="text-white/70 text-xs uppercase tracking-wider">Total Due</p>
                  <p className="font-heading text-3xl text-gold mt-1">${pkg?.price || 0}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Payment securely processed by Stripe
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-gold to-gold-light text-navy py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : inviteCode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Submit
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Pay & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}

function Field({
  label, type = 'text', value, onChange, error, autoFocus, inputMode, maxLength, placeholder,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; autoFocus?: boolean; inputMode?: string; maxLength?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        inputMode={inputMode as any}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ${error ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
        style={{ fontSize: '16px' }}
      />
      {error && <p className="text-red-500 text-[11px] mt-0.5">{error}</p>}
    </div>
  )
}
