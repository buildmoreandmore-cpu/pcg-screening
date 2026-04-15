'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // We arrive here from /portal/auth/confirm?type=recovery, which passes
  // session tokens as URL hash fragments. Parse them and establish the session.
  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // Pick up session tokens from URL hash (set by auth/confirm redirect)
      const hash = window.location.hash.substring(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        router.replace('/portal/login?error=link_expired')
        return
      }
      setAuthedEmail(data.user.email ?? null)
      setChecking(false)
    }
    init()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    router.replace('/portal/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-dvh bg-off-white flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Verifying your reset link…</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-off-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
            alt="PCG Screening Services"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="font-heading text-2xl text-navy">Choose a New Password</h1>
          {authedEmail && (
            <p className="text-gray-400 text-xs mt-1">Resetting password for {authedEmail}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              autoFocus
            />

            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5 mt-3">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
            />

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Update Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
