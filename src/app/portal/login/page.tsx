'use client'

import Link from 'next/link'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const URL_ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Your reset link has expired. Please request a new one below.',
  missing_token: 'Invalid reset link. Please request a new one below.',
  session_required: 'Your invite link has expired. Please contact your administrator to resend it.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError && URL_ERROR_MESSAGES[urlError]) {
      setError(URL_ERROR_MESSAGES[urlError])
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(`Login failed: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Login succeeded but no session returned.')
        setLoading(false)
        return
      }

      // Check user type and redirect accordingly
      const res = await fetch('/api/auth/user-type')
      const { type } = await res.json()

      if (type === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (type === 'employer') {
        window.location.href = '/portal/dashboard'
      } else {
        setError('Your account is not linked to any organization. Contact support.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(`Error: ${err?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-4" aria-label="Back to home">
          <img
            src="/Copy_of_PCG_Logo_with_Soft_Typography.png"
            alt="PCG Screening Services"
            className="h-16 mx-auto"
          />
        </Link>
        <h1 className="font-heading text-2xl text-navy">Sign In</h1>
        <p className="text-gray-500 text-sm mt-1">PCG Screening Services</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleLogin}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
            autoFocus
          />

          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 mt-3">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
          />

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
              <p className="text-red-700 text-sm">{error}</p>
              {(searchParams.get('error') === 'link_expired' || searchParams.get('error') === 'session_required') && (
                <Link href="/portal/forgot-password" className="text-xs text-red-600 underline hover:text-red-800 mt-1 inline-block">
                  Request a new reset link
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-3">
            <Link
              href="/portal/forgot-password"
              className="text-xs text-gray-500 hover:text-gold transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-off-white flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
