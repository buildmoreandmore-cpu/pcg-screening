'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function SetupPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Confirm we have an active session — if a user lands here without going
  // through the magic link, bounce them to the login page.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace('/portal/login?error=session_required')
        return
      }
      setAuthedEmail(data.user.email ?? null)
      setChecking(false)
    })
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
        <p className="text-sm text-gray-500">Verifying your invite…</p>
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
          <h1 className="font-heading text-2xl text-navy">Set Your Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            One last step before you access your dashboard.
          </p>
          {authedEmail && (
            <p className="text-gray-400 text-xs mt-1">Signed in as {authedEmail}</p>
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
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can change your password later in Portal Settings.
        </p>
      </div>
    </div>
  )
}
