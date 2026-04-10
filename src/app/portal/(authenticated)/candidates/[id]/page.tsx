import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import StatusBadge from '@/components/portal/StatusBadge'
import CandidateActions from './CandidateActions'

const steps = ['submitted', 'in_progress', 'completed'] as const

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clientUser = await requireAuth()
  const supabase = createAdminClient()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .eq('client_id', clientUser.client_id)
    .single()

  if (!candidate) notFound()

  const currentStepIndex = steps.indexOf(candidate.status as any)
  const timestamps: Record<string, string | null> = {
    submitted: candidate.created_at,
    in_progress: candidate.screening_started_at,
    completed: candidate.screening_completed_at,
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/portal/candidates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Candidates
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <h1 className="font-heading text-xl text-navy">
          {candidate.first_name} {candidate.last_name}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {candidate.tracking_code}
          </span>
          <StatusBadge status={candidate.status} />
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Screening Progress</h2>
        <div className="flex items-start gap-0">
          {steps.map((step, i) => {
            const isComplete = i <= currentStepIndex
            const isCurrent = i === currentStepIndex
            const ts = timestamps[step]

            return (
              <div key={step} className="flex-1 relative">
                <div className="flex items-center">
                  {/* Connector line (before) */}
                  {i > 0 && (
                    <div className={`h-0.5 flex-1 ${i <= currentStepIndex ? 'bg-gold' : 'bg-gray-200'}`} />
                  )}
                  {/* Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-gold text-white ring-4 ring-gold/20'
                      : isComplete
                        ? 'bg-gold text-white'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  {/* Connector line (after) */}
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < currentStepIndex ? 'bg-gold' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium capitalize ${isComplete ? 'text-navy' : 'text-gray-400'}`}>
                    {step.replace('_', ' ')}
                  </p>
                  {ts && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(ts)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {candidate.sla_flagged && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-800">
              <strong>Extended Processing</strong> — This screening is taking longer than usual. Our team is working on it.
            </p>
          </div>
        )}
      </div>

      {/* Info Card (editable) */}
      <CandidateActions
        candidate={{
          id: candidate.id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          phone: candidate.phone,
          package_name: candidate.package_name,
          payment_status: candidate.payment_status,
          consent_status: candidate.consent_status,
          status: candidate.status,
        }}
        packages={(clientUser.client.packages as any[]) || []}
      />

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Order Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs text-gray-500">Price</dt>
            <dd className="text-sm text-gray-900">${Number(candidate.package_price).toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Submitted</dt>
            <dd className="text-sm text-gray-900">{formatDate(candidate.created_at)}</dd>
          </div>
        </dl>
      </div>

      {/* Payment & Consent */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Payment</p>
          <StatusBadge status={candidate.payment_status} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Consent</p>
          <StatusBadge status={candidate.consent_status} />
        </div>
      </div>
    </div>
  )
}
