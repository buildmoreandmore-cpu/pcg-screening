'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/portal/StatusBadge'
import ClientSettingsForm from '@/components/admin/ClientSettingsForm'
import { addClientUser, toggleClientUser } from '@/app/admin/actions/clients'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function ClientDetail({
  client,
  candidates,
  users,
  stats,
}: {
  client: any
  candidates: any[]
  users: any[]
  stats: { total: number; active: number; completed: number; revenue: number }
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'candidates' | 'users' | 'settings'>('candidates')
  const [showAddUser, setShowAddUser] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('user')
  const [addingUser, setAddingUser] = useState(false)

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setAddingUser(true)
    const result = await addClientUser({ clientId: client.id, name: userName, email: userEmail, role: userRole })
    setAddingUser(false)
    if (!result.error) {
      setShowAddUser(false)
      setUserName('')
      setUserEmail('')
      window.location.reload()
    }
  }

  async function handleToggleUser(userId: string, currentActive: boolean) {
    await toggleClientUser({ userId, active: !currentActive })
    window.location.reload()
  }

  const tabs = [
    { key: 'candidates', label: `Candidates (${candidates.length})` },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'settings', label: 'Settings' },
  ] as const

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl text-navy">{client.name}</h1>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${client.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {client.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Stats + Info */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Screenings', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Completed', value: stats.completed },
          { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-[11px] uppercase tracking-wider">{s.label}</p>
            <p className="font-heading text-2xl text-navy mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><span className="text-xs text-gray-500 block">Contact</span>{client.contact_name || '—'}</div>
          <div><span className="text-xs text-gray-500 block">Email</span>{client.contact_email || '—'}</div>
          <div><span className="text-xs text-gray-500 block">Phone</span>{client.contact_phone || '—'}</div>
          <div><span className="text-xs text-gray-500 block">Portal</span><span className="font-mono text-xs text-gold">/{client.slug}</span></div>
          {client.website && <div><span className="text-xs text-gray-500 block">Website</span>{client.website}</div>}
          {client.address && <div><span className="text-xs text-gray-500 block">Address</span>{client.address}{client.city && `, ${client.city}`}{client.state && `, ${client.state}`} {client.zip}</div>}
        </div>
        {(client.packages ?? []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Packages</p>
            <div className="flex flex-wrap gap-2">
              {(client.packages ?? []).map((pkg: any, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gold-pale text-navy font-medium">
                  {pkg.name} · ${pkg.price}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Candidates Tab */}
      {tab === 'candidates' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {candidates.map((c: any) => (
                <tr key={c.id} onClick={() => router.push(`/admin/candidates/${c.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.package_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.payment_status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidates.length === 0 && <div className="text-center py-8 text-sm text-gray-400">No candidates for this client yet.</div>}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAddUser(!showAddUser)} className="inline-flex items-center gap-1.5 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add User
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={addingUser} className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50">
                {addingUser ? 'Adding...' : 'Send Invite'}
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  <span className={`text-xs ${u.active ? 'text-green-600' : 'text-gray-400'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => handleToggleUser(u.id, u.active)} className="text-xs text-gray-400 hover:text-navy transition-colors">
                    {u.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-center py-8 text-sm text-gray-400">No users yet.</div>}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <ClientSettingsForm client={client} />
      )}
    </div>
  )
}
