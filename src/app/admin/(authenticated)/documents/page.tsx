'use client'

import { useState, useEffect, useRef } from 'react'
import { uploadDocument, deleteDocument } from '@/app/admin/actions/documents'

type Doc = {
  id: string
  name: string
  description: string | null
  file_url: string
  file_name: string
  file_type: string
  file_size: number | null
  category: string
  updated_at: string
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('compliance')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    const res = await fetch('/api/admin/documents')
    if (res.ok) {
      const data = await res.json()
      setDocs(data)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !name) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    formData.append('description', description)
    formData.append('category', category)

    const result = await uploadDocument(formData)
    setUploading(false)

    if (!result.error) {
      setShowUpload(false)
      setName('')
      setDescription('')
      fetchDocs()
    }
  }

  async function handleDelete(id: string, docName: string) {
    if (!confirm(`Delete "${docName}"?`)) return
    await deleteDocument(id)
    fetchDocs()
  }

  const categoryLabels: Record<string, string> = {
    compliance: 'Compliance',
    fcra: 'FCRA',
    jurisdiction: 'Jurisdiction',
    general: 'General',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">Documents</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Document Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="compliance">Compliance</option>
                <option value="fcra">FCRA</option>
                <option value="jurisdiction">Jurisdiction Info</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">File *</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xlsx" required
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Documents Grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {docs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-red-600 uppercase">{doc.file_type || 'PDF'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
              {doc.description && <p className="text-xs text-gray-500 truncate">{doc.description}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400 uppercase">{categoryLabels[doc.category] || doc.category}</span>
                {doc.file_size && <span className="text-[10px] text-gray-400">{(doc.file_size / 1024).toFixed(0)}KB</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:text-gold-light transition-colors p-1">Download</a>
              <button onClick={() => handleDelete(doc.id, doc.name)} className="text-xs text-gray-400 hover:text-red-500 transition-colors p-1">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {docs.length === 0 && !showUpload && (
        <div className="text-center py-16 text-sm text-gray-400">No documents uploaded yet.</div>
      )}
    </div>
  )
}
