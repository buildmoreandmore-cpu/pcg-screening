import { requireOwner } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import AddAdminStaffForm from '@/components/admin/AddAdminStaffForm'
import AdminStaffActions from '@/components/admin/AdminStaffActions'

export default async function AdminStaffPage() {
  const me = await requireOwner()
  const supabase = createAdminClient()

  const { data: staff } = await supabase
    .from('admin_users')
    .select('id, name, email, role, active, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl text-navy">PCG Staff</h1>
        <p className="text-sm text-gray-500">
          Internal team members with access to the admin dashboard.
        </p>
      </div>

      <AddAdminStaffForm />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(staff ?? []).map((s: any) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.id === me.id && (
                      <p className="text-[10px] text-gold uppercase tracking-wide">You</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStaffActions
                      adminId={s.id}
                      active={!!s.active}
                      role={s.role === 'owner' ? 'owner' : 'admin'}
                      isSelf={s.id === me.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(staff ?? []).length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No staff yet.</div>
        )}
      </div>
    </div>
  )
}
