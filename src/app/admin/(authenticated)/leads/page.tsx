import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import LeadsInbox from './LeadsInbox'

export default async function AdminLeadsPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: leads } = await supabase
    .from('lead_requests')
    .select('id, name, company, email, phone, type, message, status, source, created_at, contacted_at, closed_at, notes')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">
          New requests from the marketing site. Mark as contacted once you&apos;ve reached out.
        </p>
      </div>
      <LeadsInbox initialLeads={leads ?? []} />
    </div>
  )
}
