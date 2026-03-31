'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = createAdminClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}
