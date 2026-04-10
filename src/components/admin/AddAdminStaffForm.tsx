'use client'

import { useState, useTransition } from 'react'
import { addAdminUser } from '@/app/admin/actions/staff'

export default function AddAdminStaffForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'owner'>('admin')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    startTransition(async () => {
      const result = await addAdminUser({ name, email, role })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`Invite sent to ${email}.`)
        setName('')
        setEmail('')
        setRole('admin')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-heading text-lg text-navy mb-3">Add PCG Staff</h2>
      <p className="text-xs text-gray-500 mb-4">
        New staff receive a one-time magic link to set their password. Only owners can manage staff.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
        <div>
          <label htmlFor="staff-name" className="block text-xs font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="staff-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Justin Doe"
            disabled={pending}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="staff-email" className="block text-xs font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="staff-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="justin@pcgscreening.com"
            disabled={pending}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="staff-role" className="block text-xs font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="staff-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'owner')}
            disabled={pending}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          >
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {pending ? 'Sending…' : 'Send Invite'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-3">{success}</p>}
    </form>
  )
}
