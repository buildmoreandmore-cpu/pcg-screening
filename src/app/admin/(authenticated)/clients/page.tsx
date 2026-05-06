import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import ClientDeleteButton from '@/components/admin/ClientDeleteButton'

export default async function AdminClientsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  // Get clients with candidate counts
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, name, slug, contact_name, contact_email, contact_phone, packages, active, created_at,
      candidates(id, status)
    `)
    .order('name')

  const clientsWithStats = (clients ?? []).map((c: any) => {
    const candidates = c.candidates ?? []
    const active = candidates.filter((cd: any) => cd.status !== 'completed' && cd.status !== 'cancelled').length
    const total = candidates.length
    return { ...c, activeCandidates: active, totalScreenings: total, packageCount: (c.packages ?? []).length }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">Clients</h1>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Client
        </Link>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {clientsWithStats.map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/clients/${c.id}`} className="text-sm font-medium text-navy hover:text-gold transition-colors">
                  {c.name}
                </Link>
                <p className="text-xs text-gray-400 truncate">{c.contact_email || '—'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
                <ClientDeleteButton clientId={c.id} clientName={c.name} active={!!c.active} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span><span className="font-medium text-gray-900">{c.activeCandidates}</span> active</span>
              <span><span className="font-medium text-gray-900">{c.totalScreenings}</span> total</span>
              <span><span className="font-medium text-gray-900">{c.packageCount}</span> packages</span>
            </div>
          </div>
        ))}
        {clientsWithStats.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm text-center py-12 text-sm text-gray-400">No clients yet. Add your first client to get started.</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Packages</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientsWithStats.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="text-sm font-medium text-navy hover:text-gold transition-colors">
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-400">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{c.contact_name || '—'}</p>
                    <p className="text-xs text-gray-500">{c.contact_email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.contact_phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{c.activeCandidates}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.totalScreenings}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.packageCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ClientDeleteButton clientId={c.id} clientName={c.name} active={!!c.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clientsWithStats.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No clients yet. Add your first client to get started.</div>
        )}
      </div>
    </div>
  )
}
