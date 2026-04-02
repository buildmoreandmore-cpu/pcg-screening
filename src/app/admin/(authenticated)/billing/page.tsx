import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

function getMonthRange(offset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    dueDate: new Date(now.getFullYear(), now.getMonth() + offset + 1, 30).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const params = await searchParams
  const monthOffset = parseInt(params.month || '0', 10)
  const month = getMonthRange(monthOffset)

  // Get all candidates for this month
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, client_id, client_slug, package_name, package_price, payment_status, status, first_name, last_name, created_at, client:clients(id, name)')
    .gte('created_at', month.start)
    .lte('created_at', month.end)
    .order('created_at', { ascending: false })

  // Get all clients for reference
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, slug')
    .eq('active', true)
    .order('name')

  // Group by client
  const byClient: Record<string, { client: any; candidates: any[]; total: number; paid: number; pending: number }> = {}

  for (const c of candidates ?? []) {
    const clientId = c.client_id
    if (!byClient[clientId]) {
      byClient[clientId] = {
        client: c.client || { id: clientId, name: c.client_slug },
        candidates: [],
        total: 0,
        paid: 0,
        pending: 0,
      }
    }
    byClient[clientId].candidates.push(c)
    const price = Number(c.package_price || 0)
    byClient[clientId].total += price
    if (c.payment_status === 'paid') {
      byClient[clientId].paid += price
    } else {
      byClient[clientId].pending += price
    }
  }

  const clientEntries = Object.values(byClient).sort((a, b) => b.total - a.total)
  const grandTotal = clientEntries.reduce((s, e) => s + e.total, 0)
  const grandPaid = clientEntries.reduce((s, e) => s + e.paid, 0)
  const grandPending = clientEntries.reduce((s, e) => s + e.pending, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">Billing</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/billing?month=${monthOffset - 1}`}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 border border-gray-200"
          >
            &larr;
          </Link>
          <span className="text-sm font-medium text-navy min-w-[140px] text-center">{month.label}</span>
          <Link
            href={`/admin/billing?month=${monthOffset + 1}`}
            className={`px-3 py-1.5 rounded-lg text-sm border border-gray-200 ${
              monthOffset >= 0 ? 'text-gray-300 pointer-events-none' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            &rarr;
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[11px] uppercase tracking-wider">Total Revenue</p>
          <p className="font-heading text-2xl text-navy mt-1">${grandTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[11px] uppercase tracking-wider">Collected</p>
          <p className="font-heading text-2xl text-green-600 mt-1">${grandPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[11px] uppercase tracking-wider">Outstanding (Net 30)</p>
          <p className="font-heading text-2xl text-amber-600 mt-1">${grandPending.toLocaleString()}</p>
          {grandPending > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Due by {month.dueDate}</p>
          )}
        </div>
      </div>

      {/* Per-Client Breakdown */}
      <div className="space-y-4">
        {clientEntries.map((entry) => (
          <div key={entry.client.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Client Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Link href={`/admin/clients/${entry.client.id}`} className="text-sm font-medium text-navy hover:text-gold transition-colors">
                  {entry.client.name}
                </Link>
                <span className="text-xs text-gray-400">{entry.candidates.length} screening{entry.candidates.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">${entry.paid.toLocaleString()} paid</span>
                {entry.pending > 0 && (
                  <span className="text-amber-600 font-medium">${entry.pending.toLocaleString()} pending</span>
                )}
                <span className="font-heading text-navy">${entry.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-2 text-[11px] font-medium text-gray-400 uppercase">Candidate</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-gray-400 uppercase">Package</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-gray-400 uppercase">Payment</th>
                  <th className="text-right px-5 py-2 text-[11px] font-medium text-gray-400 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entry.candidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <Link href={`/admin/candidates/${c.id}`} className="text-sm text-gray-900 hover:text-gold transition-colors">
                        {c.first_name} {c.last_name}
                      </Link>
                      <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700">{c.package_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        c.status === 'completed' ? 'bg-green-50 text-green-700' :
                        c.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                        c.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        c.payment_status === 'paid' ? 'bg-green-50 text-green-700' :
                        c.payment_status === 'refunded' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {c.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-sm text-right font-medium text-gray-900">${Number(c.package_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={4} className="px-5 py-2.5 text-sm text-gray-500 font-medium text-right">Total</td>
                  <td className="px-5 py-2.5 text-sm text-right font-heading text-navy">${entry.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        {clientEntries.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm text-center py-12">
            <p className="text-sm text-gray-400">No billing activity for {month.label}</p>
          </div>
        )}
      </div>
    </div>
  )
}
