import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { FCRA_DISCLOSURE_HISTORY } from '@/lib/fcra-disclosure'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

export default async function ConsentRecordPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: candidate } = await supabase
    .from('candidates')
    .select(
      'id, tracking_code, first_name, last_name, email, consent_status, consent_signed_at, consent_ip, consent_user_agent, consent_method, consent_signature_data_url, consent_disclosure_version, consent_document_url, clients(name)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!candidate) notFound()

  const clientName = (candidate as any).clients?.name as string | undefined
  const version = candidate.consent_disclosure_version || ''
  const snapshot = version ? FCRA_DISCLOSURE_HISTORY[version] : null

  const hasNativeRecord = !!candidate.consent_signature_data_url

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-gray-900 print:p-0">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href={`/admin/candidates/${candidate.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to candidate
        </Link>
        <PrintButton />
      </div>

      <header className="border-b border-gray-300 pb-4 mb-6">
        <h1 className="font-heading text-2xl text-navy">PCG Screening Services</h1>
        <p className="text-sm text-gray-600 mt-1">FCRA Disclosure &amp; Authorization Record</p>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Candidate</p>
          <p className="font-medium">
            {candidate.first_name} {candidate.last_name}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
          <p>{candidate.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Tracking code</p>
          <p className="font-mono">{candidate.tracking_code}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Client</p>
          <p>{clientName || '—'}</p>
        </div>
      </section>

      {hasNativeRecord ? (
        <>
          <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Consent captured at</p>
              <p>{candidate.consent_signed_at ? new Date(candidate.consent_signed_at).toUTCString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Method</p>
              <p>{candidate.consent_method || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">IP address</p>
              <p className="font-mono text-xs">{candidate.consent_ip || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Disclosure version shown</p>
              <p className="font-mono text-xs">{version || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">User agent</p>
              <p className="text-xs break-words">{candidate.consent_user_agent || '—'}</p>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">
              Disclosure &amp; Authorization Text Shown to Candidate
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 text-sm leading-relaxed text-gray-700">
              {snapshot ? (
                snapshot.paragraphs.map((p, i) => (
                  <p key={i} className={i < snapshot.paragraphs.length - 1 ? 'mb-3' : ''}>
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No archived snapshot for version &quot;{version}&quot;. The disclosure shown to this
                  candidate is not in the version registry.
                </p>
              )}
            </div>
          </section>

          {snapshot && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">
                Candidate Acknowledgments
              </h2>
              <ul className="text-sm space-y-2">
                <li className="flex gap-2">
                  <span className="font-mono">[x]</span>
                  <span>{snapshot.checkbox1}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono">[x]</span>
                  <span>{snapshot.checkbox2}</span>
                </li>
              </ul>
            </section>
          )}

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">
              Electronic Signature
            </h2>
            <div className="border border-gray-300 rounded-lg p-3 bg-white inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.consent_signature_data_url!}
                alt="Candidate electronic signature"
                style={{ maxWidth: 400, height: 'auto' }}
              />
            </div>
          </section>
        </>
      ) : (
        <section className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium mb-1">No consent record on file.</p>
          <p>
            This candidate does not have a captured electronic signature. The consent may not have
            been completed during the intake process.
          </p>
        </section>
      )}

      <footer className="border-t border-gray-200 pt-4 mt-8 text-xs text-gray-500">
        Generated by PCG Screening Services administrative portal. This document reflects the exact
        disclosure text version shown to the candidate at the time of signature.
      </footer>
    </div>
  )
}
