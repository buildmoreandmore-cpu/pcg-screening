import { redirect } from 'next/navigation'
import { createClient } from './supabase-server'

export async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single()

  return adminUser
}

export async function requireAdmin() {
  const admin = await getAdminUser()

  if (!admin) {
    redirect('/admin/login')
  }

  return admin
}

export async function requireOwner() {
  const admin = await requireAdmin()

  if (admin.role !== 'owner') {
    redirect('/admin/dashboard')
  }

  return admin
}
