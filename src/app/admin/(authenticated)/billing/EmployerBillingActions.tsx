'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markCandidatesInvoiced, markCandidatesPaid } from '@/app/admin/actions/billing'

export default function EmployerBillingActions({
  billedIds,
  invoicedIds,
  clientName,
}: {
  billedIds: string[]
  invoicedIds: string[]
  clientName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const canInvoice = billedIds.length > 0
  const canMarkPaid = billedIds.length + invoicedIds.length > 0

  function invoice() {
    if (!canInvoice) return
    if (!confirm(`Mark ${billedIds.length} screening(s) for ${clientName} as invoiced?`)) return
    startTransition(async () => {
      const res = await markCandidatesInvoiced({ candidateIds: billedIds })
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  function pay() {
    if (!canMarkPaid) return
    const total = billedIds.length + invoicedIds.length
    if (!confirm(`Mark ${total} screening(s) for ${clientName} as paid?`)) return
    startTransition(async () => {
      const res = await markCandidatesPaid({
        candidateIds: [...billedIds, ...invoicedIds],
      })
      if (res.error) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  if (!canInvoice && !canMarkPaid) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={invoice}
        disabled={!canInvoice || pending}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-navy/20 text-navy hover:bg-navy/5 transition-colors disabled:opacity-40"
      >
        Mark invoiced
      </button>
      <button
        onClick={pay}
        disabled={!canMarkPaid || pending}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-40"
      >
        Mark paid
      </button>
    </div>
  )
}
