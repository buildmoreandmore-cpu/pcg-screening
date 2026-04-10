'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { requestPasswordReset } from '@/app/portal/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await requestPasswordReset({ email })
      if (result?.error) {
        setError(result.error)
        return
      }
      setSent(true)
    })
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
          <h1 className="font-heading text-2xl text-navy">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            We&apos;ll email you a secure link to choose a new password.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gold-pale rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-heading text-lg text-navy mb-2">Check Your Email</h2>
              <p className="text-gray-500 text-sm">
                If an account exists for <strong className="text-gray-700">{email}</strong>, a password reset link is on its way. The link expires in 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                disabled={pending}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                autoFocus
              />

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full mt-4 bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <Link
          href="/portal/login"
          className="block w-full text-center text-xs text-gray-500 mt-4 hover:text-gold transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
