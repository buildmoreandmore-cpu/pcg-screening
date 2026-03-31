'use client'

import { useState, useRef } from 'react'
import { uploadReport } from '@/app/admin/actions/candidates'

export default function ReportUpload({
  candidateId,
  reportUrl,
}: {
  candidateId: string
  reportUrl: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(reportUrl)
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Screening Report</h2>

      {currentUrl ? (
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
                Download report →
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
