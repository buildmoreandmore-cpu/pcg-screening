import { NextRequest, NextResponse } from 'next/server'
import { createCredentialingAdminClient } from '@/lib/supabase-credentialing'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('document_type') as string | null
    const sessionId = formData.get('session_id') as string | null

    if (!file || !documentType || !sessionId) {
      return NextResponse.json({ error: 'File, document_type, and session_id are required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Accepted: PDF, JPG, PNG, DOC, DOCX' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const supabase = createCredentialingAdminClient()

    // Ensure bucket exists
    await supabase.storage.createBucket('credentialing-docs', { public: false }).catch(() => {})

    // Upload file
    const ext = file.name.split('.').pop() || 'pdf'
    const storagePath = `${sessionId}/${documentType}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('credentialing-docs')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('credentialing-docs')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1 year

    const fileUrl = urlData?.signedUrl || ''

    // Insert document record (provider_id will be updated on submission)
    const { data: doc, error: docError } = await supabase
      .from('provider_documents')
      .insert({
        provider_id: null, // Will be linked on form submission
        document_type: documentType,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select('id')
      .single()

    if (docError) {
      console.error('Document record error:', docError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: file.name,
      fileSize: file.size,
      fileUrl,
    })
  } catch (error) {
    console.error('Credentialing upload error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
