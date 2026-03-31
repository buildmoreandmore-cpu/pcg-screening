'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function uploadDocument(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const file = formData.get('file') as File
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string

  if (!file || !name) return { error: 'Name and file are required' }

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${file.name}`
  const path = `documents/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('compliance-documents')
    .upload(path, file)

  if (uploadError) return { error: 'Upload failed' }

  const { data: urlData } = supabase.storage
    .from('compliance-documents')
    .getPublicUrl(path)

  const { error: insertError } = await supabase.from('compliance_documents').insert({
    name,
    description: description || null,
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_type: ext || 'pdf',
    file_size: file.size,
    category: category || 'compliance',
  })

  if (insertError) return { error: 'Failed to save document record' }

  return {}
}

export async function deleteDocument(documentId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('compliance_documents')
    .delete()
    .eq('id', documentId)

  return { error: error?.message }
}
