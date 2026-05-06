/**
 * Subscription tier definitions for the Fusion / Fusion Pro model.
 *
 * Clients can be on per-run pricing (no subscription_tier) OR on one of
 * the named tiers below. When on a tier, each candidate they screen
 * decrements `credits_used`. When `credits_used >= monthly_credit_limit`
 * we either charge overage (if `allow_overage`) or refuse the order.
 *
 * Period is a calendar month — reset happens on the 1st via the cron at
 * /api/cron/reset-credits.
 */

export const SUBSCRIPTION_TIERS = [
  {
    key: 'fusion',
    label: 'Fusion',
    defaultMonthlyLimit: 10,
    defaultOveragePriceCents: 4500,
    description: '10 screenings / month included',
  },
  {
    key: 'fusion_pro',
    label: 'Fusion Pro',
    defaultMonthlyLimit: 50,
    defaultOveragePriceCents: 3500,
    description: '50 screenings / month included',
  },
] as const

export type SubscriptionTierKey = typeof SUBSCRIPTION_TIERS[number]['key']

export type ClientSubscription = {
  subscription_tier: string | null
  monthly_credit_limit: number | null
  credits_used: number
  period_start: string | null
  overage_price_cents: number | null
  allow_overage: boolean
}

export type CreditCheckResult =
  | { ok: true; remaining: number; usedFromAllotment: true }
  | { ok: true; remaining: 0; usedFromAllotment: false; overageCents: number }
  | { ok: false; reason: 'limit_reached_no_overage'; limit: number }

/**
 * Decide what happens when a candidate is being created for this client.
 *
 * - No tier: pass through (per-run billing unaffected).
 * - Within allotment: increment credits, no Stripe charge needed.
 * - Over allotment with overage allowed: bill at overage rate.
 * - Over allotment with no overage: refuse.
 */
export function evaluateCreditCheck(sub: ClientSubscription): CreditCheckResult {
  if (!sub.subscription_tier || !sub.monthly_credit_limit) {
    // Not on a subscription — caller handles normal per-run billing.
    return { ok: true, remaining: 0, usedFromAllotment: false, overageCents: 0 }
  }

  const remaining = Math.max(0, sub.monthly_credit_limit - sub.credits_used)

  if (remaining > 0) {
    return { ok: true, remaining, usedFromAllotment: true }
  }

  if (sub.allow_overage && sub.overage_price_cents) {
    return {
      ok: true,
      remaining: 0,
      usedFromAllotment: false,
      overageCents: sub.overage_price_cents,
    }
  }

  return {
    ok: false,
    reason: 'limit_reached_no_overage',
    limit: sub.monthly_credit_limit,
  }
}

export function tierLabel(key: string | null | undefined): string {
  if (!key) return 'Per-run'
  return SUBSCRIPTION_TIERS.find((t) => t.key === key)?.label || key
}
