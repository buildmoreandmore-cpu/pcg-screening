import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase-server'

export default async function AdminClientsPage() {
  await requireAdmin()
  const supabase = await createClient()

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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
