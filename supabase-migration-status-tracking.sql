-- PCG Screening — Status Tracking & SLA Monitoring Migration
-- Run this in Supabase SQL Editor

-- Add status tracking columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS screening_started_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS screening_completed_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ DEFAULT now();
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status_notes TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS sla_flagged BOOLEAN DEFAULT false;

-- Create status history audit trail
CREATE TABLE IF NOT EXISTS status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_history_submission ON status_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_sla ON submissions(status, screening_started_at) WHERE sla_flagged = false;
CREATE INDEX IF NOT EXISTS idx_submissions_confirmation ON submissions(confirmation_code);

-- RLS on status_history (service role only, matching submissions policy)
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON status_history FOR ALL USING (true) WITH CHECK (true);
