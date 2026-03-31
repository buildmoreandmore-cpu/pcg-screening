'use client'

import { useState } from 'react'
import { acceptFcra } from '@/app/portal/actions/settings'

export default function FcraModal() {
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    await acceptFcra()
    // Page will refresh after server action updates the DB
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[85dvh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl text-navy">FCRA Compliance Disclosure</h2>
        </div>

        <div className="space-y-3 text-sm text-gray-700 mb-6">
          <p>
            As an employer using background screening services, the Fair Credit Reporting Act (FCRA) requires you to:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2">
              <span className="text-gold font-bold mt-0.5">1.</span>
              <span>Provide clear written disclosure to candidates that a background check may be obtained</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold mt-0.5">2.</span>
              <span>Obtain written authorization from the candidate before ordering a report</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold mt-0.5">3.</span>
              <span>Follow adverse action procedures before taking action based on report findings</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold mt-0.5">4.</span>
              <span>Certify that information will be used for permissible purposes only</span>
            </li>
          </ul>
          <p className="text-gray-500 text-xs">
            For the full FCRA text, visit the{' '}
            <a
              href="https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              FTC website
            </a>
            . Downloadable compliance documents are available in your Resources section.
          </p>
        </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-navy text-white py-3 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'I Acknowledge & Accept'}
        </button>
      </div>
    </div>
  )
}
