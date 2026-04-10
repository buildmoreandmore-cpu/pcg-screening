-- Extended candidate fields to match PCG consent form requirements.
-- Full SSN is encrypted at rest by Supabase; access is service-key only.

alter table public.candidates
  add column if not exists ssn_full text,
  add column if not exists drivers_license_number text,
  add column if not exists drivers_license_state text,
  add column if not exists sex text,
  add column if not exists race text,
  add column if not exists maiden_name text,
  add column if not exists purpose_code text default 'E';

comment on column public.candidates.ssn_full is
  'Full 9-digit SSN (XXX-XX-XXXX). Stored encrypted at rest. Never exposed to client-side code.';
comment on column public.candidates.drivers_license_number is
  'State-issued driver license or ID number.';
comment on column public.candidates.drivers_license_state is
  'Two-letter state code for the driver license.';
comment on column public.candidates.sex is
  'Sex/gender as reported by the applicant (Male, Female, Other).';
comment on column public.candidates.race is
  'Race as reported by the applicant.';
comment on column public.candidates.maiden_name is
  'Maiden name or other name previously used.';
comment on column public.candidates.purpose_code is
  'Employment purpose code: E=regular, M=mentally disabled, N=elder care, W=children.';
