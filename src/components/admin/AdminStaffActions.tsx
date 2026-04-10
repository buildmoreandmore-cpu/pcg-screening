'use client'

import { useTransition } from 'react'
import { toggleAdminUser, updateAdminRole } from '@/app/admin/actions/staff'

export default function AdminStaffActions({
  adminId,
  active,
  role,
  isSelf,
}: {
  adminId: string
  active: boolean
  role: 'admin' | 'owner'
  isSelf: boolean
}) {
  const [pending, startTransition] = useTransition()

  function handleToggleActive() {
    startTransition(async () => {
      await toggleAdminUser({ adminId, active: !active })
    })
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as 'admin' | 'owner'
    startTransition(async () => {
      await updateAdminRole({ adminId, role: newRole })
    })
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <select
        value={role}
        onChange={handleRoleChange}
        disabled={pending || isSelf}
        title={isSelf ? "You can't change your own role." : 'Change role'}
        className="px-2 py-1 rounded-md border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
      </select>
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={pending || isSelf}
        title={isSelf ? "You can't deactivate yourself." : active ? 'Deactivate' : 'Activate'}
        className={`text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          active
            ? 'text-red-600 hover:bg-red-50'
            : 'text-green-700 hover:bg-green-50'
        }`}
      >
        {pending ? '…' : active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
