import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('client_users')
    .select('id, name, email, role, active, client:clients(id, name)')
    .order('name')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl text-navy">All Users</h1>
        <p className="text-sm text-gray-500">Cross-client view. Manage users from their client&apos;s detail page.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users ?? []).map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/clients/${u.client?.id}`} className="text-sm text-gold hover:text-gold-light transition-colors">
                    {u.client?.name || '—'}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(users ?? []).length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No users found.</div>
        )}
      </div>
    </div>
  )
}
