'use client'

import { useState, useTransition } from 'react'
import { sendDropboxSignRequest } from '@/app/admin/actions/dropbox-sign'

export default function DropboxSignButton({
  candidateId,
  alreadySent,
  signedDocUrl,
}: {
  candidateId: string
  alreadySent: boolean
  signedDocUrl: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [sent, setSent] = useState(alreadySent)

  function handleClick() {
    setError('')
    startTransition(async () => {
      const result = await sendDropboxSignRequest({ candidateId })
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (signedDocUrl) {
    return (
      <a
        href={signedDocUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:text-gold transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Signed Disclosure
      </a>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        {pending ? 'Sending…' : sent ? 'Re-send Formal E-Sign' : 'Send Formal E-Sign Request'}
      </button>
      {sent && !error && (
        <p className="text-[11px] text-green-600 mt-1">Sent. Candidate will receive an email from Dropbox Sign.</p>
      )}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}
