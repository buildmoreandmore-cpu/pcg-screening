-- Run this in Supabase SQL Editor to update existing submissions table
-- Adds Stripe and Dropbox Sign columns

-- Add new columns
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS signature_request_id text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS consent_status text DEFAULT 'pending';

-- Remove old signature columns (no longer needed with Dropbox Sign)
ALTER TABLE submissions DROP COLUMN IF EXISTS signature_type;
ALTER TABLE submissions DROP COLUMN IF EXISTS signature_value;
ALTER TABLE submissions DROP COLUMN IF EXISTS consent_agreed;

-- Add index for signature request lookups (used by webhook)
CREATE INDEX IF NOT EXISTS idx_submissions_signature_request ON submissions(signature_request_id);
