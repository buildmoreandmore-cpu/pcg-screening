import { getCredentialingStats } from '@/app/admin/actions/credentialing-stats'

const STATUS_COLORS: Record<string, string> = {
  intake_received: 'bg-blue-100 text-blue-700',
  primary_source_verification: 'bg-yellow-100 text-yellow-700',
  committee_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function CredentialingCard() {
  const credentialingUrl = process.env.CREDENTIALING_URL

  if (!credentialingUrl) return null

  const stats = await getCredentialingStats()

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base text-navy">Credentialing</h2>
          <span className="text-xs text-gray-400">MedCare Staffing</span>
        </div>
        <p className="text-sm text-gray-400">Unable to load credentialing data</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h2 className="font-heading text-base text-navy">Credentialing</h2>
        </div>
        <a
          href={`${credentialingUrl}/admin/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold hover:text-gold-light transition-colors"
        >
          Open Dashboard
        </a>
      </div>

      <div className="grid grid-cols-4 gap-3 px-5 py-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
          <p className="font-heading text-xl text-navy">{stats.total}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Intake</p>
          <p className="font-heading text-xl text-blue-600">{stats.intake}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">In Progress</p>
          <p className="font-heading text-xl text-yellow-600">{stats.inProgress}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Approved</p>
          <p className="font-heading text-xl text-green-600">{stats.approved}</p>
        </div>
      </div>

      {stats.recentProviders.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Recent Providers</p>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentProviders.map((p) => (
              <a
                key={p.id}
                href={`${credentialingUrl}/admin/providers/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                  <p className="text-xs text-gray-500">{p.specialty}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {formatStatus(p.status)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
