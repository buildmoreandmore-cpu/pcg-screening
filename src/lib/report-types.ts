export type ResultVerdict = 'clear' | 'record_found' | 'adverse' | 'not_applicable'

export interface ComponentResult {
  result: ResultVerdict
  details: string
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
