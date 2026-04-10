-- PCG Screening — Phase 1 Migration
-- Adds:
--   * referral_source        — "How did you hear about us?" tracking on self-pay flow
--   * consent_document_url   — URL to signed FCRA disclosure PDF (Dropbox Sign upgrade)
--   * consent_signed_at      — Timestamp of when consent was captured (canvas or HelloSign)
--
-- Safe to run multiple times.

alter table candidates
  add column if not exists referral_source text,
  add column if not exists consent_document_url text,
  add column if not exists consent_signed_at timestamptz;

-- Optional: backfill consent_signed_at for any pre-existing signed canvas signatures
-- so historical records have a non-null value when consent_status = 'signed'.
update candidates
   set consent_signed_at = coalesce(consent_signed_at, created_at)
 where consent_status = 'signed'
   and consent_signed_at is null;
