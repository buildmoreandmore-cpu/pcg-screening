import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import TeamManager from './TeamManager'

export default async function TeamPage() {
  const clientUser = await requireAuth()

  // Only admins can access team management
  if (clientUser.role !== 'admin') {
    redirect('/portal/dashboard')
  }

  const supabase = await createClient()

  const { data: members } = await supabase
    .from('client_users')
    .select('id, name, email, role, active, created_at')
    .eq('client_id', clientUser.client_id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  return <TeamManager members={members ?? []} currentUserId={clientUser.id} />
}
