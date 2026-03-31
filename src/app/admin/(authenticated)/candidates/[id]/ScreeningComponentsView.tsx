'use client'

import { useState } from 'react'
import ScreeningSelector from '@/components/screening/ScreeningSelector'
import ScreeningSummary from '@/components/screening/ScreeningSummary'
import type { ScreeningSelections } from '@/components/screening/screening-types'
import { updateScreeningComponents } from '@/app/admin/actions/candidates'

export default function ScreeningComponentsView({
  candidateId,
  components,
}: {
  candidateId: string
  components: ScreeningSelections
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selections, setSelections] = useState<ScreeningSelections>(components)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateScreeningComponents(candidateId, selections)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Screening Components (Custom)</h2>
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setSelections(components) }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs text-white bg-navy hover:bg-navy-light px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {!expanded ? (
        <ScreeningSummary selections={selections} onViewDetails={() => setExpanded(true)} />
      ) : (
        <>
          <ScreeningSelector
            mode={editing ? 'edit' : 'view'}
            initialSelections={selections}
            onChange={setSelections}
            onEdit={() => setEditing(true)}
          />
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-500 hover:text-gray-700 mt-3"
          >
            Collapse
          </button>
        </>
      )}
    </div>
  )
}
