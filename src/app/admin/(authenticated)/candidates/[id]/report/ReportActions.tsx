'use client'

import { useState } from 'react'
import { sendReportToEmployer } from '@/app/admin/actions/report'

export default function ReportActions({
  candidateId,
  recipientEmail: initialEmail,
  reportSentAt,
  reportSentBy,
  hasResults,
}: {
  candidateId: string
  recipientEmail: string
  reportSentAt: string | null
  reportSentBy: string | null
  hasResults: boolean
}) {
  const [email, setEmail] = useState(initialEmail)
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(reportSentAt)
  const [sentBy, setSentBy] = useState(reportSentBy)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email) {
      setError('Recipient email is required')
      return
    }
    setSending(true)
    setError('')
    const result = await sendReportToEmployer(candidateId, email)
    setSending(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSentAt(new Date().toISOString())
      setSentBy('You')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-navy mb-1">Step 3: Preview & Send</h2>
      <p className="text-xs text-gray-400 mb-4">Preview the report, then send it directly to the employer.</p>

      {/* Preview / Download */}
      <div className="flex gap-3 mb-4">
        <a
          href={`/api/admin/report/generate?candidateId=${candidateId}&preview=true`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            hasResults
              ? 'bg-gray-100 text-navy hover:bg-gray-200'
              : 'bg-gray-50 text-gray-300 pointer-events-none'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview Report
        </a>
        <a
          href={`/api/admin/report/generate?candidateId=${candidateId}&preview=false`}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            hasResults
              ? 'bg-gray-100 text-navy hover:bg-gray-200'
              : 'bg-gray-50 text-gray-300 pointer-events-none'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>

      {/* Send Section */}
      <div className="border-t border-gray-100 pt-4">
        {sentAt ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Report sent</p>
              <p className="text-xs text-gray-400">
                {sentBy} &middot; {new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-xs text-gray-500 mb-1.5">Send report to</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employer@company.com"
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={sending || !hasResults}
                className="px-5 py-2.5 bg-gold text-navy rounded-lg font-medium text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {sending ? 'Sending...' : 'Send Report'}
              </button>
            </div>
            {!hasResults && (
              <p className="text-xs text-amber-600 mt-2">Save screening results before sending the report.</p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-2">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
