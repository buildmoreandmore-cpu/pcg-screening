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
  const [results, setResults] = useState<ScreeningResults>(initialResults)

  // A component is considered unfilled if it's still N/A — that's the
  // default state when results haven't been entered. This prevents
  // sending a report with a "Sanctions Lists: Clear" lump when really
  // OFAC was checked but OIG/SAM/GSA weren't.
  const unfilled = components
    .filter((c) => {
      const r = results[c.key]
      if (!r) return true
      if (r.result === 'not_applicable') return true
      return false
    })
    .map((c) => c.label)

  return (
    <>
      <ResultsEntryForm
        candidateId={candidateId}
        components={components}
        initialResults={initialResults}
        onResultsChange={setResults}
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
        totalComponents={components.length}
        unfilledLabels={unfilled}
      />
    </>
  )
}
