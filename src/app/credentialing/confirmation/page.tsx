'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmationContent() {
  const params = useSearchParams()
  const code = params.get('code') || 'MCS-XXXXX'
  const name = params.get('name') || ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Animated checkmark */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-[scale-in_0.3s_ease-out]">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully</h1>
      <p className="text-gray-600 mb-8">
        {name ? `Thank you, Dr. ${name}. ` : ''}Your credentialing application has been received and is being reviewed by our team.
      </p>

      {/* Tracking code card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 inline-block">
        <p className="text-sm text-gray-500 mb-1">Reference Code</p>
        <p className="text-3xl font-mono font-bold" style={{ color: '#4A90D9' }}>{code}</p>
        <p className="text-xs text-gray-400 mt-2">Save this code for your records</p>
      </div>

      <p className="text-sm text-gray-600 mb-8">
        You will receive email updates as your credentialing progresses.
      </p>

      {/* Contact cards */}
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-sm" style={{ color: '#2C5F8A' }}>MedCare Staffing</p>
          <p className="text-sm text-gray-600 mt-1">Tom Harbin, President</p>
          <a href="tel:8884743380" className="text-sm text-[#4A90D9] hover:underline block mt-1">888-474-3380</a>
          <a href="mailto:tharbin@medcarestaffing.com" className="text-sm text-[#4A90D9] hover:underline block">tharbin@medcarestaffing.com</a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-sm text-gray-700">PCG Screening Services</p>
          <p className="text-sm text-gray-600 mt-1">Credentialing Department</p>
          <a href="tel:7707161278" className="text-sm text-[#4A90D9] hover:underline block mt-1">770-716-1278</a>
          <a href="mailto:accounts@pcgscreening.com" className="text-sm text-[#4A90D9] hover:underline block">accounts@pcgscreening.com</a>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
