'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminSignOut() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Delete all Supabase auth cookies
  for (const cookie of allCookies) {
    if (cookie.name.includes('auth-token')) {
      cookieStore.delete(cookie.name)
    }
  }

  redirect('/portal/login')
}
