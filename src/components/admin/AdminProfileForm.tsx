'use client'

import { useState, useTransition } from 'react'
import {
  updateOwnAdminProfile,
  updateOwnAdminPassword,
} from '@/app/admin/actions/profile'

export default function AdminProfileForm({
  initialName,
  initialEmail,
  role,
}: {
  initialName: string
  initialEmail: string
  role: string
}) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profilePending, startProfile] = useTransition()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwPending, startPw] = useTransition()

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    startProfile(async () => {
      const result = await updateOwnAdminProfile({ name, email })
      if (result?.error) {
        setProfileMsg({ type: 'err', text: result.error })
      } else {
        setProfileMsg({
          type: 'ok',
          text: result?.emailChanged
            ? 'Profile updated. Sign out and back in with your new email.'
            : 'Profile updated.',
        })
      }
    })
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (password !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' })
      return
    }
    startPw(async () => {
      const result = await updateOwnAdminPassword({ password })
      if (result?.error) {
        setPwMsg({ type: 'err', text: result.error })
      } else {
        setPwMsg({ type: 'ok', text: 'Password updated.' })
        setPassword('')
        setConfirmPassword('')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Profile</h2>
        <span className="text-[11px] uppercase tracking-wider text-gray-400">{role}</span>
      </div>

      {/* Name + Email */}
      <form onSubmit={handleProfileSave} className="space-y-3">
        <div>
          <label htmlFor="admin-name" className="block text-xs text-gray-600 mb-1">
            Name
          </label>
          <input
            id="admin-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            required
          />
        </div>
        <div>
          <label htmlFor="admin-email" className="block text-xs text-gray-600 mb-1">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {profilePending ? 'Saving…' : 'Save Changes'}
          </button>
          {profileMsg && (
            <p
              className={`text-[11px] ${
                profileMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {profileMsg.text}
            </p>
          )}
        </div>
      </form>

      {/* Password */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-xs font-medium text-gray-700 mb-3">Change Password</h3>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label htmlFor="admin-password" className="block text-xs text-gray-600 mb-1">
              New password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="admin-password-confirm" className="block text-xs text-gray-600 mb-1">
              Confirm new password
            </label>
            <input
              id="admin-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwPending || !password}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {pwPending ? 'Updating…' : 'Update Password'}
            </button>
            {pwMsg && (
              <p
                className={`text-[11px] ${
                  pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {pwMsg.text}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
