'use client'

import { useState } from 'react'
import ResultsEntryForm from './ResultsEntryForm'
import AttachmentUploader from './AttachmentUploader'
import ReportActions from './ReportActions'
import type { ScreeningResults, ReportAttachment } from '@/lib/report-types'

export default function ReportWorkflow({
  candidateId,
  components,
  initialResults,
  initialAttachments,
  recipientEmail,
  reportSentAt,
  reportSentBy,
  initialHasResults,
}: {
  candidateId: string
  components: Array<{ key: string; label: string }>
  initialResults: ScreeningResults
  initialAttachments: ReportAttachment[]
  recipientEmail: string
  reportSentAt: string | null
  reportSentBy: string | null
  initialHasResults: boolean
}) {
  const [hasResults, setHasResults] = useState(initialHasResults)

  return (
    <>
      <ResultsEntryForm
        candidateId={candidateId}
        components={components}
        initialResults={initialResults}
        onSaved={() => setHasResults(true)}
      />

      <AttachmentUploader
        candidateId={candidateId}
        initialAttachments={initialAttachments}
      />

      <ReportActions
        candidateId={candidateId}
        recipientEmail={recipientEmail}
        reportSentAt={reportSentAt}
        reportSentBy={reportSentBy}
        hasResults={hasResults}
      />
    </>
  )
}
