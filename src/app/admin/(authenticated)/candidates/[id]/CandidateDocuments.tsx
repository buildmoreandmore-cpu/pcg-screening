'use client'

import type { ReportAttachment } from '@/lib/report-types'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CandidateDocuments({
  candidateId,
  consentDocUrl,
  reportUrl,
  reportSentAt,
  reportAttachments,
  hasSignedConsent,
}: {
  candidateId: string
  consentDocUrl: string | null
  reportUrl: string | null
  reportSentAt: string | null
  reportAttachments: ReportAttachment[]
  hasSignedConsent: boolean
}) {
  const items: Array<{
    key: string
    label: string
    sublabel?: string
    href: string
    download?: boolean
    primary?: boolean
  }> = []

  // Screening report — generated on demand from the latest screening_results.
  items.push({
    key: 'report',
    label: 'Screening Report',
    sublabel: reportSentAt
      ? `Sent ${formatDate(reportSentAt)}`
      : reportUrl
        ? 'Latest generated report'
        : 'Generated on demand from current results',
    href: `/api/admin/report/generate?candidateId=${candidateId}&preview=false`,
    primary: true,
  })

  // Inline preview of report (opens in new tab)
  items.push({
    key: 'report-preview',
    label: 'Preview Report (in browser)',
    sublabel: 'Same content as the download, opens inline',
    href: `/api/admin/report/generate?candidateId=${candidateId}&preview=true`,
  })

  if (hasSignedConsent && consentDocUrl) {
    items.push({
      key: 'consent',
      label: 'FCRA Consent PDF',
      sublabel: 'Candidate signature record',
      href: consentDocUrl,
    })
  }

  if (reportUrl) {
    items.push({
      key: 'legacy-report',
      label: 'Uploaded Report (legacy)',
      sublabel: 'Manually uploaded PDF',
      href: reportUrl,
    })
  }

  for (const att of reportAttachments) {
    items.push({
      key: `attachment-${att.id}`,
      label: att.name,
      sublabel: `Supporting document · ${formatBytes(att.size)}`,
      href: `/api/admin/report/attachments/${encodeURIComponent(att.id)}?candidateId=${candidateId}`,
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Documents</h2>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            {...(item.download ? { download: true } : {})}
            className={`flex items-center justify-between gap-3 py-2.5 group ${
              item.primary ? '' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.primary ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gold transition-colors">
                  {item.label}
                </p>
                {item.sublabel && <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-navy shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No documents available yet.</p>
        )}
      </div>
    </div>
  )
}
