import { createClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

const categoryLabels: Record<string, string> = {
  compliance: 'Compliance',
  fcra: 'FCRA',
  jurisdiction: 'Jurisdiction Info',
  general: 'General',
}

const typeIcons: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  doc: 'DOC',
  xlsx: 'XLSX',
}

export default async function ResourcesPage() {
  await requireAuth()
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('compliance_documents')
    .select('*')
    .order('category')
    .order('name')

  const docs = documents ?? []

  // Group by category
  const grouped: Record<string, typeof docs> = {}
  docs.forEach((doc) => {
    const cat = doc.category || 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(doc)
  })

  if (docs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-xl text-navy">Resources</h1>
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No documents available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl text-navy">Resources</h1>

      {Object.entries(grouped).map(([category, categoryDocs]) => (
        <div key={category}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            {categoryLabels[category] || category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {categoryDocs.map((doc: any) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow flex items-start gap-3 group"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-red-600 uppercase">
                    {typeIcons[doc.file_type] || doc.file_type?.toUpperCase() || 'PDF'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-navy transition-colors">
                    {doc.name}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
