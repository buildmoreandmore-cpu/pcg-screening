-- Add screening results and report attachments columns for report generation
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS screening_results jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS report_attachments jsonb DEFAULT '[]';

COMMENT ON COLUMN candidates.screening_results IS
  'Per-component screening results: { [componentKey]: { result, details } }';
COMMENT ON COLUMN candidates.report_attachments IS
  'Supplementary report attachments metadata: [{ id, name, storagePath, uploadedAt, size }]';
