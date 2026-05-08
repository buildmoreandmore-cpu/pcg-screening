export type ResultVerdict = 'clear' | 'record_found' | 'adverse' | 'not_applicable'

/**
 * Component-level workflow stages. Independent of the verdict (clear /
 * record_found / adverse) — a component is "completed" once a verdict is
 * recorded; whether it's "clear" or needs "review" is then a function of
 * that verdict.
 *
 *   ordered   → component is on the package, no work has begun
 *   pending   → work submitted to the vendor, awaiting results
 *   completed → results entered, verdict assigned (clear / records / adverse)
 */
export type ComponentStatus = 'ordered' | 'pending' | 'completed'

export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  ordered: 'Ordered',
  pending: 'Pending',
  completed: 'Completed',
}

export const COMPONENT_STATUS_COLORS: Record<ComponentStatus, string> = {
  ordered: '#6b7280',
  pending: '#0284c7',
  completed: '#16a34a',
}

export interface ComponentResult {
  result: ResultVerdict
  details: string
  /** ISO timestamp when this component's verdict was first set to a non-N/A value. */
  completed_at?: string | null
  /** Workflow stage. Defaults to 'ordered' when missing. */
  component_status?: ComponentStatus
  /** ISO timestamp when component first moved into 'pending'. */
  pending_at?: string | null
}

export type ScreeningResults = Record<string, ComponentResult>

/**
 * Derive the displayed disposition for a component once it's completed:
 * - completed + clear        → "Clear"
 * - completed + record_found → "Review"
 * - completed + adverse      → "Adverse"
 * - any other state          → workflow status label (Ordered / Pending)
 */
export function deriveStageLabel(r: ComponentResult | undefined): string {
  const status = r?.component_status ?? 'ordered'
  if (status !== 'completed') return COMPONENT_STATUS_LABELS[status]
  if (r?.result === 'clear') return 'Completed — Clear'
  if (r?.result === 'record_found') return 'Completed — Review'
  if (r?.result === 'adverse') return 'Completed — Adverse'
  return 'Completed'
}

export interface ReportAttachment {
  id: string
  name: string
  storagePath: string
  uploadedAt: string
  size: number
}

export const VERDICT_LABELS: Record<ResultVerdict, string> = {
  clear: 'Clear',
  record_found: 'Record Found',
  adverse: 'Adverse',
  not_applicable: 'N/A',
}

export const VERDICT_COLORS: Record<ResultVerdict, string> = {
  clear: '#16a34a',
  record_found: '#d97706',
  adverse: '#dc2626',
  not_applicable: '#6b7280',
}
