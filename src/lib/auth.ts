import { redirect } from 'next/navigation'
import { createClient } from './supabase-server'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getClientUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: clientUser } = await supabase
    .from('client_users')
    .select('*, client:clients(*)')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single()

  return clientUser
}

export async function requireAuth() {
  const clientUser = await getClientUser()

  if (!clientUser) {
    redirect('/portal/login')
  }

  return clientUser
}

export async function requireAdmin() {
  const clientUser = await requireAuth()

  if (clientUser.role !== 'admin') {
    redirect('/portal/dashboard')
  }

  return clientUser
}
