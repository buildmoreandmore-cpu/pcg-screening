'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function updateLeadStatus({
  leadId,
  status,
  notes,
}: {
  leadId: string
  status: 'new' | 'contacted' | 'closed'
  notes?: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const patch: Record<string, any> = { status }
  if (status === 'contacted') patch.contacted_at = new Date().toISOString()
  if (status === 'closed') patch.closed_at = new Date().toISOString()
  if (typeof notes === 'string') patch.notes = notes

  const { error } = await supabase.from('lead_requests').update(patch).eq('id', leadId)
  if (error) return { error: error.message }

  revalidatePath('/admin/leads')
  return {}
}
