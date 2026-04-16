'use client'

import { useState } from 'react'
import { updateClientNotes } from '@/app/admin/actions/candidates'

export default function ClientNotes({
  candidateId,
  initialNotes,
}: {
  candidateId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateClientNotes({ candidateId, notes })
    setSaving(false)

    if (!result.error) {
      setSaved(true)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gold">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-medium text-gray-700">Client Notes</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Visible to the employer on their portal</p>
        </div>
        {!saved && (
          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Unsaved</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Add notes visible to the client (e.g., delays, candidate not responding to consent or drug screen)..."
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-[11px] text-gold font-medium">Employer can see these notes</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="bg-navy text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}
