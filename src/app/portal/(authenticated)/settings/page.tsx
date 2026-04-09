'use client'

import { useState } from 'react'
import { usePortal } from '@/components/portal/PortalContext'
import { updatePreferences, changePasswordAction } from '@/app/portal/actions/settings'
import { signOut } from '@/app/portal/actions/auth'

export default function SettingsPage() {
  const { user, client } = usePortal()
  const [name, setName] = useState(user.name)
  const [notifyComplete, setNotifyComplete] = useState(true)
  const [notifySubmitted, setNotifySubmitted] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updatePreferences({ name })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    setPwSaving(true)
    const result = await changePasswordAction({ currentPassword, newPassword })
    setPwSaving(false)
    if (result.error) {
      setPwError(result.error)
      return
    }
    setPwSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwSuccess(false), 3000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-xl text-navy">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Profile</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <p className="px-3.5 py-2.5 rounded-lg bg-gray-50 text-sm text-gray-500">{user.email}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company</label>
          <p className="px-3.5 py-2.5 rounded-lg bg-gray-50 text-sm text-gray-500">{client.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Account Security */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Account Security</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
          <p className="text-[11px] text-gray-400 mt-1">At least 8 characters</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-green-600">Password updated successfully</p>}
        <button
          type="submit"
          disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {pwSaving ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Notifications</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Email when a screening is completed</span>
          <div
            onClick={() => setNotifyComplete(!notifyComplete)}
            className={`w-10 h-6 rounded-full relative transition-colors ${
              notifyComplete ? 'bg-gold' : 'bg-gray-200'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              notifyComplete ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Email when a candidate is submitted</span>
          <div
            onClick={() => setNotifySubmitted(!notifySubmitted)}
            className={`w-10 h-6 rounded-full relative transition-colors ${
              notifySubmitted ? 'bg-gold' : 'bg-gray-200'
            }`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
              notifySubmitted ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
        </label>
      </div>

      {/* Log Out */}
      <button
        onClick={() => signOut()}
        className="w-full text-center py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </div>
  )
}
