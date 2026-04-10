'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

type PackagePayload = {
  name: string
  priceCents: number
  description?: string
  components: Record<string, boolean>
  customNotes?: string
  sortOrder?: number
}

export async function createClientPackage({
  clientId,
  name,
  priceCents,
  description,
  components,
  customNotes,
  sortOrder,
}: PackagePayload & { clientId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('client_packages')
    .insert({
      client_id: clientId,
      name,
      price_cents: priceCents,
      description: description || null,
      components: components || {},
      custom_notes: customNotes || null,
      sort_order: sortOrder ?? 0,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/admin/clients/${clientId}`)
  return { id: data.id }
}

export async function updateClientPackage({
  packageId,
  clientId,
  name,
  priceCents,
  description,
  components,
  customNotes,
}: PackagePayload & { packageId: string; clientId: string }) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('client_packages')
    .update({
      name,
      price_cents: priceCents,
      description: description || null,
      components: components || {},
      custom_notes: customNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packageId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clients/${clientId}`)
  return {}
}

export async function deleteClientPackage({
  packageId,
  clientId,
}: {
  packageId: string
  clientId: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Soft-delete so historical candidates that referenced this package keep
  // a name to display.
  const { error } = await supabase
    .from('client_packages')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', packageId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clients/${clientId}`)
  return {}
}
