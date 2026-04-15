'use client'

import { useState, useRef } from 'react'
import { uploadReportAttachment, removeReportAttachment } from '@/app/admin/actions/report'
import type { ReportAttachment } from '@/lib/report-types'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function AttachmentUploader({
  candidateId,
  initialAttachments,
}: {
  candidateId: string
  initialAttachments: ReportAttachment[]
}) {
  const [attachments, setAttachments] = useState<ReportAttachment[]>(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('candidateId', candidateId)

    const result = await uploadReportAttachment(formData)
    setUploading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.attachments) {
      setAttachments(result.attachments)
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemove(attachmentId: string) {
    const result = await removeReportAttachment(candidateId, attachmentId)
    if (result.attachments) {
      setAttachments(result.attachments)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-navy mb-1">Step 2: Supplementary Documents</h2>
      <p className="text-xs text-gray-400 mb-4">Attach credit reports, SSN traces, or other supporting documents.</p>

      {attachments.length > 0 && (
        <div className="space-y-2 mb-4">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{att.name}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(att.size)}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(att.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-center hover:border-gold hover:bg-gold-pale/20 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Add attachment (PDF, DOCX)'}</p>
      </button>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
