'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function GuestOrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationInner />
    </Suspense>
  )
}

function ConfirmationInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const trackingCode = searchParams.get('tracking')

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [data, setData] = useState<{
    packageName?: string
    candidateName?: string
    buyerName?: string
    companyName?: string
  }>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/guest-checkout/confirm?session_id=${sessionId}`)
      .then(r => r.json())
      .then(result => {
        if (result.paid) {
          setVerified(true)
          setData({
            packageName: result.packageName,
            candidateName: result.candidateName,
            buyerName: result.buyerName,
            companyName: result.companyName,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  function copyCode() {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (!verified || !trackingCode) {
    return (
      <div className="min-h-dvh bg-off-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <img src="/Copy_of_PCG_Logo_with_Soft_Typography.png" alt="PCG" className="h-14 mx-auto mb-6" />
          <h1 className="font-heading text-xl text-navy mb-2">Payment Not Verified</h1>
          <p className="text-sm text-gray-500 mb-4">
            We couldn&apos;t verify your payment. If you completed payment, please check your email for a confirmation with your tracking code.
          </p>
          <p className="text-sm text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:accounts@pcgscreening.com" className="text-gold">accounts@pcgscreening.com</a>{' '}
            or <a href="tel:7707161278" className="text-gold">770-716-1278</a>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-off-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Success animation */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-[scaleIn_0.5s_ease]" />
            <svg className="relative w-20 h-20 text-green-600 animate-[checkDraw_0.5s_0.3s_ease_both]" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
              <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.5l3 3 6-6" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-navy">
            Order Confirmed{data.buyerName ? `, ${data.buyerName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Payment received. We&apos;ve emailed {data.candidateName || 'your candidate'} a secure link to complete the consent form.
          </p>
        </div>

        {/* Tracking code */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <p className="text-xs text-gray-500 text-center uppercase tracking-wider mb-2">Tracking Code</p>
          <div className="bg-navy rounded-lg py-4 px-5 flex items-center justify-between">
            <span className="font-mono text-xl font-bold text-gold tracking-wider">{trackingCode}</span>
            <button
              onClick={copyCode}
              className="text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Save this code to check the screening status.</p>
        </div>

        {/* Order details */}
        {(data.packageName || data.candidateName) && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            {data.packageName && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Package</span>
                <span className="text-sm font-medium text-navy">{data.packageName}</span>
              </div>
            )}
            {data.candidateName && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Candidate</span>
                <span className="text-sm font-medium text-navy">{data.candidateName}</span>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-sm font-medium text-navy mb-4">What Happens Next</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Consent Form Sent', desc: `We've emailed ${data.candidateName || 'your candidate'} a secure link to authorize the screening.`, active: true },
              { step: '2', title: 'Candidate Completes Form', desc: 'They provide personal details (SSN, address, etc.) and sign the FCRA authorization.', active: false },
              { step: '3', title: 'Screening Begins', desc: 'Once consent is received, our team runs the background check. Most complete in 1–3 business days.', active: false },
              { step: '4', title: 'Results Delivered', desc: 'You\'ll receive an email when the screening report is ready for download.', active: false },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  item.active ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.step}
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.active ? 'text-navy' : 'text-gray-500'}`}>{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track button */}
        <Link
          href={`/track?code=${trackingCode}`}
          className="block w-full bg-navy text-white text-center py-3 rounded-xl font-medium text-sm hover:bg-navy-light transition-colors mb-3"
        >
          Track This Screening
        </Link>

        {/* CTA for portal */}
        <div className="bg-gold-pale rounded-xl p-5 mb-4 text-center">
          <p className="text-sm text-navy font-medium mb-1">Run screenings regularly?</p>
          <p className="text-xs text-gray-600 mb-3">
            Create a free employer portal for volume pricing, team access, and instant candidate invites.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-1 text-sm text-navy font-medium hover:underline"
          >
            Set Up Your Portal
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Questions? Contact PCG at{' '}
            <a href="mailto:accounts@pcgscreening.com" className="text-gold">accounts@pcgscreening.com</a>{' '}
            or <a href="tel:7707161278" className="text-gold">770-716-1278</a>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes checkDraw { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
