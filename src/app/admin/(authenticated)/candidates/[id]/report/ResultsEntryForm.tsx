'use client'

import { useState } from 'react'
import { saveScreeningResults } from '@/app/admin/actions/report'
import type { ScreeningResults, ResultVerdict, ComponentStatus } from '@/lib/report-types'
import {
  getStagesForComponent,
  getStageLabel,
  getStageColor,
  getTurnaroundForComponent,
  CRIMINAL_JURISDICTION_LEVELS,
} from '@/lib/screening-components'

const VERDICTS: { value: ResultVerdict; label: string; color: string }[] = [
  { value: 'clear', label: 'Clear', color: 'text-green-600' },
  { value: 'record_found', label: 'Record Found', color: 'text-amber-600' },
  { value: 'adverse', label: 'Adverse', color: 'text-red-600' },
  { value: 'not_applicable', label: 'N/A', color: 'text-gray-400' },
]

const JURISDICTION_STATUSES = [
  { value: '', label: '—' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_record', label: 'No Record' },
] as const

function StageStepper({
  componentKey,
  current,
  onChange,
}: {
  componentKey: string
  current: ComponentStatus
  onChange: (next: ComponentStatus) => void
}) {
  const stages = getStagesForComponent(componentKey)
  let currentIndex = stages.indexOf(current)
  // Legacy 'pending' values on components that now use richer stages
  // (drug_screen, employment, education, criminal_history) won't match
  // any of the new stages literally. Treat them as "in flight" — the
  // first non-ordered stage in the list — so the stepper still shows
  // forward progress instead of looking blank.
  if (currentIndex === -1 && current === 'pending') {
    currentIndex = Math.min(1, stages.length - 2)
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stages.map((stage, i) => {
        const isActive = i === currentIndex
        const isPast = i < currentIndex
        const stageColor = getStageColor(stage)
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onChange(stage)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              isActive
                ? stage === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
                : isPast
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
            aria-pressed={isActive}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isActive ? stageColor : isPast ? '#9ca3af' : '#d1d5db',
              }}
            />
            {getStageLabel(stage)}
          </button>
        )
      })}
    </div>
  )
}

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
      r[key] = initialResults[key] || {
        result: 'not_applicable',
        details: '',
        component_status: 'ordered',
      }
    }
    return r
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateResult(key: string, field: 'result' | 'details', value: string) {
    setResults(prev => {
      const current = prev[key]
      const updated = { ...current, [field]: value }

      if (field === 'result') {
        const wasNotApplicable = !current?.result || current.result === 'not_applicable'
        const becomingResolved = value !== 'not_applicable'
        if (wasNotApplicable && becomingResolved && !current?.completed_at) {
          updated.completed_at = new Date().toISOString()
        }
        if (value === 'not_applicable') {
          updated.completed_at = null
        }
        if (becomingResolved) {
          updated.component_status = 'completed'
        } else if (current?.component_status === 'completed') {
          updated.component_status = 'pending'
        }
      }

      const next = { ...prev, [key]: updated }
      onResultsChange?.(next)
      return next
    })
    setSaved(false)
  }

  function updateStage(key: string, stage: ComponentStatus) {
    setResults(prev => {
      const current = prev[key]
      const updated: typeof current = { ...current, component_status: stage }

      if (stage !== 'ordered' && !current?.pending_at) {
        updated.pending_at = new Date().toISOString()
      }
      if (stage === 'completed' && !current?.completed_at) {
        updated.completed_at = new Date().toISOString()
      }

      const next = { ...prev, [key]: updated }
      onResultsChange?.(next)
      return next
    })
    setSaved(false)
  }

  function updateJurisdiction(key: string, level: string, status: string) {
    setResults(prev => {
      const current = prev[key]
      const existing = current?.jurisdiction_status ?? {}
      const nextJurisdiction = { ...existing }
      if (status === '') {
        delete nextJurisdiction[level]
      } else {
        nextJurisdiction[level] = status
      }
      const updated = { ...current, jurisdiction_status: nextJurisdiction }
      const next = { ...prev, [key]: updated }
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

  // Aggregate counts: anything not in a final ('completed') stage counts as in-progress
  const completedCount = components.filter(c => results[c.key]?.component_status === 'completed').length
  const orderedCount = components.filter(c => (results[c.key]?.component_status ?? 'ordered') === 'ordered').length
  const inFlightCount = components.length - completedCount - orderedCount

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-medium text-navy">Step 1: Screening Results</h2>
          <p className="text-xs text-gray-400 mt-0.5">Track each component through its workflow and capture the verdict.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {orderedCount} ordered
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            {inFlightCount} in flight
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            {completedCount} completed
          </span>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {components.map(({ key, label }) => {
          const stage = results[key]?.component_status ?? 'ordered'
          const turnaround = getTurnaroundForComponent(key)
          const isCriminal = key === 'criminal_history'

          return (
            <div key={key} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  {turnaround && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Est. turnaround: {turnaround.label}
                    </p>
                  )}
                </div>
                <StageStepper
                  componentKey={key}
                  current={stage}
                  onChange={(next) => updateStage(key, next)}
                />
              </div>

              {/* Per-jurisdiction tracker for criminal history */}
              {isCriminal && (
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-2.5">
                  {CRIMINAL_JURISDICTION_LEVELS.map((level) => {
                    const currentStatus = results[key]?.jurisdiction_status?.[level] || ''
                    return (
                      <div key={level} className="space-y-1">
                        <label className="block text-[11px] text-gray-500 capitalize">{level}</label>
                        <select
                          value={currentStatus}
                          onChange={(e) => updateJurisdiction(key, level, e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold"
                        >
                          {JURISDICTION_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Verdict</p>
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
          )
        })}
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
