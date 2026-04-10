'use client'

import { useEffect, useState } from 'react'
import { SCREENING_COMPONENTS } from '@/lib/screening-components'

export type PackageDraft = {
  name: string
  priceCents: number
  description: string
  components: Record<string, boolean>
  customNotes: string
}

export default function PackageComponentsModal({
  open,
  initial,
  title = 'Configure Package',
  onSave,
  onClose,
}: {
  open: boolean
  initial: PackageDraft
  title?: string
  onSave: (draft: PackageDraft) => void | Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [priceDollars, setPriceDollars] = useState(
    initial.priceCents ? (initial.priceCents / 100).toString() : ''
  )
  const [description, setDescription] = useState(initial.description)
  const [components, setComponents] = useState<Record<string, boolean>>(initial.components || {})
  const [customNotes, setCustomNotes] = useState(initial.customNotes)
  const [saving, setSaving] = useState(false)

  // Reset state when re-opened with a different package.
  useEffect(() => {
    if (!open) return
    setName(initial.name)
    setPriceDollars(initial.priceCents ? (initial.priceCents / 100).toString() : '')
    setDescription(initial.description)
    setComponents(initial.components || {})
    setCustomNotes(initial.customNotes)
  }, [open, initial])

  if (!open) return null

  function toggle(key: string) {
    setComponents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave({
      name: name.trim(),
      priceCents: Math.round(Number(priceDollars || 0) * 100),
      description: description.trim(),
      components,
      customNotes: customNotes.trim(),
    })
    setSaving(false)
  }

  const enabledCount = Object.values(components).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-heading text-lg text-navy">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {enabledCount} component{enabledCount === 1 ? '' : 's'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-navy transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Basic info */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Package Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Standard Background Check"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price (USD)</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-400 mr-1">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  placeholder="49"
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Basic + county criminal + sex offender"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Components grid */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
              Included Screening Components
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCREENING_COMPONENTS.map((c) => {
                const on = !!components[c.key]
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      on
                        ? 'border-navy bg-navy/[0.03]'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        on ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d={c.icon}
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium leading-tight ${
                          on ? 'text-navy' : 'text-gray-600'
                        }`}
                      >
                        {c.label}
                      </p>
                    </div>
                    {on && (
                      <svg
                        className="w-4 h-4 text-navy shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Custom Notes / One-off Items</label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={3}
              placeholder="e.g. CDLIS pull, FACIS Level 3, Spanish language disclosure"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Anything that doesn&apos;t fit the standard component list above.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-navy text-white hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  )
}
