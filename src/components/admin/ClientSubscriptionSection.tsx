'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SUBSCRIPTION_TIERS, tierLabel } from '@/lib/subscriptions'
import { updateClientSubscription } from '@/app/admin/actions/clients'

export default function ClientSubscriptionSection({
  clientId,
  initialTier,
  initialMonthlyLimit,
  initialOveragePriceCents,
  initialAllowOverage,
  initialCreditsUsed,
  initialPeriodStart,
}: {
  clientId: string
  initialTier: string | null
  initialMonthlyLimit: number | null
  initialOveragePriceCents: number | null
  initialAllowOverage: boolean
  initialCreditsUsed: number
  initialPeriodStart: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tier, setTier] = useState<string | null>(initialTier)
  const [monthlyLimit, setMonthlyLimit] = useState<string>(
    initialMonthlyLimit?.toString() || ''
  )
  const [overageDollars, setOverageDollars] = useState<string>(
    initialOveragePriceCents ? (initialOveragePriceCents / 100).toString() : ''
  )
  const [allowOverage, setAllowOverage] = useState(initialAllowOverage)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function pickTier(key: string) {
    const tierDef = SUBSCRIPTION_TIERS.find((t) => t.key === key)
    setTier(key)
    if (tierDef) {
      // Pre-fill defaults if blank — admin can override.
      if (!monthlyLimit) setMonthlyLimit(tierDef.defaultMonthlyLimit.toString())
      if (!overageDollars) setOverageDollars((tierDef.defaultOveragePriceCents / 100).toString())
    }
  }

  function clearTier() {
    setTier(null)
    setMonthlyLimit('')
    setOverageDollars('')
    setAllowOverage(false)
  }

  async function handleSave() {
    setError('')
    setSaved(false)
    const result = await updateClientSubscription({
      clientId,
      tier,
      monthlyLimit: tier ? Number(monthlyLimit || 0) : null,
      overagePriceCents: tier ? Math.round(Number(overageDollars || 0) * 100) : null,
      allowOverage: tier ? allowOverage : false,
    })
    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    startTransition(() => router.refresh())
    setTimeout(() => setSaved(false), 2500)
  }

  const used = initialCreditsUsed
  const limit = Number(monthlyLimit || 0)
  const remaining = Math.max(0, limit - used)
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const overLimit = limit > 0 && used >= limit

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700">Subscription</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Set a monthly screening allotment. Leave on Per-run for pay-as-you-go.
        </p>
      </div>

      {/* Tier picker */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={clearTier}
          className={`py-3 px-3 rounded-xl text-center border-2 transition-all ${
            !tier
              ? 'border-navy bg-navy/[0.03]'
              : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <p className={`text-sm font-semibold ${!tier ? 'text-navy' : 'text-gray-600'}`}>Per-run</p>
          <p className="text-xs text-gray-400 mt-0.5">Pay per screening</p>
        </button>
        {SUBSCRIPTION_TIERS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => pickTier(t.key)}
            className={`py-3 px-3 rounded-xl text-center border-2 transition-all ${
              tier === t.key
                ? 'border-navy bg-navy/[0.03]'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className={`text-sm font-semibold ${tier === t.key ? 'text-navy' : 'text-gray-600'}`}>
              {t.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      {tier && (
        <>
          {/* Limits + overage */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monthly limit (screenings)</label>
              <input
                type="number"
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overage price per screening (USD)</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-400 mr-1">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overageDollars}
                  onChange={(e) => setOverageDollars(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowOverage}
              onChange={(e) => setAllowOverage(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy focus:ring-gold"
            />
            <div>
              <p className="text-sm text-gray-700">Allow overage charges</p>
              <p className="text-[11px] text-gray-500">
                When the monthly limit is hit, additional screenings are billed at the overage price.
                If unchecked, new orders are blocked until the next reset.
              </p>
            </div>
          </label>

          {/* Usage meter */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
              <span>
                <span className={`font-semibold ${overLimit ? 'text-red-600' : 'text-navy'}`}>
                  {used}
                </span>{' '}
                of {limit} screenings used this period
              </span>
              {initialPeriodStart && (
                <span className="text-gray-400">Period: {initialPeriodStart}</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full transition-all ${overLimit ? 'bg-red-500' : 'bg-gold'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {overLimit && !allowOverage && (
              <p className="text-xs text-red-600 mt-1.5">
                Limit reached. New orders will be refused until reset (unless overage is enabled).
              </p>
            )}
            {overLimit && allowOverage && (
              <p className="text-xs text-amber-700 mt-1.5">
                Over allotment — additional screenings billed at overage price.
              </p>
            )}
            {!overLimit && limit > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">{remaining} remaining this period</p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div>
          {saved && <span className="text-xs text-green-600">Saved</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving...' : `Save ${tierLabel(tier)} settings`}
        </button>
      </div>
    </div>
  )
}
