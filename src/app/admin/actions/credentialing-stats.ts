'use server'

import { createCredentialingClient } from '@/lib/supabase-credentialing'

export type CredentialingStats = {
  total: number
  intake: number
  inProgress: number
  approved: number
  recentProviders: {
    id: string
    first_name: string
    last_name: string
    specialty: string
    status: string
    created_at: string
  }[]
}

export async function getCredentialingStats(): Promise<CredentialingStats | null> {
  try {
    const supabase = createCredentialingClient()

    const [totalRes, intakeRes, inProgressRes, approvedRes, recentRes] = await Promise.all([
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'intake_received'),
      supabase.from('providers').select('id', { count: 'exact', head: true }).in('status', ['primary_source_verification', 'committee_review']),
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('providers').select('id, first_name, last_name, specialty, status, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    return {
      total: totalRes.count ?? 0,
      intake: intakeRes.count ?? 0,
      inProgress: inProgressRes.count ?? 0,
      approved: approvedRes.count ?? 0,
      recentProviders: recentRes.data ?? [],
    }
  } catch (err) {
    console.error('Failed to fetch credentialing stats:', err)
    return null
  }
}
