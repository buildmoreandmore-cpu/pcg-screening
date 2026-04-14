import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { SCREENING_COMPONENTS } from '@/lib/screening-components'
import ResultsEntryForm from './ResultsEntryForm'
import AttachmentUploader from './AttachmentUploader'
import ReportActions from './ReportActions'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: c } = await supabase
    .from('candidates')
    .select('*, client:clients(id, name, slug, contact_email, notification_email)')
    .eq('id', id)
    .single()

  if (!c) notFound()

  // Determine active screening components
  const components = c.screening_components || {}
  const activeKeys: string[] = []
  for (const [key, val] of Object.entries(components)) {
    if (typeof val === 'object' && val !== null && 'enabled' in val && (val as { enabled: boolean }).enabled) {
      activeKeys.push(key)
    } else if (val === true) {
      activeKeys.push(key)
    }
  }

  // If no components configured, show all results keys or default set
  const effectiveKeys = activeKeys.length > 0
    ? activeKeys
    : Object.keys(c.screening_results || {}).length > 0
      ? Object.keys(c.screening_results)
      : ['criminal_history', 'sex_offender', 'social_security_trace']

  const componentLabels = effectiveKeys.map(key => ({
    key,
    label: SCREENING_COMPONENTS.find(sc => sc.key === key)?.label || key,
  }))

  const recipientEmail = c.client?.notification_email || c.client?.contact_email || ''

  return (
    <div className="space-y-6">
      <Link href={`/admin/candidates/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        Back to {c.first_name} {c.last_name}
      </Link>

      <div>
        <h1 className="font-heading text-2xl text-navy">Generate Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          {c.first_name} {c.last_name} &middot; {c.tracking_code} &middot; {c.package_name}
        </p>
      </div>

      {/* Step 1: Enter Results */}
      <ResultsEntryForm
        candidateId={id}
        components={componentLabels}
        initialResults={c.screening_results || {}}
      />

      {/* Step 2: Attachments */}
      <AttachmentUploader
        candidateId={id}
        initialAttachments={c.report_attachments || []}
      />

      {/* Step 3: Preview & Send */}
      <ReportActions
        candidateId={id}
        recipientEmail={recipientEmail}
        reportSentAt={c.report_sent_at}
        reportSentBy={c.report_sent_by}
        hasResults={Object.keys(c.screening_results || {}).length > 0}
      />
    </div>
  )
}
