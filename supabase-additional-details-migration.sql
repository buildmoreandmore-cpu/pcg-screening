-- Add additional_details JSONB column for service-specific form fields
-- (education verification, employment history, professional license, etc.)
-- Also adds DL class and expiration date columns.
alter table public.candidates
  add column if not exists additional_details jsonb default '{}',
  add column if not exists drivers_license_class text,
  add column if not exists drivers_license_expiration text;

comment on column public.candidates.additional_details is
  'Service-specific form fields (education, employment, license, international countries, references) as JSON.';
comment on column public.candidates.drivers_license_class is
  'Driver license class (A, B, C, D, M, CDL-A, CDL-B, CDL-C, Permit, Other, N/A).';
comment on column public.candidates.drivers_license_expiration is
  'Driver license expiration date.';
