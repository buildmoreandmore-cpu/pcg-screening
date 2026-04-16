'use client'

import { useState, useTransition } from 'react'
import { regenerateConsentPdf } from '@/app/admin/actions/consent'

export default function ConsentPdfButton({
  candidateId,
  consentDocUrl,
  hasSigned,
}: {
  candidateId: string
  consentDocUrl: string | null
  hasSigned: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [url, setUrl] = useState(consentDocUrl)
  const [error, setError] = useState('')

  if (!hasSigned) return null

  function handleGenerate() {
    setError('')
    startTransition(async () => {
      const result = await regenerateConsentPdf({ candidateId })
      if (result.error) {
        setError(result.error)
      } else if ('url' in result && result.url) {
        setUrl(result.url)
      }
    })
  }

  if (url) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:text-gold transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Consent PDF
        </a>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          {pending ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {pending ? 'Generating...' : 'Generate Consent PDF'}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}
