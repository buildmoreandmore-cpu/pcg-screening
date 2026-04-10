-- FCRA consent audit columns
-- Adds defensible consent metadata to the candidates table so we can
-- reproduce exactly what a candidate saw and signed. The disclosure version
-- string here matches FCRA_DISCLOSURE_VERSION in src/lib/fcra-disclosure.ts.
--
-- Idempotent. Safe to re-run. Backfills historic canvas signatures from the
-- legacy submissions table for any rows that match by tracking_code.

alter table public.candidates
  add column if not exists consent_ip text,
  add column if not exists consent_user_agent text,
  add column if not exists consent_method text,                 -- 'canvas' | 'dropbox_sign'
  add column if not exists consent_signature_data_url text,     -- base64 PNG of canvas signature
  add column if not exists consent_disclosure_version text;     -- matches FCRA_DISCLOSURE_VERSION

comment on column public.candidates.consent_ip is
  'Client IP captured at time of electronic signature (first entry of X-Forwarded-For).';
comment on column public.candidates.consent_user_agent is
  'User-Agent header captured at time of electronic signature.';
comment on column public.candidates.consent_method is
  'How consent was captured: canvas (native in-intake) or dropbox_sign.';
comment on column public.candidates.consent_signature_data_url is
  'Base64-encoded PNG data URL from the canvas signature pad.';
comment on column public.candidates.consent_disclosure_version is
  'Version tag for the FCRA disclosure text rendered to the candidate (see src/lib/fcra-disclosure.ts).';

-- Backfill historic canvas signatures from the legacy submissions table.
-- IP/UA/version stay null for historical rows; that is expected.
update public.candidates c
   set consent_signature_data_url = s.signature_value,
       consent_method = 'canvas'
  from public.submissions s
 where c.tracking_code = s.confirmation_code
   and c.consent_signature_data_url is null
   and s.signature_value is not null
   and s.signature_type = 'canvas';
