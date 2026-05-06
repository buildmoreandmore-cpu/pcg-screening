'use client'

import { useState } from 'react'
import { saveScreeningResults } from '@/app/admin/actions/report'
import type { ScreeningResults, ResultVerdict } from '@/lib/report-types'

const VERDICTS: { value: ResultVerdict; label: string; color: string }[] = [
  { value: 'clear', label: 'Clear', color: 'text-green-600' },
  { value: 'record_found', label: 'Record Found', color: 'text-amber-600' },
  { value: 'adverse', label: 'Adverse', color: 'text-red-600' },
  { value: 'not_applicable', label: 'N/A', color: 'text-gray-400' },
]

export default function ResultsEntryForm({
  candidateId,
  components,
  initialResults,
  onSaved,
  onResultsChange,
}: {
  candidateId: string
  components: Array<{ key: string; label: string }>
  initialResults: ScreeningResults
  onSaved?: () => void
  onResultsChange?: (results: ScreeningResults) => void
}) {
  const [results, setResults] = useState<ScreeningResults>(() => {
    const r: ScreeningResults = {}
    for (const { key } of components) {
      r[key] = initialResults[key] || { result: 'not_applicable', details: '' }
    }
    return r
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateResult(key: string, field: 'result' | 'details', value: string) {
    setResults(prev => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } }
      onResultsChange?.(next)
      return next
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await saveScreeningResults(candidateId, results)
    setSaving(false)
    if (!res.error) {
      setSaved(true)
      onSaved?.()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-navy">Step 1: Screening Results</h2>
          <p className="text-xs text-gray-400 mt-0.5">Enter the result and details for each screening component.</p>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const filled = components.filter((c) => results[c.key]?.result && results[c.key].result !== 'not_applicable').length
            const total = components.length
            const complete = filled === total && total > 0
            return (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                  complete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {complete ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
                {filled} of {total} entered
              </span>
            )
          })()}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {components.map(({ key, label }) => (
          <div key={key} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <select
                value={results[key]?.result || 'not_applicable'}
                onChange={(e) => updateResult(key, 'result', e.target.value)}
                className={`text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ${
                  VERDICTS.find(v => v.value === results[key]?.result)?.color || ''
                }`}
              >
                {VERDICTS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={results[key]?.details || ''}
              onChange={(e) => updateResult(key, 'details', e.target.value)}
              placeholder="Details, notes, or findings..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Results'}
      </button>
    </div>
  )
}
