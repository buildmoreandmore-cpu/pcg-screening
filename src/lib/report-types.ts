export type ResultVerdict = 'clear' | 'record_found' | 'adverse' | 'not_applicable'

/**
 * Workflow stage label as a free string — see COMPONENT_STAGES in
 * screening-components.ts for the per-component-type allowed values.
 * Default flow is `ordered → pending → completed`. Some components have
 * richer flows (drug_screen has collection / lab stages, employment +
 * education have attempt + TWN / manual / pending_response sub-stages).
 */
export type ComponentStatus = string

export const COMPONENT_STATUS_LABELS: Record<string, string> = {
  ordered: 'Ordered',
  pending: 'Pending',
  completed: 'Completed',
}

export const COMPONENT_STATUS_COLORS: Record<string, string> = {
  ordered: '#6b7280',
  pending: '#0284c7',
  completed: '#16a34a',
}

export interface ComponentResult {
  result: ResultVerdict
  details: string
  /** ISO timestamp when this component's verdict was first set to a non-N/A value. */
  completed_at?: string | null
  /** Workflow stage label. Allowed values depend on component type. */
  component_status?: ComponentStatus
  /** ISO timestamp when component first moved away from 'ordered'. */
  pending_at?: string | null
  /**
   * Criminal history sub-tracker: status per jurisdiction level.
   * Keys: 'state' | 'county' | 'federal' (and any custom level Gwen adds).
   * Values: 'pending' | 'completed' | 'no_record' (free string).
   */
  jurisdiction_status?: Record<string, string>
}

export type ScreeningResults = Record<string, ComponentResult>

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

/**
 * Derive the displayed disposition for a component once it's completed:
 * - completed + clear        → "Clear"
 * - completed + record_found → "Review"
 * - completed + adverse      → "Adverse"
 * - any other state          → workflow status label
 */
export function deriveStageLabel(r: ComponentResult | undefined): string {
  const status = r?.component_status ?? 'ordered'
  if (status !== 'completed') return COMPONENT_STATUS_LABELS[status] || status
  if (r?.result === 'clear') return 'Completed — Clear'
  if (r?.result === 'record_found') return 'Completed — Review'
  if (r?.result === 'adverse') return 'Completed — Adverse'
  return 'Completed'
}
