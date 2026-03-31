import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase-server'
import StatusBadge from '@/components/portal/StatusBadge'
import CandidateStatusUpdate from './CandidateStatusUpdate'
import JurisdictionManager from './JurisdictionManager'
import ReportUpload from './ReportUpload'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function AdminCandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const supabase = await createClient()

  const [candidateRes, historyRes] = await Promise.all([
    supabase.from('candidates').select('*, client:clients(id, name, slug)').eq('id', id).single(),
    supabase.from('status_history').select('*').eq('candidate_id', id).order('created_at', { ascending: false }),
  ])

  if (!candidateRes.data) notFound()

  const c = candidateRes.data as any
  const history = historyRes.data ?? []

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/candidates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        Back to Candidates
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-navy">{c.first_name} {c.last_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{c.tracking_code}</span>
            <StatusBadge status={c.status} />
            {c.sla_flagged && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">SLA Alert</span>}
          </div>
        </div>
        <Link href={`/admin/clients/${c.client?.id}`} className="text-sm text-gold hover:text-gold-light transition-colors">
          {c.client?.name} →
        </Link>
      </div>

      {/* Status Update — Primary Action */}
      <CandidateStatusUpdate candidateId={c.id} currentStatus={c.status} candidateName={`${c.first_name} ${c.last_name}`} />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Candidate Info */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h2>
          <dl className="space-y-2.5">
            {[
              ['Email', c.email],
              ['Phone', c.phone || '—'],
              ['DOB', c.dob ? new Date(c.dob).toLocaleDateString() : '—'],
              ['SSN', c.ssn_last4 ? `••••${c.ssn_last4}` : '—'],
              ['Address', c.address || '—'],
              ['Source', c.source || 'portal'],
              ['Submitted', formatDate(c.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-900 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Package & Payment */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Package & Payment</h2>
            <dl className="space-y-2.5">
              <div className="flex justify-between">
                <dt className="text-xs text-gray-500">Package</dt>
                <dd className="text-sm text-gray-900">{c.package_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-gray-500">Price</dt>
                <dd className="text-sm text-gray-900">${Number(c.package_price).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Payment</dt>
                <dd><StatusBadge status={c.payment_status} /></dd>
              </div>
              {c.stripe_session_id && (
                <div className="flex justify-between">
                  <dt className="text-xs text-gray-500">Stripe ID</dt>
                  <dd className="text-xs font-mono text-gray-500">{c.stripe_session_id}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Consent</h2>
            <dl className="space-y-2.5">
              <div className="flex justify-between items-center">
                <dt className="text-xs text-gray-500">Status</dt>
                <dd><StatusBadge status={c.consent_status} /></dd>
              </div>
              {c.dropbox_sign_request_id && (
                <div className="flex justify-between">
                  <dt className="text-xs text-gray-500">Dropbox Sign ID</dt>
                  <dd className="text-xs font-mono text-gray-500">{c.dropbox_sign_request_id}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Search Jurisdictions */}
      <JurisdictionManager candidateId={c.id} jurisdictions={c.search_jurisdictions || []} candidateAddress={c.address} />

      {/* Report Upload */}
      <ReportUpload candidateId={c.id} reportUrl={c.report_url} />

      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Status History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No status changes recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h: any) => (
              <div key={h.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-900">
                    {h.previous_status && <><span className="capitalize">{h.previous_status.replace('_', ' ')}</span> → </>}
                    <span className="font-medium capitalize">{h.new_status.replace('_', ' ')}</span>
                  </p>
                  {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{h.updated_by} · {formatDate(h.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
