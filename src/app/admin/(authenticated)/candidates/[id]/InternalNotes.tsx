'use client'

import { useState } from 'react'
import { updateInternalNotes } from '@/app/admin/actions/candidates'

export default function InternalNotes({
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
    const result = await updateInternalNotes({ candidateId, notes })
    setSaving(false)

    if (!result.error) {
      setSaved(true)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Internal Notes</h2>
        {!saved && (
          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Unsaved</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Add internal notes about this candidate (only visible to admins)..."
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-gray-400">Only visible to PCG admins</p>
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
