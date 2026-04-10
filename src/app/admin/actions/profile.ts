'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Update the currently signed-in admin's own profile (name + email).
 *
 * Syncs both the admin_users row and the underlying Supabase auth user.
 * Changing email requires the user to sign in again with the new address;
 * we email_confirm immediately so there's no verification email loop.
 */
export async function updateOwnAdminProfile({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const trimmedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (!trimmedName) return { error: 'Name is required.' }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: 'A valid email is required.' }
  }

  const emailChanged = normalizedEmail !== admin.email?.toLowerCase()

  // Update auth.users email first — if this fails (e.g. email already in use),
  // we want to bail before touching admin_users.
  if (emailChanged && admin.auth_user_id) {
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      admin.auth_user_id,
      { email: normalizedEmail, email_confirm: true }
    )
    if (authErr) {
      const msg = authErr.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        return { error: 'That email is already in use by another account.' }
      }
      return { error: `Failed to update auth email: ${authErr.message}` }
    }
  }

  const { error: updateErr } = await supabase
    .from('admin_users')
    .update({ name: trimmedName, email: normalizedEmail })
    .eq('id', admin.id)

  if (updateErr) {
    return { error: `Failed to update profile: ${updateErr.message}` }
  }

  revalidatePath('/admin/settings')
  return { emailChanged }
}

/**
 * Update the currently signed-in admin's password.
 *
 * Uses the Supabase admin API so no current password check is performed;
 * the session itself is the proof. Requires min 8 characters.
 */
export async function updateOwnAdminPassword({ password }: { password: string }) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (!admin.auth_user_id) {
    return { error: 'No auth user linked to this admin record.' }
  }

  const { error } = await supabase.auth.admin.updateUserById(admin.auth_user_id, {
    password,
  })

  if (error) return { error: `Failed to update password: ${error.message}` }

  return {}
}
