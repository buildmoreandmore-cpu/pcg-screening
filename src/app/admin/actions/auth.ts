'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export async function adminSignOut() {
  const supabase = createAdminClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
