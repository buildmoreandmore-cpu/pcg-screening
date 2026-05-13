import {
  SCREENING_COMPONENTS,
  expandActiveComponents,
  getStagesForComponent,
  getStageLabel,
  getStageColor,
  getTurnaroundForComponent,
  CRIMINAL_JURISDICTION_LEVELS,
  drugPanelLabel,
} from '@/lib/screening-components'
import { VERDICT_LABELS, VERDICT_COLORS } from '@/lib/report-types'
import type { ScreeningResults, ComponentResult } from '@/lib/report-types'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Read-only per-component tracker for the employer portal.
 *
 * Mirrors the admin Results view but with no editing — employers see
 * exactly where each component is in its workflow, the estimated
 * turnaround window, and (for criminal) the per-jurisdiction breakdown
 * Adam asked Elevait for.
 */
export default function ComponentTrackerPortal({
  screeningComponents,
  screeningResults,
  drugPanel,
}: {
  screeningComponents: Record<string, unknown> | null
  screeningResults: ScreeningResults | null
  drugPanel: string | null
}) {
  const activeKeys = expandActiveComponents(screeningComponents)
  if (activeKeys.length === 0) {
    return null
  }

  const results = screeningResults ?? {}

  // Aggregate completion stats so the employer sees pending vs completed
  // at a glance — Adam specifically asked for "clear indication of what
  // is pending vs. completed".
  const componentsWithStatus = activeKeys.map((key) => {
    const stored: ComponentResult | undefined = results[key] as ComponentResult | undefined
    const inferredStatus: string =
      stored?.component_status ??
      (stored && stored.result && stored.result !== 'not_applicable' ? 'completed' : 'ordered')
    return { key, stored, inferredStatus }
  })

  const completedCount = componentsWithStatus.filter(c => c.inferredStatus === 'completed').length
  const totalCount = componentsWithStatus.length
  const overallComplete = completedCount === totalCount

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-medium text-gray-700">Component Tracking</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Each background check tracked independently with current status and notes.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            overallComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {overallComplete ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
          {completedCount} of {totalCount} completed
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {componentsWithStatus.map(({ key, stored, inferredStatus }) => {
          const label = SCREENING_COMPONENTS.find(sc => sc.key === key)?.label || key
          const turnaround = getTurnaroundForComponent(key)
          const stages = getStagesForComponent(key)
          let currentIndex = stages.indexOf(inferredStatus)
          // Legacy 'pending' fallback so progress bar still highlights.
          if (currentIndex === -1 && inferredStatus === 'pending') {
            currentIndex = Math.min(1, stages.length - 2)
          }

          // Stage-aware display: once completed, show the verdict;
          // otherwise show the stage name.
          const isCompleted = inferredStatus === 'completed'
          const statusText = isCompleted
            ? VERDICT_LABELS[stored?.result || 'not_applicable']
            : getStageLabel(inferredStatus)
          const statusColor = isCompleted
            ? VERDICT_COLORS[stored?.result || 'not_applicable']
            : getStageColor(inferredStatus)

          const isCriminal = key === 'criminal_history'
          const isDrugScreen = key === 'drug_screen'

          return (
            <div key={key} className="px-5 py-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400 flex-wrap">
                    {turnaround && <span>Est. turnaround: {turnaround.label}</span>}
                    {isDrugScreen && drugPanel && <span>Panel: {drugPanelLabel(drugPanel)}</span>}
                    {stored?.completed_at && (
                      <span>Completed: {formatDate(stored.completed_at)}</span>
                    )}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${statusColor}1a`,
                    color: statusColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                  {statusText}
                </span>
              </div>

              {/* Progress bar — visualizes where we are in the stage flow */}
              <div className="flex items-center gap-1">
                {stages.map((stage, i) => {
                  const isPast = i <= currentIndex
                  return (
                    <div
                      key={stage}
                      className="flex-1 h-1 rounded-full"
                      style={{
                        backgroundColor: isPast ? statusColor : '#e5e7eb',
                      }}
                      title={getStageLabel(stage)}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{getStageLabel(stages[0])}</span>
                <span>{getStageLabel(stages[stages.length - 1])}</span>
              </div>

              {/* Criminal jurisdiction sub-tracker */}
              {isCriminal && stored?.jurisdiction_status && Object.keys(stored.jurisdiction_status).length > 0 && (
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-2.5">
                  {CRIMINAL_JURISDICTION_LEVELS.map((level) => {
                    const jurStatus = stored.jurisdiction_status?.[level]
                    if (!jurStatus) return (
                      <div key={level} className="text-center">
                        <p className="text-[10px] text-gray-400 capitalize">{level}</p>
                        <p className="text-[11px] text-gray-300">—</p>
                      </div>
                    )
                    const isJurDone = jurStatus === 'completed' || jurStatus === 'no_record'
                    return (
                      <div key={level} className="text-center">
                        <p className="text-[10px] text-gray-500 capitalize">{level}</p>
                        <p className={`text-[11px] font-medium capitalize ${
                          isJurDone ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          {jurStatus.replace(/_/g, ' ')}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Notes / details visible only when something's filled in */}
              {stored?.details && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Notes</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{stored.details}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
