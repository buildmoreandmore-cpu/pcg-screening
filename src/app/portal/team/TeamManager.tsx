'use client'

import { useState } from 'react'
import { inviteTeamMember, deactivateTeamMember } from '@/app/portal/actions/team'

type Member = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
}

export default function TeamManager({
  members,
  currentUserId,
}: {
  members: Member[]
  currentUserId: string
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await inviteTeamMember({ name, email, role })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(`Invitation sent to ${email}`)
    setName('')
    setEmail('')
    setRole('user')
    setShowAdd(false)

    // Refresh page to show new member
    window.location.reload()
  }

  async function handleDeactivate(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the team?`)) return

    const result = await deactivateTeamMember(memberId)

    if (result.error) {
      alert(result.error)
      return
    }

    window.location.reload()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl text-navy">Team</h1>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showAdd && (
        <form onSubmit={handleInvite} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="user">User — can view and invite candidates</option>
              <option value="admin">Admin — can also manage team members</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-gray-900">{m.name}</p>
              <p className="text-xs text-gray-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                m.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-600'
              }`}>
                {m.role}
              </span>
              {m.id !== currentUserId && (
                <button
                  onClick={() => handleDeactivate(m.id, m.name)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
