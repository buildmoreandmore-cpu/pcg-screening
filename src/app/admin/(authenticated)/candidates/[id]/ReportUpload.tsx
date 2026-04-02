'use client'

import { useState, useRef } from 'react'
import { uploadReport, markReportSent } from '@/app/admin/actions/candidates'

export default function ReportUpload({
  candidateId,
  reportUrl,
  reportSentAt,
  reportSentBy,
}: {
  candidateId: string
  reportUrl: string | null
  reportSentAt: string | null
  reportSentBy: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(reportUrl)
  const [sentAt, setSentAt] = useState(reportSentAt)
  const [sentBy, setSentBy] = useState(reportSentBy)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('candidateId', candidateId)

    const result = await uploadReport(formData)
    setUploading(false)

    if (result.url) {
      setCurrentUrl(result.url)
    }
  }

  async function handleMarkSent() {
    setSending(true)
    const result = await markReportSent(candidateId)
    setSending(false)

    if (!result.error) {
      setSentAt(new Date().toISOString())
      setSentBy('You')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Screening Report</h2>

      {currentUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-900">Report uploaded</p>
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:text-gold-light">
                  Download report
                </a>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-gray-500 hover:text-navy transition-colors"
            >
              Replace
            </button>
          </div>

          {/* Report Sent Status */}
          <div className="border-t border-gray-100 pt-3">
            {sentAt ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Report sent to employer</p>
                  <p className="text-xs text-gray-400">
                    {sentBy} &middot; {new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleMarkSent}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {sending ? 'Marking...' : 'Mark Report as Sent'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 text-center hover:border-gold hover:bg-gold-pale/20 transition-colors"
        >
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload report (PDF, DOCX)'}</p>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
